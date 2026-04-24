"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyQuestionDetail } from "@/lib/surveys/types";

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestionDetail;
  value: string | string[] | number | null | undefined;
  onChange: (value: string | string[] | number | null) => void;
}) {
  if (question.type === "text") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "rating") {
    const maxRating = Number(
      (question.config as { maxRating?: number } | null)?.maxRating ?? 5,
    );

    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: maxRating }, (_, index) => index + 1).map(
          (score) => (
            <button
              key={score}
              className="rounded-md border px-3 py-2"
              type="button"
              onClick={() => onChange(score)}
            >
              {score}
            </button>
          ),
        )}
      </div>
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Input
              checked={value === option.value}
              className="h-4 w-4"
              type="radio"
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Input
              checked={selectedValues.includes(option.value)}
              className="h-4 w-4"
              type="checkbox"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((item) => item !== option.value),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="text-sm text-slate-500">
      当前题型待扩展
    </div>
  );
}
