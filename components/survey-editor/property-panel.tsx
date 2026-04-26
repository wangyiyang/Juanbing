"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { EditorQuestion } from "@/lib/surveys/editor-state";

export function PropertyPanel({
  question,
  onChange,
}: {
  question: EditorQuestion | null;
  onChange: (patch: Partial<EditorQuestion>) => void;
}) {
  if (!question) {
    return (
      <aside className="rounded-xl border bg-white p-4 text-sm text-slate-500">
        请选择一道题目查看属性。
      </aside>
    );
  }

  return (
    <aside className="space-y-4 rounded-xl border bg-white p-4">
      <div className="space-y-2">
        <Label htmlFor="question-title">题目标题</Label>
        <Input
          id="question-title"
          value={question.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="font-medium">设为必填</p>
          <p className="text-xs text-slate-500">受访者提交前必须完成这道题</p>
        </div>
        <Switch
          checked={question.required}
          onCheckedChange={(checked) => onChange({ required: checked })}
        />
      </div>
      {(question.type === "single_choice" || question.type === "multiple_choice" || question.type === "dropdown") &&
      question.options.length > 0 ? (
        <div className="space-y-3">
          <Label>选项</Label>
          {question.options.map((option, index) => (
            <Input
              key={index}
              value={option.label}
              onChange={(event) =>
                onChange({
                  options: question.options.map((item, optionIndex) =>
                    optionIndex === index
                      ? {
                          ...item,
                          label: event.target.value,
                          value:
                            event.target.value.trim() === ""
                              ? item.value
                              : event.target.value.trim(),
                        }
                      : item,
                  ),
                })
              }
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
}
