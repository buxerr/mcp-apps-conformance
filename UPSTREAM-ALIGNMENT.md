# Upstream alignment and current coverage

**Checked:** 2026-11-20. **Status:** experimental, independent implementation.

## Source proposal

The [MCP Apps host test interface and conformance-suite proposal](https://github.com/modelcontextprotocol/ext-apps/issues/743) is open and describes a host adapter with eight methods. It groups checks into a stable `core` suite, one suite per stateful/isolated case, and an unstable `draft` suite. The proposal explains that isolated cases need fresh app instances because they mutate conversation state or host context.

This repository mirrors the proposal's method names and records its 33 listed cases in [`src/proposed-cases.js`](src/proposed-cases.js): 22 core, 7 isolated, and 4 draft. The case catalog is a traceable index, not an implementation of those assertions.

## Implemented here

- Runtime presence check for the eight proposed adapter methods.
- One-suite launch through `displayTestApp(suite)`.
- Smoke check that the returned element is an iframe with a `sandbox` attribute.
- Host reset before and after the smoke check, including after a launch error.
- Behavioral case visibility/app-tool-hidden, including a positive control that must remain visible to the model.
- Reference server and MCP App resource for the app-tool visibility case.
- Stable JSON checks and JUnit XML formatting.

The existing generic `runConformance()` API is retained for compatibility. It uses `probe/openApp/request/closeApp`, which are **not** the proposed host interface.

## Not implemented here

- The other 21 behavioral checks in the proposed stable core suite.
- The 7 isolated behavioral checks or the 4 draft checks.
- A shared reference test server / test resource for the remaining cases.
- Browser automation, ecosystem hooks such as tab watching or console capture, or adapters for specific hosts.
- Official protocol certification, cross-host aggregation, or an endorsement by the MCP project.
- A real host integration run. The case runner and fixture exist locally but remain unverified against a host adapter.

The upstream [`MCP Apps specification`](https://github.com/modelcontextprotocol/ext-apps/tree/main/specification/2026-01-26) and proposal can change. Before treating this catalog as a compatibility promise, compare each case and requirement against the latest upstream source.
