import { describe, expect, it } from "vitest";

import { canShowRelationshipGroup } from "@/lib/evaluations/report-policy";

describe("report policy", () => {
  it("always shows self and manager groups", () => {
    expect(canShowRelationshipGroup("self", 1, 3)).toBe(true);
    expect(canShowRelationshipGroup("manager", 1, 3)).toBe(true);
  });

  it("hides peer, direct report and other groups below threshold", () => {
    expect(canShowRelationshipGroup("peer", 2, 3)).toBe(false);
    expect(canShowRelationshipGroup("direct_report", 2, 3)).toBe(false);
    expect(canShowRelationshipGroup("other", 2, 3)).toBe(false);
  });

  it("shows non-identifying groups at or above threshold", () => {
    expect(canShowRelationshipGroup("peer", 3, 3)).toBe(true);
    expect(canShowRelationshipGroup("direct_report", 4, 3)).toBe(true);
  });
});
