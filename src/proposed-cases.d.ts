export type ProposedTestCase = {
  id: string;
  suite: string;
  spec: "2026-01-26" | "draft";
  clause: "MUST" | "MUST NOT" | "SHOULD" | "MAY";
  category: "automatic" | "host-interaction";
};

export const PROPOSED_CASES: readonly ProposedTestCase[];
export const PROPOSED_CASE_COUNTS: Readonly<{
  core: number;
  isolated: number;
  draft: number;
  total: number;
}>;
