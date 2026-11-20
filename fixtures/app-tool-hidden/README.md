# App-only tool visibility fixture

This fixture supports the visibility/app-tool-hidden case in the parent package. It registers:

- conformance_probe with visibility app; the model must not see it.
- conformance_model_probe with visibility model; it is a positive control.
- conformance_launch, which returns the MCP App resource used by a host adapter.

The fixture follows the MCP Apps host test proposal in issue #743. It is not a certification tool or an official reference host.

## Prepare the MCP server

Use Node.js 20 or newer. From this directory:

    npm install
    npm run build
    npm run serve

The server uses stdio. Configure a host test adapter to start this fixture, invoke conformance_launch when displayTestApp("core") is called, wait for the iframe to load, and return that iframe. The adapter's getConversationContext() must report the model-visible tool names without filtering or rewriting away the fixture's tools.

For the negative control, stop the normal server and start npm run serve:mutant. This deliberately marks conformance_probe as model-visible. The behavioral case should then fail its hidden-tool check while still passing the model-visible control. That expected outcome has not yet been verified against a host adapter.

## Run the behavioral case

Import runHostInterfaceCase from the parent package and pass the host adapter plus visibility/app-tool-hidden. The case resets the host, launches the core fixture, checks that conformance_probe is absent and conformance_model_probe is present, then resets the host again.

The positive control prevents a host that hides every tool from passing. The result checks only tool visibility; the separate app-tool-call-guard case still needs its own fixture action and assertion.
