import type { HostInterfaceCaseId, HostInterfaceCaseReport, HostInterfaceSmokeReport, HostTestInterface, HostTestSuite } from "./host-interface.js";
import type { ProposedTestCase } from "./proposed-cases.js";

export type { HostInterfaceCaseId, HostInterfaceCaseReport, HostInterfaceSmokeReport, HostTestInterface, HostTestSuite } from "./host-interface.js";
export type { ProposedTestCase } from "./proposed-cases.js";

export type Check = { name: string; status: "passed" | "failed"; detail: string };
export type ConformanceReport = {
  schemaVersion: number;
  status: "passed" | "failed";
  host: { name: string | null; protocolVersion: string | null } | null;
  checks: Check[];
};

export type LegacyAdapter = {
  probe(): Promise<unknown>;
  openApp(input: Record<string, unknown>): Promise<unknown>;
  request(sessionId: string, request: Record<string, unknown>): Promise<unknown>;
  closeApp(sessionId: string): Promise<unknown>;
};

export function runConformance(
  adapter: LegacyAdapter,
  options: {
    resourceUri: string;
    appOrigin: string;
    allowedOrigins?: string[];
    requiredCapabilities?: string[];
  },
): Promise<ConformanceReport>;

export function toJUnitXml(report: { checks: Check[] }): string;
export function runHostInterfaceSmoke(
  adapter: HostTestInterface,
  options?: { suite?: HostTestSuite },
): Promise<HostInterfaceSmokeReport>;
export function runHostInterfaceCase(
  adapter: HostTestInterface,
  caseId: HostInterfaceCaseId,
): Promise<HostInterfaceCaseReport>;
export const HOST_INTERFACE_CASES: readonly HostInterfaceCaseId[];
export const HOST_TEST_METHODS: readonly (keyof HostTestInterface)[];
export const HOST_TEST_SUITES: readonly HostTestSuite[];
export const PROPOSED_CASES: readonly ProposedTestCase[];
export const PROPOSED_CASE_COUNTS: Readonly<{
  core: number;
  isolated: number;
  draft: number;
  total: number;
}>;
