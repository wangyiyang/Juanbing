"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { QuestionField } from "@/components/survey-fill/question-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRespondentId } from "@/lib/respondent/respondent-id";
import type { SurveyAnswerValue, SurveyDetail } from "@/lib/surveys/types";

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

    await onSubmit({
      answers,
      respondent_id: preview ? `preview-${crypto.randomUUID()}` : getRespondentId(),
      duration_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    });

    setPending(false);
    toast.success(preview ? "预览提交成功" : "提交成功，感谢填写");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {survey.questions.map((question) => (
        <Card key={question.id} className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {question.title}
              {question.required ? (
                <span className="ml-1 text-red-500">*</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionField
              question={question}
              value={answers[`question_${question.id}`]}
              onChange={(value) =>
                setAnswers((current) => ({
                  ...current,
                  [`question_${question.id}`]: value,
                }))
              }
            />
          </CardContent>
        </Card>
      ))}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button disabled={pending} type="submit">
        {pending ? "提交中..." : "提交问卷"}
      </Button>
    </form>
  );
}
