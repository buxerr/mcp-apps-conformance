# MCP Apps Conformance

A small, dependency-free conformance runner for MCP Apps host adapters. It exercises host metadata, required capabilities, app-origin policy, lifecycle ordering, request correlation, and session cleanup. Reports use stable check names and can be exported as JUnit XML for CI.

The package defines an adapter boundary instead of automating a particular host UI. Implement the four adapter methods (probe, openApp, request, and closeApp) for the host you want to verify, then pass that adapter to runConformance.

## Install and run

Run npm test with Node.js 20 or newer. The test suite uses only Node's built-in test runner.

## Minimal adapter

    const adapter = {
      async probe() {
        return { name: "My host", protocolVersion: "1", capabilities: { tools: true } };
      },
      async openApp(input) {
        return { id: "session", origin: input.appOrigin, lifecycleEvents: ["initialized", "ready"] };
      },
      async request(_sessionId, request) {
        return { id: request.id, result: {} };
      },
      async closeApp() {
        return { closed: true };
      },
    };

The runner sends only a deterministic mcp/ping request. It does not contact a model provider or execute app code itself. Host adapters should enforce their own transport timeouts and must not treat a failed conformance report as a successful release check.

## Current scope

This is an initial adapter contract and test runner. It does not yet implement browser automation, cross-host result aggregation, or every MCP Apps lifecycle and UI-context requirement. Those need host-specific adapters and a versioned test corpus.

## License

MIT. See LICENSE.
