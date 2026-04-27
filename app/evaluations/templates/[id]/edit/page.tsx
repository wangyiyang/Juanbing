"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TemplateForm } from "@/components/evaluations/template-form";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);

  useEffect(() => {
    fetch(`/api/evaluation-templates/${id}`)
      .then((res) => res.json())
      .then((data) => setTemplate(data.data));
  }, [id]);

  const handleSubmit = async (data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: { type: string; count: number; required: boolean }[];
    timeRule: { type: "relative"; durationDays: number };
  }) => {
    const res = await fetch(`/api/evaluation-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/evaluations/templates");
    } else {
      alert("更新失败");
    }
  };

  if (!template) return <div>加载中...</div>;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">编辑评价模板</h1>
      <TemplateForm initial={template} onSubmit={handleSubmit} />
    </div>
  );
}
