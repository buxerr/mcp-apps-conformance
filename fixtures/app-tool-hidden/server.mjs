import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const resourceUri = "ui://conformance/app-tool-visibility.html";
const appHtml = await readFile(fileURLToPath(new URL("./dist/app.html", import.meta.url)), "utf8");
const leakAppOnlyTool = process.argv.includes("--mutate-leak-app-tool");
const appOnlyVisibility = leakAppOnlyTool ? ["model", "app"] : ["app"];
const server = new McpServer({
  name: "MCP Apps tool visibility fixture",
  version: "0.1.0",
});

registerAppTool(
  server,
  "conformance_launch",
  {
    title: "Open conformance fixture",
    description: "Open the MCP Apps tool visibility conformance fixture.",
    inputSchema: z.object({}),
    _meta: { ui: { resourceUri, visibility: ["model", "app"] } },
  },
  async () => ({
    content: [{ type: "text", text: "MCP Apps tool visibility fixture opened." }],
  }),
);

registerAppTool(
  server,
  "conformance_probe",
  {
    title: "App-only conformance probe",
    description: "A tool callable by the App but hidden from the model tool list.",
    inputSchema: z.object({ marker: z.string() }),
    _meta: { ui: { resourceUri, visibility: appOnlyVisibility } },
  },
  async ({ marker }) => ({
    content: [{ type: "text", text: "App-only probe received: " + marker }],
    structuredContent: { marker },
  }),
);

registerAppTool(
  server,
  "conformance_model_probe",
  {
    title: "Model-visible conformance control",
    description: "A positive control that must remain visible to the model.",
    inputSchema: z.object({}),
    _meta: { ui: { resourceUri, visibility: ["model"] } },
  },
  async () => ({
    content: [{ type: "text", text: "Model-visible control called." }],
  }),
);

registerAppResource(
  server,
  resourceUri,
  resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => ({
    contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: appHtml }],
  }),
);

await server.connect(new StdioServerTransport());
