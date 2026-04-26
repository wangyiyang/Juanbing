import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionField } from "@/components/survey-fill/question-field";
import type { SurveyQuestionDetail } from "@/lib/surveys/types";

describe("QuestionField", () => {
  const dropdownQuestion: SurveyQuestionDetail = {
    id: 1,
    type: "dropdown",
    title: "请选择城市",
    required: false,
    orderIndex: 0,
    config: null,
    options: [
      { id: 1, label: "北京", value: "beijing", orderIndex: 0 },
      { id: 2, label: "上海", value: "shanghai", orderIndex: 1 },
    ],
  };

  it("renders dropdown options and calls onChange when selected", async () => {
    const onChange = vi.fn();
    render(<QuestionField question={dropdownQuestion} value={undefined} onChange={onChange} />);

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);

    const option = screen.getByText("上海");
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("shanghai");
  });

  const dateQuestion: SurveyQuestionDetail = {
    id: 2,
    type: "date",
    title: "请选择日期",
    required: false,
    orderIndex: 1,
    config: null,
    options: [],
  };

  it("renders date input and calls onChange when changed", async () => {
    const onChange = vi.fn();
    render(<QuestionField question={dateQuestion} value={undefined} onChange={onChange} />);

    const input = screen.getByLabelText("请选择日期");
    await userEvent.type(input, "2026-05-01");

    expect(onChange).toHaveBeenCalledWith("2026-05-01");
  });
});
