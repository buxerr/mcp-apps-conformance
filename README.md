# MCP Apps Host Conformance Test Runner

Test an MCP Apps host adapter against deterministic checks for host metadata, capabilities, app-origin policy, lifecycle order, request correlation, and session cleanup. The JavaScript runner returns stable results and can export JUnit XML for CI.

Use this when you are implementing an MCP Apps host and want repeatable adapter checks without writing a separate suite for every host UI.

## Install and run

Requires Node.js 20 or newer. Clone the repository, then run its test suite:

```sh
git clone https://github.com/buxerr/mcp-apps-conformance.git
cd mcp-apps-conformance
npm install
npm test
```

To install it directly into a Node.js project from GitHub, run `npm install github:buxerr/mcp-apps-conformance`.

## Implement a host adapter

The adapter is the boundary between the conformance checks and a host-specific implementation:

```js
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
```

Pass the adapter to `runConformance(adapter)`. The runner sends a deterministic `mcp/ping` request; it does not contact a model provider or execute app code.

## What it checks

- Host name, protocol version, and required capabilities
- App origin policy and expected lifecycle ordering
- Request ID correlation and session cleanup
- Stable check results that can be written as JUnit XML

## Scope and limitations

This is an initial adapter contract and test runner. It does not provide browser automation, aggregate results from multiple hosts, or cover every MCP Apps lifecycle and UI-context requirement. Host adapters must enforce transport timeouts, and a failed conformance report should fail the release check.

See the [MCP Apps project](https://github.com/modelcontextprotocol/ext-apps) for the surrounding protocol and host ecosystem.

## License

MIT. See [LICENSE](LICENSE).
