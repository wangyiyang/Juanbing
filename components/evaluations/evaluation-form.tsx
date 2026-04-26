"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export function EvaluationForm({
  surveys,
}: {
  surveys: Array<{ id: number; title: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    surveyId: "",
    startsAt: "",
    endsAt: "",
    anonymityThreshold: "3",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        surveyId: Number(form.surveyId),
        startsAt: form.startsAt
          ? Math.floor(new Date(form.startsAt).getTime() / 1000)
          : null,
        endsAt: form.endsAt
          ? Math.floor(new Date(form.endsAt).getTime() / 1000)
          : null,
        anonymityThreshold: Number(form.anonymityThreshold),
      };

      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("创建失败");
      toast.success("评价项目已创建");
      router.push("/evaluations");
    } catch {
      toast.error("创建失败，请重试");
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/evaluations")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回列表
      </Button>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">项目名称 *</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">项目说明</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surveyId">绑定问卷 *</Label>
              <select
                id="surveyId"
                required
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
                value={form.surveyId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, surveyId: e.target.value }))
                }
              >
                <option value="">请选择问卷</option>
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">开始时间</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">截止时间</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anonymityThreshold">匿名阈值</Label>
              <Input
                id="anonymityThreshold"
                type="number"
                min={2}
                max={10}
                value={form.anonymityThreshold}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    anonymityThreshold: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-slate-500">
                peer、direct_report、other 关系组的评分和文本只有达到该人数才单独展示
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/evaluations")}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-gradient-to-r from-indigo-500 to-violet-600"
              >
                {pending ? "创建中..." : "创建项目"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
