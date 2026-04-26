"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, CheckCircle2, ClipboardList } from "lucide-react";

export function ProgressOverview({
  cycle,
  subjects,
  assignments,
}: {
  cycle: {
    status: string;
    startsAt: number | null;
    endsAt: number | null;
    anonymityThreshold: number;
  };
  subjects: Array<{ id: number; status: string }>;
  assignments: Array<{ id: number; status: string }>;
}) {
  const totalAssignments = assignments.length;
  const submittedAssignments = assignments.filter(
    (a) => a.status === "submitted",
  ).length;
  const completionRate =
    totalAssignments > 0
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;

  const now = Math.floor(Date.now() / 1000);
  const isNearDeadline =
    cycle.endsAt && cycle.endsAt > now && cycle.endsAt - now < 86400 * 3;
  const isExpired = cycle.endsAt && cycle.endsAt < now;

  const statusLabel: Record<string, string> = {
    draft: "草稿",
    active: "进行中",
    closed: "已关闭",
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{statusLabel[cycle.status] ?? cycle.status}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            被评人
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <span className="text-2xl font-semibold">{subjects.length}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            任务完成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-semibold">
              {submittedAssignments}/{totalAssignments}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            完成率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-violet-500" />
            <span className="text-2xl font-semibold">{completionRate}%</span>
          </div>
          <Progress className="mt-2 h-2" value={completionRate} />
        </CardContent>
      </Card>

      {(isNearDeadline || isExpired) && (
        <Card className="md:col-span-4 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-amber-700">
            <Clock className="h-4 w-4" />
            {isExpired
              ? "该项目已截止"
              : `该项目将在 ${Math.ceil((cycle.endsAt! - now) / 86400)} 天后截止`}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
