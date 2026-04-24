import { describe, expect, it } from "vitest";

import { buildSurveyOverview, toCsvRows } from "@/lib/analytics/service";

describe("analytics service", () => {
  it("builds overview metrics from responses", () => {
    const overview = buildSurveyOverview([
      { createdAt: 1710000000, durationSeconds: 12, answers: { question_11: "A" } },
      { createdAt: 1710003600, durationSeconds: 18, answers: { question_11: "B" } },
    ]);

    expect(overview.totalResponses).toBe(2);
    expect(overview.averageDurationSeconds).toBe(15);
    expect(overview.trend.length).toBe(1);
  });

  it("flattens response rows for csv export", () => {
    const rows = toCsvRows(
      [{ id: 11, title: "姓名" }],
      [{ id: 1, createdAt: 1710000000, respondentId: "abc", answers: { question_11: "Alice" } }],
    );

    expect(rows[0]?.姓名).toBe("Alice");
    expect(rows[0]?.respondent_id).toBe("abc");
  });
});
