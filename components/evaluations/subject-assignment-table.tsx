"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Plus, BarChart3, Send, Zap, ClipboardList } from "lucide-react";
import { BatchAssignmentDialog } from "@/components/evaluations/batch-assignment-dialog";
import { PendingAssignmentsPanel } from "@/components/evaluations/pending-assignments-panel";

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: "自评",
  manager: "上级",
  peer: "同事",
  direct_report: "下级",
  other: "其他",
};

export function SubjectAssignmentTable({
  cycleId,
  cycleStatus,
  subjects,
  assignments,
  employees,
}: {
  cycleId: number;
  cycleStatus: string;
  subjects: Array<{ id: number; employeeId: number; status: string }>;
  assignments: Array<{
    id: number;
    subjectId: number;
    raterEmployeeId: number | null;
    relationship: string;
    token: string;
    status: string;
  }>;
  employees: Array<{ id: number; name: string; department?: string | null; status: string }>;
}) {
  const router = useRouter();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [newAssignments, setNewAssignments] = useState<Record<number, { raterId: string; relationship: string }>>({});
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [pendingPanelOpen, setPendingPanelOpen] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const handleAddSubject = async () => {
    if (!selectedEmployeeId) return;
    try {
      const response = await fetch(`/api/evaluations/${cycleId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(selectedEmployeeId) }),
      });
      if (!response.ok) throw new Error("添加失败");
      toast.success("被评人已添加");
      setSelectedEmployeeId("");
      router.refresh();
    } catch {
      toast.error("添加失败，请重试");
    }
  };

  const handleAddAssignment = async (subjectId: number) => {
    const config = newAssignments[subjectId];
    if (!config?.raterId || !config?.relationship) return;
    try {
      const response = await fetch(`/api/evaluations/${cycleId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          raterEmployeeId: Number(config.raterId),
          relationship: config.relationship,
        }),
      });
      if (!response.ok) throw new Error("添加失败");
      toast.success("评价任务已添加");
      setNewAssignments((prev) => ({ ...prev, [subjectId]: { raterId: "", relationship: "" } }));
      router.refresh();
    } catch {
      toast.error("添加失败，请重试");
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/evaluations/${cycleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!response.ok) throw new Error("发布失败");
      toast.success("项目已发布");
      router.refresh();
    } catch {
      toast.error("发布失败，请重试");
    }
  };

  const handleClose = async () => {
    try {
      const response = await fetch(`/api/evaluations/${cycleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!response.ok) throw new Error("关闭失败");
      toast.success("项目已关闭");
      router.refresh();
    } catch {
      toast.error("关闭失败，请重试");
    }
  };

  const copyToken = (token: string) => {
    const url = `${window.location.origin}/evaluations/fill/${token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("链接已复制"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">被评人与任务</h2>
        <div className="flex items-center gap-2">
          {cycleStatus === "draft" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBatchDialogOpen(true)}
              >
                <Zap className="mr-1 h-4 w-4" />
                批量生成任务
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-violet-600"
                onClick={handlePublish}
              >
                <Send className="mr-1 h-4 w-4" />
                发布项目
              </Button>
            </>
          )}
          {cycleStatus === "active" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingPanelOpen(true)}
              >
                <ClipboardList className="mr-1 h-4 w-4" />
                催办
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClose}
              >
                关闭项目
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
        >
          <option value="">选择员工作为被评人</option>
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!selectedEmployeeId}
          onClick={handleAddSubject}
        >
          <Plus className="mr-1 h-4 w-4" />
          添加
        </Button>
      </div>

      <BatchAssignmentDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        cycleId={cycleId}
        subjects={subjects}
      />
      <PendingAssignmentsPanel
        open={pendingPanelOpen}
        onOpenChange={setPendingPanelOpen}
        cycleId={cycleId}
        subjects={subjects}
        assignments={assignments}
        employees={employees}
      />

      {subjects.length === 0 ? (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            暂无被评人，请先添加
          </CardContent>
        </Card>
      ) : (
        subjects.map((subject) => {
          const subjectEmployee = employeeMap.get(subject.employeeId);
          const subjectAssignments = assignments.filter(
            (a) => a.subjectId === subject.id,
          );
          const submittedCount = subjectAssignments.filter(
            (a) => a.status === "submitted",
          ).length;

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {subjectEmployee?.name ?? "未知员工"}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {subjectEmployee?.department ?? ""}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      完成 {submittedCount}/{subjectAssignments.length}
                    </span>
                    {submittedCount > 0 && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          href={`/evaluations/${cycleId}/subjects/${subject.id}/report`}
                        >
                          <BarChart3 className="mr-1 h-4 w-4" />
                          报告
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectAssignments.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>评价关系</TableHead>
                        <TableHead>评价人</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectAssignments.map((assignment) => {
                        const rater = assignment.raterEmployeeId
                          ? employeeMap.get(assignment.raterEmployeeId)
                          : undefined;
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {RELATIONSHIP_LABEL[assignment.relationship] ??
                                assignment.relationship}
                            </TableCell>
                            <TableCell>{rater?.name ?? "—"}</TableCell>
                            <TableCell>
                              <span
                                className={`text-xs ${
                                  assignment.status === "submitted"
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {assignment.status === "submitted"
                                  ? "已提交"
                                  : "待填写"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {cycleStatus === "active" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToken(assignment.token)}
                                >
                                  <Copy className="mr-1 h-3.5 w-3.5" />
                                  复制链接
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <div className="flex items-center gap-2">
                  <select
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                    value={newAssignments[subject.id]?.raterId ?? ""}
                    onChange={(e) =>
                      setNewAssignments((prev) => ({
                        ...prev,
                        [subject.id]: {
                          ...prev[subject.id],
                          raterId: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">选择评价人</option>
                    {activeEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                    value={newAssignments[subject.id]?.relationship ?? ""}
                    onChange={(e) =>
                      setNewAssignments((prev) => ({
                        ...prev,
                        [subject.id]: {
                          ...prev[subject.id],
                          relationship: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">选择关系</option>
                    <option value="self">自评</option>
                    <option value="manager">上级</option>
                    <option value="peer">同事</option>
                    <option value="direct_report">下级</option>
                    <option value="other">其他</option>
                  </select>
                  <Button
                    size="sm"
                    disabled={
                      !newAssignments[subject.id]?.raterId ||
                      !newAssignments[subject.id]?.relationship
                    }
                    onClick={() => handleAddAssignment(subject.id)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    添加任务
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
