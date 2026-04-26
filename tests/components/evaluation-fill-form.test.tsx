import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvaluationFillPageClient } from "@/components/evaluations/evaluation-fill-page-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("evaluation fill form", () => {
  it("shows subject name and relationship without rater identity", () => {
    render(
      <EvaluationFillPageClient
        token="test-token-123"
        cycleTitle="2026 Q2 360"
        subjectName="张三"
        subjectDepartment="研发部"
        subjectTitle="工程师"
        relationship="peer"
        survey={{
          id: 1,
          title: "360 评价表",
          description: null,
          status: "published",
          expiresAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          questions: [
            {
              id: 1,
              type: "rating",
              title: "沟通协作",
              required: true,
              orderIndex: 0,
              config: { maxRating: 5 },
              options: [],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/你正在评价：张三/)).toBeInTheDocument();
    expect(screen.getByText(/同事评价/)).toBeInTheDocument();
    expect(screen.queryByText(/李四/)).not.toBeInTheDocument();
  });
});
