import type {
  QuestionType,
  SurveyQuestionInput,
} from "@/lib/surveys/types";

function createChoiceOptions() {
  return [
    { label: "选项 1", value: "option_1", orderIndex: 0 },
    { label: "选项 2", value: "option_2", orderIndex: 1 },
  ];
}

export function createDefaultQuestion(
  type: QuestionType,
  orderIndex: number,
): SurveyQuestionInput {
  switch (type) {
    case "single_choice":
    case "multiple_choice":
    case "dropdown":
      return {
        type,
        title: "请输入题目",
        required: false,
        orderIndex,
        config: null,
        options: createChoiceOptions(),
      };
    case "rating":
      return {
        type,
        title: "请为以下内容打分",
        required: false,
        orderIndex,
        config: { maxRating: 5 },
        options: [],
      };
    case "matrix":
      return {
        type,
        title: "请按行填写矩阵题",
        required: false,
        orderIndex,
        config: {
          rows: ["维度 1", "维度 2"],
          columns: ["非常不同意", "同意"],
        },
        options: [],
      };
    case "date":
      return {
        type,
        title: "请选择日期",
        required: false,
        orderIndex,
        config: null,
        options: [],
      };
    case "text":
    default:
      return {
        type: "text",
        title: "请输入题目",
        required: false,
        orderIndex,
        config: null,
        options: [],
      };
  }
}
