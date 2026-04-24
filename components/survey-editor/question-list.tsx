"use client";

import { QuestionCard } from "@/components/survey-editor/question-card";

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelect,
  onMoveUp,
}: {
  questions: Array<{
    clientId: string;
    title: string;
    type: string;
    required: boolean;
  }>;
  selectedQuestionId: string | null;
  onSelect: (clientId: string) => void;
  onMoveUp: (clientId: string) => void;
}) {
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-slate-50 p-10 text-center text-sm text-slate-500">
        先从左侧添加题型，开始搭建问卷。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <QuestionCard
          key={question.clientId}
          question={question}
          selected={question.clientId === selectedQuestionId}
          onMoveUp={() => onMoveUp(question.clientId)}
          onSelect={() => onSelect(question.clientId)}
        />
      ))}
    </div>
  );
}
