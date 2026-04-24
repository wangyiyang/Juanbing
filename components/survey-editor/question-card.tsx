"use client";

import { ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuestionCard({
  question,
  selected,
  onSelect,
  onMoveUp,
}: {
  question: {
    clientId: string;
    title: string;
    type: string;
    required: boolean;
  };
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full rounded-xl border bg-white p-4 text-left transition hover:border-slate-300",
        selected && "border-slate-900 shadow-sm",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{question.type}</Badge>
            {question.required ? <Badge>必填</Badge> : null}
          </div>
          <p className="font-medium">{question.title}</p>
        </div>
        <Button
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
      </div>
    </button>
  );
}
