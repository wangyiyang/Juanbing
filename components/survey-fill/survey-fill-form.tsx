"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { QuestionField } from "@/components/survey-fill/question-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getRespondentId } from "@/lib/respondent/respondent-id";
import type { SurveyAnswerValue, SurveyDetail } from "@/lib/surveys/types";
import { generateUUID } from "@/lib/utils";
import { Send } from "lucide-react";

export function SurveyFillForm({
  survey,
  preview,
  onSubmit,
}: {
  survey: SurveyDetail;
  preview: boolean;
  onSubmit: (payload: {
    answers: Record<string, SurveyAnswerValue>;
    respondent_id: string;
    duration_seconds: number;
  }) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useMemo(() => Date.now(), []);

  const answeredCount = useMemo(() => {
    return survey.questions.filter((question) => {
      const value = answers[`question_${question.id}`];
      return (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
      );
    }).length;
  }, [answers, survey.questions]);

  const progress =
    survey.questions.length > 0
      ? Math.round((answeredCount / survey.questions.length) * 100)
      : 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requiredMissing = survey.questions.some((question) => {
      if (!question.required) {
        return false;
      }

      const value = answers[`question_${question.id}`];
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    });

    if (requiredMissing) {
      setError("请完成所有必填题后再提交");
      return;
    }

    setError(null);
    setPending(true);

    try {
      await onSubmit({
        answers,
        respondent_id: preview
          ? `preview-${generateUUID()}`
          : getRespondentId(),
        duration_seconds: Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000),
        ),
      });

      toast.success(preview ? "预览提交成功" : "提交成功，感谢填写");
    } catch (error) {
      setError(error instanceof Error ? error.message : "提交失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Progress Bar */}
      <div className="sticky top-4 z-10 rounded-xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">填写进度</span>
          <span className="font-medium text-indigo-600">
            {answeredCount} / {survey.questions.length}
          </span>
        </div>
        <Progress className="h-2" value={progress} />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {survey.questions.map((question, index) => (
          <Card
            key={question.id}
            className="scroll-mt-6 border-slate-200/80 transition-shadow hover:shadow-sm"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start gap-2 text-base font-medium">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                  {index + 1}
                </span>
                <span className="flex-1">
                  {question.title}
                  {question.required ? (
                    <span className="ml-1 text-red-500">*</span>
                  ) : null}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionField
                onChange={(value) =>
                  setAnswers((current) => ({
                    ...current,
                    [`question_${question.id}`]: value,
                  }))
                }
                question={question}
                value={answers[`question_${question.id}`]}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <Button
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 py-6 text-base shadow-md hover:from-indigo-600 hover:to-violet-700"
        disabled={pending}
        type="submit"
      >
        <Send className="mr-2 h-4 w-4" />
        {pending ? "提交中..." : "提交问卷"}
      </Button>
    </form>
  );
}
