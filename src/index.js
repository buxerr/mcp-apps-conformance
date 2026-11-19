const REQUIRED_ADAPTER_METHODS = ["probe", "openApp", "request", "closeApp"];

function addCheck(checks, name, passed, detail) {
  checks.push({ name, status: passed ? "passed" : "failed", detail });
}

function escapeXml(value) {
  return String(value)
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, "�")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function isCanonicalHttpOrigin(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.origin === value;
  } catch {
    return false;
  }
}

function validateOptions(options) {
  if (!options || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }
  if (typeof options.resourceUri !== "string" || options.resourceUri.length === 0) {
    throw new TypeError("resourceUri must be a non-empty string");
  }
  if (typeof options.appOrigin !== "string" || options.appOrigin.length === 0) {
    throw new TypeError("appOrigin must be a non-empty string");
  }
  if (!isCanonicalHttpOrigin(options.appOrigin)) {
    throw new TypeError("appOrigin must be a canonical HTTP(S) origin without a path");
  }
  const allowedOrigins = options.allowedOrigins ?? [options.appOrigin];
  if (!Array.isArray(allowedOrigins) || allowedOrigins.some((value) => typeof value !== "string")) {
    throw new TypeError("allowedOrigins must be an array of origin strings");
  }
  if (allowedOrigins.some((value) => !isCanonicalHttpOrigin(value))) {
    throw new TypeError("allowedOrigins entries must be canonical HTTP(S) origins without paths");
  }
  const requiredCapabilities = options.requiredCapabilities ?? [];
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.some((value) => typeof value !== "string")) {
    throw new TypeError("requiredCapabilities must be an array of strings");
  }
  return { ...options, allowedOrigins, requiredCapabilities };
}

function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== "object") {
    throw new TypeError("adapter must be an object");
  }
  for (const method of REQUIRED_ADAPTER_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new TypeError("adapter." + method + " must be a function");
    }
  }
}

export async function runConformance(adapter, rawOptions) {
  validateAdapter(adapter);
  const options = validateOptions(rawOptions);
  const checks = [];
  let host;
  let session;

  try {
    host = await adapter.probe();
    const validHost = host && typeof host.name === "string" && host.name.length > 0
      && typeof host.protocolVersion === "string" && host.protocolVersion.length > 0
      && host.capabilities && typeof host.capabilities === "object" && !Array.isArray(host.capabilities);
    addCheck(checks, "host-probe", Boolean(validHost), validHost ? "Host metadata is complete." : "Host metadata is incomplete.");
    if (!validHost) return makeReport(host, checks);

    const missing = options.requiredCapabilities.filter((name) => host.capabilities[name] !== true);
    addCheck(checks, "required-capabilities", missing.length === 0,
      missing.length ? "Missing capabilities: " + missing.join(", ") : "All required capabilities are advertised.");

    session = await adapter.openApp({
      resourceUri: options.resourceUri,
      appOrigin: options.appOrigin,
      allowedOrigins: [...options.allowedOrigins],
    });
    const validSession = session && typeof session.id === "string" && session.id.length > 0
      && typeof session.origin === "string" && Array.isArray(session.lifecycleEvents);
    addCheck(checks, "session-shape", Boolean(validSession),
      validSession ? "Session has an id, origin, and lifecycle trace." : "Session is missing required fields.");
    if (validSession) {
      const originAllowed = isCanonicalHttpOrigin(session.origin) && options.allowedOrigins.includes(session.origin);
      addCheck(checks, "origin-policy", originAllowed,
        originAllowed ? "App origin is on the allowlist." : "Host opened an origin outside the allowlist.");
      const initializedAt = session.lifecycleEvents.indexOf("initialized");
      const readyAt = session.lifecycleEvents.indexOf("ready");
      const lifecycleValid = initializedAt >= 0 && readyAt > initializedAt;
      addCheck(checks, "lifecycle-order", lifecycleValid,
        lifecycleValid ? "initialized precedes ready." : "Expected initialized before ready.");

      const request = { id: "mcp-apps-conformance-ping", method: "mcp/ping", params: {} };
      const response = await adapter.request(session.id, request);
      const correlated = response && response.id === request.id;
      addCheck(checks, "message-correlation", Boolean(correlated),
        correlated ? "Ping response preserves the request id." : "Ping response id does not match the request.");
    }
  } catch (error) {
    addCheck(checks, "adapter-error", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (session && typeof session.id === "string" && session.id.length > 0) {
      try {
        const closed = await adapter.closeApp(session.id);
        addCheck(checks, "session-close", Boolean(closed && closed.closed === true),
          closed && closed.closed === true ? "Host confirmed session closure." : "Host did not confirm session closure.");
      } catch (error) {
        addCheck(checks, "session-close", false, error instanceof Error ? error.message : String(error));
      }
    }
  }
  return makeReport(host, checks);
}

function makeReport(host, checks) {
  const passed = checks.every((check) => check.status === "passed");
  return {
    schemaVersion: 1,
    status: passed ? "passed" : "failed",
    host: host && typeof host === "object" ? { name: host.name ?? null, protocolVersion: host.protocolVersion ?? null } : null,
    checks,
  };
}

export function toJUnitXml(report) {
  if (!report || !Array.isArray(report.checks)) {
    throw new TypeError("report.checks must be an array");
  }
  const failures = report.checks.filter((check) => check.status !== "passed");
  const cases = report.checks.map((check) => {
    const failure = check.status === "passed"
      ? ""
      : "<failure message=\"" + escapeXml(check.detail) + "\"/>";
    return "  <testcase classname=\"mcp-apps-host\" name=\"" + escapeXml(check.name) + "\">" + failure + "</testcase>";
  });
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<testsuite name=\"mcp-apps-conformance\" tests=\"" + report.checks.length + "\" failures=\"" + failures.length + "\">",
    ...cases,
    "</testsuite>",
    "",
  ].join("\n");
}
