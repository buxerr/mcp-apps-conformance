import { App } from "@modelcontextprotocol/ext-apps";

const status = document.querySelector("#status");
const result = document.querySelector("#result");
const callButton = document.querySelector("#call-app-tool");
const app = new App({ name: "MCP Apps tool visibility fixture", version: "0.1.0" });

app.onerror = (error) => {
  status.textContent = "App bridge error";
  result.textContent = error instanceof Error ? error.message : String(error);
};

app.ontoolinput = (params) => {
  status.textContent = "Received tool input";
  result.textContent = JSON.stringify(params.arguments ?? {});
};

app.ontoolresult = (toolResult) => {
  status.textContent = "Received tool result";
  result.textContent = JSON.stringify(toolResult.structuredContent ?? toolResult.content ?? []);
};

callButton.addEventListener("click", async () => {
  status.textContent = "Calling app-only tool";
  try {
    const toolResult = await app.callServerTool({
      name: "conformance_probe",
      arguments: { marker: "app-only-call" },
    });
    status.textContent = toolResult.isError ? "App-only call rejected" : "App-only call completed";
    result.textContent = JSON.stringify(toolResult.structuredContent ?? toolResult.content ?? []);
  } catch (error) {
    status.textContent = "App-only call failed";
    result.textContent = error instanceof Error ? error.message : String(error);
  }
});

app.connect().then(
  () => {
    status.textContent = "Connected to MCP Apps host";
  },
  (error) => {
    status.textContent = "Could not connect to MCP Apps host";
    result.textContent = error instanceof Error ? error.message : String(error);
  },
);
