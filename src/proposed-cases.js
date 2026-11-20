/**
 * Machine-readable index of the cases listed by the upstream host-test proposal.
 * This metadata is not itself an executable conformance suite.
 */
const core = [
  ["lifecycle/initialize-capabilities", "MUST", "automatic"],
  ["lifecycle/tool-input", "MUST", "automatic"],
  ["lifecycle/tool-input-partial-stop", "MUST", "automatic"],
  ["lifecycle/tool-result", "MUST", "automatic"],
  ["tools/proxy-call", "MUST", "automatic"],
  ["visibility/app-tool-call-guard", "MUST NOT", "automatic"],
  ["dimensions/listen-size-changed", "MUST", "automatic"],
  ["security/sandbox-distinct-origin", "MUST", "automatic"],
  ["security/sandbox-permissions", "MUST", "automatic"],
  ["security/sandbox-proxy-required", "MUST", "automatic"],
  ["security/csp-construct-from-domains", "MUST", "automatic"],
  ["security/csp-allow-declared", "MUST", "automatic"],
  ["security/csp-no-loosening", "MUST NOT", "automatic"],
  ["context/initialize-hostcontext", "SHOULD", "automatic"],
  ["context/light-dark", "SHOULD", "automatic"],
  ["capabilities/server-passthrough", "SHOULD", "automatic"],
  ["context/theme-variables", "MAY", "automatic"],
  ["context/theme-fonts", "MAY", "automatic"],
  ["visibility/app-tool-hidden", "MUST NOT", "host-interaction"],
  ["security/iframe-sandboxed", "MUST", "host-interaction"],
  ["links/open-external", "SHOULD", "host-interaction"],
  ["security/csp-audit-log", "SHOULD", "host-interaction"],
].map(([id, clause, category]) => ({ id, suite: "core", spec: "2026-01-26", clause, category }));

const isolated = [
  ["display/return-resulting-mode", "MUST", "automatic"],
  ["display/no-undeclared-mode", "MUST NOT", "automatic"],
  ["display/unavailable-returns-current", "SHOULD", "automatic"],
  ["messages/add-to-conversation", "SHOULD", "host-interaction"],
  ["model-context/provide-future-turns", "SHOULD", "host-interaction"],
  ["model-context/last-wins", "SHOULD", "host-interaction"],
  ["context/context-changed", "MAY", "host-interaction"],
].map(([id, clause, category]) => ({ id, suite: id, spec: "2026-01-26", clause, category }));

const draft = [
  ["capabilities/content-modalities", "MAY", "automatic"],
  ["sampling/create-message", "SHOULD", "host-interaction"],
  ["download-file/confirm", "SHOULD", "host-interaction"],
  ["app-tools/call", "MAY", "host-interaction"],
].map(([id, clause, category]) => ({ id, suite: "draft", spec: "draft", clause, category }));

export const PROPOSED_CASES = Object.freeze(
  [...core, ...isolated, ...draft].map((testCase) => Object.freeze(testCase)),
);

export const PROPOSED_CASE_COUNTS = Object.freeze({
  core: core.length,
  isolated: isolated.length,
  draft: draft.length,
  total: core.length + isolated.length + draft.length,
});
