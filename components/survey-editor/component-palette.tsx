"use client";

import { Button } from "@/components/ui/button";
import type { QuestionType } from "@/lib/surveys/types";

const MVP_TYPES: Array<{ type: QuestionType; label: string }> = [
  { type: "single_choice", label: "单选题" },
  { type: "multiple_choice", label: "多选题" },
  { type: "text", label: "填空题" },
  { type: "rating", label: "评分题" },
  { type: "dropdown", label: "下拉选择" },
  { type: "date", label: "日期选择" },
];

export function ComponentPalette({
  onAdd,
}: {
  onAdd: (type: QuestionType) => void;
}) {
  return (
    <aside className="space-y-3 rounded-xl border bg-white p-4">
      <h2 className="font-medium">题型组件</h2>
      <div className="grid gap-2">
        {MVP_TYPES.map((item) => (
          <Button
            key={item.type}
            type="button"
            variant="outline"
            onClick={() => onAdd(item.type)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </aside>
  );
}
