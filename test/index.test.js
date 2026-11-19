import test from "node:test";
import assert from "node:assert/strict";
import { runConformance, toJUnitXml } from "../src/index.js";

function makeHost(overrides = {}) {
  return {
    async probe() {
      return {
        name: "Example Host",
        protocolVersion: "2025-11-25",
        capabilities: { tools: true, resources: true },
      };
    },
    async openApp() {
      return {
        id: "session-1",
        origin: "https://app.example",
        lifecycleEvents: ["initialized", "ready"],
      };
    },
    async request(_sessionId, request) {
      return { id: request.id, result: {} };
    },
    async closeApp() {
      return { closed: true };
    },
    ...overrides,
  };
}

const options = {
  resourceUri: "ui://example/app",
  appOrigin: "https://app.example",
  requiredCapabilities: ["tools", "resources"],
};

test("passes a valid host and emits stable check names", async () => {
  const report = await runConformance(makeHost(), options);
  assert.equal(report.status, "passed");
  assert.deepEqual(report.checks.map((check) => check.name), [
    "host-probe", "required-capabilities", "session-shape", "origin-policy",
    "lifecycle-order", "message-correlation", "session-close",
  ]);
});

test("marks missing capabilities as a failure", async () => {
  const report = await runConformance(makeHost({
    async probe() {
      return { name: "Limited", protocolVersion: "1", capabilities: { tools: true } };
    },
  }), options);
  assert.equal(report.status, "failed");
  assert.match(report.checks[1].detail, /resources/);
});

test("rejects an origin outside the configured allowlist", async () => {
  const report = await runConformance(makeHost({
    async openApp() {
      return { id: "session-1", origin: "https://attacker.example", lifecycleEvents: ["initialized", "ready"] };
    },
  }), options);
  assert.equal(report.checks.find((check) => check.name === "origin-policy").status, "failed");
  assert.equal(report.checks.at(-1).name, "session-close");
});

test("rejects non-origin allowlist and host values", async () => {
  await assert.rejects(() => runConformance(makeHost(), {
    ...options,
    allowedOrigins: ["https://app.example/path"],
  }), /canonical HTTP\(S\) origins/);
  const report = await runConformance(makeHost({
    async openApp() {
      return { id: "session-1", origin: "https://app.example/path", lifecycleEvents: ["initialized", "ready"] };
    },
  }), options);
  assert.equal(report.checks.find((check) => check.name === "origin-policy").status, "failed");
});

test("closes an opened session when a request throws", async () => {
  let closed = false;
  const report = await runConformance(makeHost({
    async request() {
      throw new Error("transport reset");
    },
    async closeApp() {
      closed = true;
      return { closed: true };
    },
  }), options);
  assert.equal(closed, true);
  assert.equal(report.checks.at(-1).status, "passed");
  assert.equal(report.status, "failed");
});

test("records cleanup when an opened session has an invalid shape", async () => {
  const report = await runConformance(makeHost({
    async openApp() {
      return { id: "session-1" };
    },
  }), options);
  assert.equal(report.status, "failed");
  assert.equal(report.checks.find((check) => check.name === "session-shape").status, "failed");
  assert.equal(report.checks.at(-1).name, "session-close");
});

test("validates the options and adapter before opening a host", async () => {
  await assert.rejects(() => runConformance({}, options), /adapter\.probe/);
  await assert.rejects(() => runConformance(makeHost(), { ...options, appOrigin: "https://app.example/path" }), /canonical/);
});

test("escapes failure text in JUnit output", () => {
  const xml = toJUnitXml({ checks: [{ name: "unsafe", status: "failed", detail: "<bad & broken>\u0001" }] });
  assert.match(xml, /&lt;bad &amp; broken&gt;/);
  assert.match(xml, /�/);
  assert.doesNotMatch(xml, /\u0001/);
});
