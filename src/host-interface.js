/**
 * Adapter-contract smoke checks and the first behavioral case for the MCP Apps
 * host test interface proposed in modelcontextprotocol/ext-apps#743. This is
 * an experimental partial suite, not a certification suite; host-specific
 * automation and most proposed behavior cases are not bundled.
 */

export const HOST_TEST_METHODS = Object.freeze([
  "displayTestApp",
  "resetEnvironment",
  "getConversation",
  "getConversationContext",
  "changeHostContext",
  "confirmAction",
  "sendMessage",
  "callTool",
]);

export const HOST_TEST_SUITES = Object.freeze([
  "core",
  "draft",
  "messages/add-to-conversation",
  "model-context/provide-future-turns",
  "model-context/last-wins",
  "context/context-changed",
  "display/return-resulting-mode",
  "display/no-undeclared-mode",
  "display/unavailable-returns-current",
]);

function addCheck(checks, name, passed, detail) {
  checks.push({ name, status: passed ? "passed" : "failed", detail });
}

function makeReport(suite, checks) {
  return {
    schemaVersion: 1,
    suite,
    scope: "adapter-smoke",
    status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
    checks,
  };
}

function getMissingMethods(adapter) {
  if (!adapter || typeof adapter !== "object") return [...HOST_TEST_METHODS];
  return HOST_TEST_METHODS.filter((method) => typeof adapter[method] !== "function");
}

function isIframeElement(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.tagName === "string"
    && value.tagName.toLowerCase() === "iframe"
    && typeof value.hasAttribute === "function";
}

function errorDetail(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Check that an adapter has the proposed methods, can launch one suite, and
 * exposes a sandboxed iframe. The environment is reset both before and after
 * the launch so the adapter can be run repeatedly from local tools or CI.
 *
 * @param {object} adapter An implementation of the proposed HostTestInterface.
 * @param {{suite?: string}} [options]
 * @returns {Promise<{schemaVersion: number, suite: string, scope: string, status: string, checks: Array<object>}>}
 */
export async function runHostInterfaceSmoke(adapter, options = {}) {
  const suite = options.suite ?? "core";
  if (!HOST_TEST_SUITES.includes(suite)) {
    throw new TypeError("suite must be one of the suites in HOST_TEST_SUITES");
  }

  const checks = [];
  const missing = getMissingMethods(adapter);
  addCheck(
    checks,
    "host-interface-methods",
    missing.length === 0,
    missing.length === 0
      ? "All proposed host test interface methods are present."
      : "Missing methods: " + missing.join(", "),
  );
  if (missing.length > 0) return makeReport(suite, checks);

  let readyToLaunch = false;
  try {
    try {
      await adapter.resetEnvironment();
      readyToLaunch = true;
      addCheck(checks, "environment-reset-before", true, "The adapter reset the host before launching the suite.");
    } catch (error) {
      addCheck(checks, "environment-reset-before", false, errorDetail(error));
    }

    if (readyToLaunch) {
      try {
        const iframe = await adapter.displayTestApp(suite);
        const validIframe = isIframeElement(iframe);
        addCheck(
          checks,
          "test-app-iframe",
          validIframe,
          validIframe ? "The adapter returned an iframe element." : "displayTestApp must return an iframe element.",
        );

        if (validIframe) {
          let sandboxed = false;
          try {
            sandboxed = iframe.hasAttribute("sandbox");
          } catch {
            sandboxed = false;
          }
          addCheck(
            checks,
            "iframe-sandbox-attribute",
            sandboxed,
            sandboxed ? "The launched iframe has a sandbox attribute." : "The launched iframe is missing its sandbox attribute.",
          );
        }
      } catch (error) {
        addCheck(checks, "test-app-launch", false, errorDetail(error));
      }
    } else {
      addCheck(checks, "test-app-launch", false, "Skipped because the pre-launch environment reset failed.");
    }
  } finally {
    try {
      await adapter.resetEnvironment();
      addCheck(checks, "environment-reset-after", true, "The adapter reset the host after the smoke check.");
    } catch (error) {
      addCheck(checks, "environment-reset-after", false, errorDetail(error));
    }
  }

  return makeReport(suite, checks);
}

export const HOST_INTERFACE_CASES = Object.freeze([
  "visibility/app-tool-hidden",
]);

function makeCaseReport(caseId, checks) {
  return {
    schemaVersion: 1,
    suite: "core",
    scope: "behavioral-case",
    caseId,
    status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
    checks,
  };
}

/**
 * Run one proposal-aligned behavioral case against a host adapter.
 *
 * A passing result requires the fixture's app-only conformance_probe tool to
 * be absent and its model-visible conformance_model_probe control to be present.
 *
 * @param {object} adapter An implementation of the proposed host test interface.
 * @param {string} caseId A case identifier from HOST_INTERFACE_CASES.
 * @returns {Promise<{schemaVersion: number, suite: string, scope: string, caseId: string, status: string, checks: Array<object>}>}
 */
export async function runHostInterfaceCase(adapter, caseId) {
  if (!HOST_INTERFACE_CASES.includes(caseId)) {
    throw new TypeError("caseId must be one of the identifiers in HOST_INTERFACE_CASES");
  }

  const checks = [];
  const missing = getMissingMethods(adapter);
  addCheck(
    checks,
    "host-interface-methods",
    missing.length === 0,
    missing.length === 0
      ? "All proposed host test interface methods are present."
      : "Missing methods: " + missing.join(", "),
  );
  if (missing.length > 0) return makeCaseReport(caseId, checks);

  let readyToLaunch = false;
  try {
    try {
      await adapter.resetEnvironment();
      readyToLaunch = true;
      addCheck(checks, "environment-reset-before", true, "The adapter reset the host before launching the case.");
    } catch (error) {
      addCheck(checks, "environment-reset-before", false, errorDetail(error));
    }

    if (readyToLaunch) {
      let iframeReady = false;
      try {
        const iframe = await adapter.displayTestApp("core");
        iframeReady = isIframeElement(iframe);
        addCheck(
          checks,
          "test-app-iframe",
          iframeReady,
          iframeReady ? "The adapter returned the launched test app iframe." : "displayTestApp must return an iframe element.",
        );
      } catch (error) {
        addCheck(checks, "test-app-iframe", false, errorDetail(error));
      }

      if (iframeReady) {
        try {
          const context = await adapter.getConversationContext();
          const tools = context && context.tools;
          const validToolList = Array.isArray(tools) && tools.every((name) => typeof name === "string");
          addCheck(
            checks,
            "model-tool-list-shape",
            validToolList,
            validToolList ? "The adapter returned the model-visible tool names." : "getConversationContext().tools must be an array of strings.",
          );

          if (validToolList) {
            const appOnlyHidden = !tools.includes("conformance_probe");
            addCheck(
              checks,
              "visibility/app-tool-hidden",
              appOnlyHidden,
              appOnlyHidden
                ? "The app-only conformance_probe tool is absent from the model tool list."
                : "The app-only conformance_probe tool leaked into the model tool list.",
            );
            const modelControlVisible = tools.includes("conformance_model_probe");
            addCheck(
              checks,
              "visibility/model-control-visible",
              modelControlVisible,
              modelControlVisible
                ? "The model-visible control tool is present in the model tool list."
                : "The model-visible conformance_model_probe control is missing; the fixture may not be loaded.",
            );
          }
        } catch (error) {
          addCheck(checks, "model-tool-list-shape", false, errorDetail(error));
        }
      }
    } else {
      addCheck(checks, "test-app-iframe", false, "Skipped because the pre-launch environment reset failed.");
    }
  } finally {
    try {
      await adapter.resetEnvironment();
      addCheck(checks, "environment-reset-after", true, "The adapter reset the host after the case.");
    } catch (error) {
      addCheck(checks, "environment-reset-after", false, errorDetail(error));
    }
  }

  return makeCaseReport(caseId, checks);
}
