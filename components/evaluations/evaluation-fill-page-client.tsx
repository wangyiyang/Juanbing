"use client";

import { useRouter } from "next/navigation";

import { SurveyFillForm } from "@/components/survey-fill/survey-fill-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyDetail } from "@/lib/surveys/types";

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: "自评",
  manager: "上级评价",
  peer: "同事评价",
  direct_report: "下级评价",
  other: "其他评价",
};

export function EvaluationFillPageClient({
  token,
  cycleTitle,
  subjectName,
  subjectDepartment,
  subjectTitle,
  relationship,
  survey,
}: {
  token: string;
  cycleTitle: string;
  subjectName: string;
  subjectDepartment: string;
  subjectTitle: string;
  relationship: string;
  survey: SurveyDetail;
}) {
  const router = useRouter();

  const handleSubmit = async (payload: {
    answers: Record<string, unknown>;
    respondent_id: string;
    duration_seconds: number;
  }) => {
    const response = await fetch(
      `/api/evaluations/assignments/${token}/responses`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "提交失败");
    }

    router.push(`/evaluations/fill/${token}/thank-you`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{cycleTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-lg bg-indigo-50 p-4 text-indigo-800">
              <div className="font-medium">
                你正在评价：{subjectName}
              </div>
              {subjectDepartment && (
                <div className="text-xs text-indigo-600 mt-1">
                  {subjectDepartment} {subjectTitle}
                </div>
              )}
              <div className="text-xs text-indigo-600 mt-1">
                评价关系：{RELATIONSHIP_LABEL[relationship] ?? relationship}
              </div>
            </div>
          </CardContent>
        </Card>

        <SurveyFillForm
          survey={survey}
          preview={false}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
