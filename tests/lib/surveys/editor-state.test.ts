import { describe, expect, it } from "vitest";

import {
  createInitialEditorState,
  editorReducer,
} from "@/lib/surveys/editor-state";

describe("editor reducer", () => {
  it("adds a single choice question with default options", () => {
    const next = editorReducer(createInitialEditorState(), {
      type: "addQuestion",
      questionType: "single_choice",
    });

    expect(next.questions).toHaveLength(1);
    expect(next.questions[0]?.options).toHaveLength(2);
  });

  it("moves a selected question upward", () => {
    const initial = {
      ...createInitialEditorState(),
      questions: [
        {
          clientId: "a",
          type: "text" as const,
          title: "Q1",
          required: false,
          orderIndex: 0,
          config: null,
          options: [],
        },
        {
          clientId: "b",
          type: "text" as const,
          title: "Q2",
          required: false,
          orderIndex: 1,
          config: null,
          options: [],
        },
      ],
      selectedQuestionId: "b",
    };

    const next = editorReducer(initial, {
      type: "moveQuestionUp",
      clientId: "b",
    });
    expect(next.questions[0]?.clientId).toBe("b");
  });
});
