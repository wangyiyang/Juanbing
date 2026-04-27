"use client";

import { useRouter } from "next/navigation";

import { TemplateForm } from "@/components/evaluations/template-form";
import type { TemplateFormProps } from "@/components/evaluations/template-form";

export default function NewTemplatePage() {
  const router = useRouter();

  const handleSubmit = async (data: Parameters<Required<TemplateFormProps>["onSubmit"]>[0]) => {
    const res = await fetch("/api/evaluation-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/evaluations/templates");
    } else {
      alert("创建失败");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">新建评价模板</h1>
      <TemplateForm onSubmit={handleSubmit} />
    </div>
  );
}
