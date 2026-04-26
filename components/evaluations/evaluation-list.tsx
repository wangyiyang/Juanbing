"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Edit3, ExternalLink, FolderOpen } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "text-slate-600 bg-slate-100 border-slate-200" },
  active: { label: "进行中", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  closed: { label: "已关闭", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

export function EvaluationList({
  cycles,
}: {
  cycles: Array<{
    id: number;
    title: string;
    description: string | null;
    status: string;
    surveyId: number;
    startsAt: number | null;
    endsAt: number | null;
    anonymityThreshold: number;
    createdAt: number;
    updatedAt: number;
  }>;
}) {
  const handleExport = async (cycleId: number) => {
    try {
      const response = await fetch(
        `/api/evaluations/${cycleId}/export?type=assignments`,
      );
      if (!response.ok) throw new Error("导出失败");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evaluation-${cycleId}-assignments.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch {
      toast.error("导出失败");
    }
  };

  return (
    <>
      <p className="text-sm text-slate-500 mb-6">共 {cycles.length} 个项目</p>

      {cycles.length === 0 ? (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700">
              还没有评价项目
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              点击右上角按钮创建第一个 360 环评项目
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cycles.map((cycle) => {
            const statusInfo = STATUS_MAP[cycle.status] ?? STATUS_MAP.draft;
            return (
              <Card
                key={cycle.id}
                className="group border-slate-200/80 bg-white transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">
                        {cycle.title}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`shrink-0 text-xs ${statusInfo.color}`}
                      variant="outline"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 mt-1 min-h-[2.5rem] text-xs text-slate-500">
                    {cycle.description || "暂无描述"}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4 text-xs text-slate-500">
                    {cycle.startsAt && (
                      <div>
                        开始：{new Date(cycle.startsAt * 1000).toLocaleDateString("zh-CN")}
                      </div>
                    )}
                    {cycle.endsAt && (
                      <div>
                        截止：{new Date(cycle.endsAt * 1000).toLocaleDateString("zh-CN")}
                      </div>
                    )}
                    <div>匿名阈值：{cycle.anonymityThreshold}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/evaluations/${cycle.id}`}>
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        详情
                      </Link>
                    </Button>
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExport(cycle.id)}
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      导出
                    </Button>
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-amber-50 hover:text-amber-600"
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/evaluations/${cycle.id}`}>
                        <BarChart3 className="mr-1 h-3.5 w-3.5" />
                        进度
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
