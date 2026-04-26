"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Users, CheckCircle2, ClipboardList, TrendingUp } from "lucide-react";

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: "自评",
  manager: "上级",
  peer: "同事",
  direct_report: "下级",
  other: "其他",
};

export function ProgressOverview({
  cycle,
  subjects,
  assignments,
  employees,
}: {
  cycle: {
    status: string;
    startsAt: number | null;
    endsAt: number | null;
    anonymityThreshold: number;
  };
  subjects: Array<{ id: number; employeeId: number; status: string }>;
  assignments: Array<{
    id: number;
    subjectId: number;
    raterEmployeeId: number | null;
    relationship: string;
    status: string;
  }>;
  employees: Array<{ id: number; name: string; department?: string | null }>;
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

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Subject completion details
  const subjectDetails = subjects.map((subject) => {
    const subjectEmployee = employeeMap.get(subject.employeeId);
    const subjectAssignments = assignments.filter(
      (a) => a.subjectId === subject.id,
    );
    const submitted = subjectAssignments.filter(
      (a) => a.status === "submitted",
    ).length;
    const total = subjectAssignments.length;
    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return {
      id: subject.id,
      name: subjectEmployee?.name ?? "未知员工",
      department: subjectEmployee?.department ?? "",
      submitted,
      total,
      rate,
    };
  }).sort((a, b) => a.rate - b.rate);

  // Relationship stats
  const relationshipStats = Object.entries(RELATIONSHIP_LABEL).map(
    ([key, label]) => {
      const relAssignments = assignments.filter(
        (a) => a.relationship === key,
      );
      const relSubmitted = relAssignments.filter(
        (a) => a.status === "submitted",
      ).length;
      const relTotal = relAssignments.length;
      const relRate = relTotal > 0 ? Math.round((relSubmitted / relTotal) * 100) : 0;
      return { label, submitted: relSubmitted, total: relTotal, rate: relRate };
    },
  );

  return (
    <div className="space-y-6">
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

      {/* Relationship breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            按关系类型回收率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            {relationshipStats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-lg font-semibold">
                  {stat.submitted}/{stat.total}
                </div>
                <Progress className="h-1.5" value={stat.rate} />
                <div className="text-xs text-muted-foreground">{stat.rate}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject completion details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">被评人完成明细</CardTitle>
        </CardHeader>
        <CardContent>
          {subjectDetails.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无被评人
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>被评人</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>完成进度</TableHead>
                  <TableHead>完成率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectDetails.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.department || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress className="h-2 w-24" value={s.rate} />
                        <span className="text-xs text-muted-foreground">
                          {s.submitted}/{s.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          s.rate === 100
                            ? "text-emerald-600"
                            : s.rate >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {s.rate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
