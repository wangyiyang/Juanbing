"use client";

import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronUp,
  CircleDot,
  List,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  text: AlignLeft,
  rating: Star,
  dropdown: List,
  date: Calendar,
};

const TYPE_LABELS: Record<string, string> = {
  single_choice: "单选",
  multiple_choice: "多选",
  text: "填空",
  rating: "评分",
  dropdown: "下拉",
  date: "日期",
};

export function QuestionCard({
  question,
  selected,
  index,
  onSelect,
  onMoveUp,
  onDelete,
}: {
  question: {
    clientId: string;
    title: string;
    type: string;
    required: boolean;
  };
  selected: boolean;
  index: number;
  onSelect: () => void;
  onMoveUp: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICONS[question.type] ?? List;
  const typeLabel = TYPE_LABELS[question.type] ?? question.type;

  return (
    <button
      className={cn(
        "group w-full rounded-xl border bg-white p-4 text-left transition-all duration-200",
        selected
          ? "border-indigo-300 shadow-sm ring-1 ring-indigo-100"
          : "hover:border-slate-300 hover:shadow-sm",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="mt-0.5 text-xs font-medium text-slate-400">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              <Badge className="text-[10px]" variant="secondary">
                {typeLabel}
              </Badge>
              {question.required ? (
                <Badge
                  className="h-4 border-amber-300 bg-amber-50 px-1 text-[10px] text-amber-600"
                  variant="outline"
                >
                  必填
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-sm font-medium text-slate-800">
              {question.title || "未命名问题"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            className="h-6 w-6"
            size="icon"
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onMoveUp();
            }}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            size="icon"
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-3.5 text-slate-400" />
          </Button>
        </div>
      </div>
    </button>
  );
}
