import test from "node:test";
import assert from "node:assert/strict";
import { runHostInterfaceCase, runHostInterfaceSmoke } from "../src/host-interface.js";

function adapter({ tools = ["conformance_model_probe"], throwOnReset = false } = {}) {
  const state = { resets: 0, launches: 0 };
  return {
    state,
    async resetEnvironment() {
      state.resets += 1;
      if (throwOnReset && state.resets === 1) throw new Error("reset failed");
    },
    async displayTestApp() {
      state.launches += 1;
      return { tagName: "IFRAME", hasAttribute: (name) => name === "sandbox" };
    },
    async getConversation() { return []; },
    async getConversationContext() { return { tools, modelContext: [] }; },
    async changeHostContext() {},
    async confirmAction() {},
    async sendMessage() {},
    async callTool() { return {}; },
  };
}

test("behavioral visibility case passes with hidden app tool and visible model control", async () => {
  const host = adapter();
  const result = await runHostInterfaceCase(host, "visibility/app-tool-hidden");
  assert.equal(result.status, "passed");
  assert.equal(result.scope, "behavioral-case");
  assert.equal(host.state.resets, 2);
  assert.equal(host.state.launches, 1);
});

test("behavioral visibility case fails when app-only tool leaks into model context", async () => {
  const result = await runHostInterfaceCase(adapter({
    tools: ["conformance_probe", "conformance_model_probe"],
  }), "visibility/app-tool-hidden");
  assert.equal(result.status, "failed");
  assert.ok(result.checks.some((check) => check.name === "visibility/app-tool-hidden" && check.status === "failed"));
});

test("behavioral visibility case fails if positive control is missing", async () => {
  const result = await runHostInterfaceCase(adapter({ tools: [] }), "visibility/app-tool-hidden");
  assert.equal(result.status, "failed");
  assert.ok(result.checks.some((check) => check.name === "visibility/model-control-visible" && check.status === "failed"));
});

test("smoke and case reject invalid suites and case IDs", async () => {
  await assert.rejects(runHostInterfaceSmoke(adapter(), { suite: "missing" }), /suite must be one/);
  await assert.rejects(runHostInterfaceCase(adapter(), "missing"), /caseId must be one/);
});
