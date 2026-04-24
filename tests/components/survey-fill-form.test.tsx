import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SurveyFillForm } from "@/components/survey-fill/survey-fill-form";

const survey = {
  id: 1,
  title: "活动报名",
  description: "请填写信息",
  status: "published" as const,
  expiresAt: null,
  createdAt: 0,
  updatedAt: 0,
  questions: [
    {
      id: 11,
      type: "text" as const,
      title: "姓名",
      required: true,
      orderIndex: 0,
      config: null,
      options: [],
    },
  ],
};

describe("SurveyFillForm", () => {
  it("shows validation error when required answer is missing", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<SurveyFillForm survey={survey} preview={false} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "提交问卷" }));

    expect(await screen.findByText("请完成所有必填题后再提交")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
