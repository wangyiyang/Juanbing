"use client";

import {
  AlignLeft,
  CheckSquare,
  CircleDot,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { QuestionType } from "@/lib/surveys/types";

const MVP_TYPES: Array<{
  type: QuestionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "single_choice", label: "单选题", icon: CircleDot },
  { type: "multiple_choice", label: "多选题", icon: CheckSquare },
  { type: "text", label: "填空题", icon: AlignLeft },
  { type: "rating", label: "评分题", icon: Star },
];

export function ComponentPalette({
  onAdd,
}: {
  onAdd: (type: QuestionType) => void;
}) {
  return (
    <aside className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-slate-700">题型组件</h2>
      <div className="grid gap-2">
        {MVP_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.type}
              className="justify-start gap-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              type="button"
              variant="outline"
              onClick={() => onAdd(item.type)}
            >
              <Icon className="h-4 w-4 text-slate-500" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </aside>
  );
}
