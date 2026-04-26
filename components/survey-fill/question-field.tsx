"use client";

import { Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  SurveyAnswerValue,
  SurveyQuestionDetail,
} from "@/lib/surveys/types";

export function QuestionField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestionDetail;
  value: SurveyAnswerValue | undefined;
  onChange: (value: SurveyAnswerValue) => void;
}) {
  if (question.type === "text") {
    return (
      <Textarea
        className="min-h-[100px] resize-none"
        placeholder="请输入..."
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === "rating") {
    const maxRating = Number(
      (question.config as { maxRating?: number } | null)?.maxRating ?? 5,
    );
    const currentValue = typeof value === "number" ? value : 0;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, index) => index + 1).map(
          (score) => (
            <button
              key={score}
              className="p-1 transition-transform hover:scale-110"
              type="button"
              onClick={() => onChange(score)}
            >
              <Star
                className={`h-7 w-7 ${
                  score <= currentValue
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200"
                }`}
              />
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
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-slate-50 hover:border-slate-200"
          >
            <input
              checked={value === option.value}
              className="h-4 w-4 accent-indigo-500"
              name={`question_${question.id}`}
              type="radio"
              value={option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="text-sm text-slate-700">{option.label}</span>
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
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-slate-50 hover:border-slate-200"
          >
            <input
              checked={selectedValues.includes(option.value)}
              className="h-4 w-4 rounded accent-indigo-500"
              type="checkbox"
              value={option.value}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((item) => item !== option.value),
                )
              }
            />
            <span className="text-sm text-slate-700">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <Select value={typeof value === "string" ? value : ""} onValueChange={(newValue) => onChange(newValue)}>
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          {question.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (question.type === "date") {
    return (
      <Input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label={question.title}
      />
    );
  }

  return (
    <div className="text-sm text-slate-500">
      当前题型待扩展
    </div>
  );
}
