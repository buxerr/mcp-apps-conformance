export type HostTestSuite =
  | "core"
  | "draft"
  | "messages/add-to-conversation"
  | "model-context/provide-future-turns"
  | "model-context/last-wins"
  | "context/context-changed"
  | "display/return-resulting-mode"
  | "display/no-undeclared-mode"
  | "display/unavailable-returns-current";

export interface HostTestInterface {
  /** Launch the named suite in a fresh app instance and return its live iframe. */
  displayTestApp(suite: HostTestSuite): Promise<HTMLIFrameElement>;
  /** Return the host to a clean state, including clearing the launched app. */
  resetEnvironment(): Promise<void>;
  /** Read the visible conversation. */
  getConversation(): Promise<unknown>;
  /** Read the tools and model context exposed to the model. */
  getConversationContext(): Promise<{ tools: string[]; modelContext: unknown[] }>;
  /** Change observable host context such as theme or display mode. */
  changeHostContext(patch: Record<string, unknown>): Promise<void>;
  /** Accept an explicit user-consent action from the test app. */
  confirmAction(kind: "create-message" | "download-file"): Promise<void>;
  /** Commit a message drafted by the app. */
  sendMessage(): Promise<void>;
  /** Invoke a tool through the host. */
  callTool(name: string, args?: Record<string, unknown>): Promise<unknown>;
}

export const HOST_TEST_METHODS: readonly (keyof HostTestInterface)[];
export const HOST_TEST_SUITES: readonly HostTestSuite[];

export interface HostInterfaceSmokeReport {
  schemaVersion: 1;
  suite: HostTestSuite;
  scope: "adapter-smoke";
  status: "passed" | "failed";
  checks: Array<{ name: string; status: "passed" | "failed"; detail: string }>;
}

export interface HostInterfaceCaseReport {
  schemaVersion: 1;
  suite: "core";
  scope: "behavioral-case";
  caseId: string;
  status: "passed" | "failed";
  checks: Array<{ name: string; status: "passed" | "failed"; detail: string }>;
}

export type HostInterfaceCaseId = "visibility/app-tool-hidden";
export const HOST_INTERFACE_CASES: readonly HostInterfaceCaseId[];

export function runHostInterfaceCase(
  adapter: HostTestInterface,
  caseId: HostInterfaceCaseId,
): Promise<HostInterfaceCaseReport>;

export function runHostInterfaceSmoke(
  adapter: HostTestInterface,
  options?: { suite?: HostTestSuite },
): Promise<HostInterfaceSmokeReport>;
