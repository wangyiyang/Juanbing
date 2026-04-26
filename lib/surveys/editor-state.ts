import { generateUUID } from "@/lib/utils";
import {
  createDefaultQuestion,
} from "@/lib/surveys/question-defaults";
import type {
  QuestionType,
  SurveyDetail,
  SurveyInput,
  SurveyOptionInput,
} from "@/lib/surveys/types";

export type EditorQuestion = SurveyInput["questions"][number] & {
  clientId: string;
  options: SurveyOptionInput[];
};

export type EditorState = {
  title: string;
  description: string;
  expiresAt: number | null;
  questions: EditorQuestion[];
  selectedQuestionId: string | null;
};

export type EditorAction =
  | { type: "setTitle"; value: string }
  | { type: "setDescription"; value: string }
  | { type: "setExpiresAt"; value: number | null }
  | { type: "addQuestion"; questionType: QuestionType }
  | { type: "selectQuestion"; clientId: string }
  | { type: "moveQuestionUp"; clientId: string }
  | { type: "updateQuestion"; clientId: string; patch: Partial<EditorQuestion> };

function normalizeQuestionOrder(questions: EditorQuestion[]) {
  return questions.map((question, index) => ({
    ...question,
    orderIndex: index,
    options: (question.options ?? []).map((option, optionIndex) => ({
      ...option,
      orderIndex: optionIndex,
    })),
  }));
}

export function createInitialEditorState(
  survey?: SurveyDetail | null,
): EditorState {
  if (!survey) {
    return {
      title: "未命名问卷",
      description: "",
      expiresAt: null,
      questions: [],
      selectedQuestionId: null,
    };
  }

  const questions = normalizeQuestionOrder(
    survey.questions.map((question) => ({
      ...question,
      clientId: String(question.id),
      config: question.config ?? null,
      options: question.options ?? [],
    })),
  );

  return {
    title: survey.title,
    description: survey.description ?? "",
    expiresAt: survey.expiresAt,
    questions,
    selectedQuestionId: questions[0]?.clientId ?? null,
  };
}

export function editorReducer(state: EditorState, action: EditorAction) {
  switch (action.type) {
    case "setTitle":
      return { ...state, title: action.value };
    case "setDescription":
      return { ...state, description: action.value };
    case "setExpiresAt":
      return { ...state, expiresAt: action.value };
    case "addQuestion": {
      const clientId = generateUUID();
      const question = {
        ...createDefaultQuestion(action.questionType, state.questions.length),
        clientId,
        options: createDefaultQuestion(action.questionType, state.questions.length)
          .options ?? [],
      };

      return {
        ...state,
        questions: normalizeQuestionOrder([...state.questions, question]),
        selectedQuestionId: clientId,
      };
    }
    case "selectQuestion":
      return { ...state, selectedQuestionId: action.clientId };
    case "moveQuestionUp": {
      const index = state.questions.findIndex(
        (question) => question.clientId === action.clientId,
      );

      if (index <= 0) {
        return state;
      }

      const next = [...state.questions];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];

      return {
        ...state,
        questions: normalizeQuestionOrder(next),
      };
    }
    case "updateQuestion":
      return {
        ...state,
        questions: normalizeQuestionOrder(
          state.questions.map((question) =>
            question.clientId === action.clientId
              ? {
                  ...question,
                  ...action.patch,
                  options: action.patch.options ?? question.options,
                }
              : question,
          ),
        ),
      };
    default:
      return state;
  }
}
