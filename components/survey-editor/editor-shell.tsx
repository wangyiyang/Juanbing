"use client";

import { useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ComponentPalette } from "@/components/survey-editor/component-palette";
import { PropertyPanel } from "@/components/survey-editor/property-panel";
import { QuestionList } from "@/components/survey-editor/question-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createInitialEditorState,
  editorReducer,
} from "@/lib/surveys/editor-state";
import type { SurveyDetail } from "@/lib/surveys/types";

export function EditorShell({ survey }: { survey?: SurveyDetail | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, dispatch] = useReducer(
    editorReducer,
    createInitialEditorState(survey),
  );

  const selectedQuestion = useMemo(
    () =>
      state.questions.find(
        (question) => question.clientId === state.selectedQuestionId,
      ) ?? null,
    [state.questions, state.selectedQuestionId],
  );

  async function handleSave() {
    setPending(true);

    const response = await fetch(survey ? `/api/surveys/${survey.id}` : "/api/surveys", {
      method: survey ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: state.title,
        description: state.description,
        expiresAt: state.expiresAt,
        questions: state.questions.map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          required: question.required,
          orderIndex: question.orderIndex,
          config: question.config ?? null,
          options: question.options,
        })),
      }),
    });

    setPending(false);

    if (!response.ok) {
      toast.error("保存失败，请检查题目配置");
      return;
    }

    const payload = (await response.json()) as { data: { id: number } };
    toast.success("问卷已保存");

    if (!survey) {
      router.replace(`/surveys/${payload.data.id}`);
    }

    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      <ComponentPalette
        onAdd={(questionType) =>
          dispatch({ type: "addQuestion", questionType })
        }
      />
      <section className="space-y-4 rounded-xl border bg-white p-4">
        <Input
          value={state.title}
          onChange={(event) =>
            dispatch({ type: "setTitle", value: event.target.value })
          }
        />
        <Textarea
          value={state.description}
          onChange={(event) =>
            dispatch({ type: "setDescription", value: event.target.value })
          }
        />
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="expires-at">
            过期时间（可选）
          </label>
          <Input
            id="expires-at"
            type="date"
            value={
              state.expiresAt
                ? new Date(state.expiresAt * 1000).toISOString().split("T")[0]
                : ""
            }
            onChange={(event) => {
              const dateValue = event.target.value;
              dispatch({
                type: "setExpiresAt",
                value: dateValue
                  ? Math.floor(new Date(dateValue).getTime() / 1000)
                  : null,
              });
            }}
          />
        </div>
        <QuestionList
          questions={state.questions}
          selectedQuestionId={state.selectedQuestionId}
          onMoveUp={(clientId) =>
            dispatch({ type: "moveQuestionUp", clientId })
          }
          onSelect={(clientId) =>
            dispatch({ type: "selectQuestion", clientId })
          }
        />
        <div className="flex justify-end gap-2">
          <Button
            disabled={pending}
            type="button"
            variant="outline"
            onClick={handleSave}
          >
            {pending ? "保存中..." : "保存"}
          </Button>
          {survey ? (
            <Button
              type="button"
              onClick={() =>
                window.open(`/surveys/${survey.id}/fill?preview=1`, "_blank")
              }
            >
              预览
            </Button>
          ) : null}
        </div>
      </section>
      <PropertyPanel
        question={selectedQuestion}
        onChange={(patch) => {
          if (!selectedQuestion) {
            return;
          }

          dispatch({
            type: "updateQuestion",
            clientId: selectedQuestion.clientId,
            patch,
          });
        }}
      />
    </div>
  );
}
