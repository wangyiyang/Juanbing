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
});
