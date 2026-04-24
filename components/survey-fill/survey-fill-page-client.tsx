"use client";

import { useRouter } from "next/navigation";

import { SurveyFillForm } from "@/components/survey-fill/survey-fill-form";
import type { SurveyDetail } from "@/lib/surveys/types";

export function SurveyFillPageClient({
  survey,
  preview,
}: {
  survey: SurveyDetail;
  preview: boolean;
}) {
  const router = useRouter();

  return (
    <SurveyFillForm
      survey={survey}
      preview={preview}
      onSubmit={async (payload) => {
        const response = await fetch(
          `/api/surveys/${survey.id}/responses${preview ? "?preview=1" : ""}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          throw new Error(result.error ?? "提交失败");
        }

        router.push(
          `/surveys/${survey.id}/fill/thank-you${preview ? "?preview=1" : ""}`,
        );
        router.refresh();
      }}
    />
  );
}
