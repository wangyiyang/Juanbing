"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EvaluationTemplate } from "@/lib/evaluations/template-types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  useEffect(() => {
    fetch("/api/evaluation-templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data.data ?? []));
  }, []);

  const handleClone = async (id: number) => {
    const res = await fetch(`/api/evaluation-templates/${id}/clone`, { method: "POST" });
    if (res.ok) {
      const { data } = await res.json();
      setTemplates((prev) => [...prev, data]);
    }
  };

  const handleArchive = async (id: number) => {
    if (!confirm("确定归档此模板？")) return;
    const res = await fetch(`/api/evaluation-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">评价模板管理</h1>
        <Button onClick={() => router.push("/evaluations/templates/new")}>新建模板</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>匿名阈值</TableHead>
            <TableHead>持续天数</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.isBuiltin ? "系统" : "自定义"}</TableCell>
              <TableCell>{t.anonymityThreshold}</TableCell>
              <TableCell>{t.timeRule.durationDays}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClone(t.id)}
                  title="克隆"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {!t.isBuiltin && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/evaluations/templates/${t.id}/edit`)}
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(t.id)}
                      title="归档"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
