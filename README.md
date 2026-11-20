# MCP Apps Host Conformance

An experimental, dependency-free starting point for testing MCP Apps host adapters. It follows the **proposed** host test interface in [`modelcontextprotocol/ext-apps#743`](https://github.com/modelcontextprotocol/ext-apps/issues/743).

The current host-interface entrypoint checks the eight adapter methods, launches one named suite, confirms the returned iframe has a `sandbox` attribute, and resets the host before and after the smoke check. It does **not** run the proposal's full behavioral suite and does not certify a host.

## Try the smoke check

Requires Node.js 20 or newer. Implement the proposed `HostTestInterface` for your host, then call:

```js
import { runHostInterfaceSmoke, toJUnitXml } from "@buxerr/mcp-apps-conformance";
import { hostAdapter } from "./host-adapter.js";

const report = await runHostInterfaceSmoke(hostAdapter, { suite: "core" });
console.log(JSON.stringify(report, null, 2));
console.log(toJUnitXml(report));
process.exitCode = report.status === "passed" ? 0 : 1;
```

`hostAdapter` must implement `displayTestApp`, `resetEnvironment`, `getConversation`, `getConversationContext`, `changeHostContext`, `confirmAction`, `sendMessage`, and `callTool`. The exact TypeScript contract is exported as `HostTestInterface` from `@buxerr/mcp-apps-conformance/host-interface`.

The smoke runner resets the host, calls `displayTestApp(suite)`, checks the iframe's sandbox attribute, and resets the host again even if launch fails. The adapter remains responsible for launching a fresh app instance per suite and for bounding its own UI operations.

## Proposed test catalog

`PROPOSED_CASES` from `@buxerr/mcp-apps-conformance/proposed-cases` indexes the cases in the upstream proposal, including their suite, spec revision, requirement keyword, and whether they need host interaction. The proposal currently groups cases into 22 core, 7 isolated, and 4 draft checks. This catalog is planning metadata; it does not imply those checks execute here. See [`UPSTREAM-ALIGNMENT.md`](UPSTREAM-ALIGNMENT.md) for the coverage boundary and source links.

The first behavioral case is visibility/app-tool-hidden. It checks that the fixture's app-only conformance_probe is absent from the model tool list while the model-visible conformance_model_probe control is present. The reference MCP App server and build instructions are in fixtures/app-tool-hidden/README.md.

Run it against a host adapter with:

    const report = await runHostInterfaceCase(hostAdapter, "visibility/app-tool-hidden");

The adapter's displayTestApp("core") implementation should launch the fixture's conformance_launch tool, wait for the iframe, and return it.

## Existing generic transport smoke API

The root module also retains `runConformance(adapter, options)` for a small, generic four-method transport smoke check (`probe`, `openApp`, `request`, `closeApp`). That API predates the upstream proposal and is **not** the MCP Apps `HostTestInterface`.

## Development

```sh
npm install
npm test
```

The tests cover the generic transport smoke API. Host-interface behavior is experimental and not yet covered by an automated suite.

## Status

This project is independent and unofficial. It is not affiliated with, endorsed by, or a certification program of the Model Context Protocol project. The proposal remains open to change; the `draft` cases are explicitly unstable.

## License

MIT. See [LICENSE](LICENSE).
