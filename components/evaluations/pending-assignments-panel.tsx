"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Filter } from "lucide-react";

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: "自评",
  manager: "上级",
  peer: "同事",
  direct_report: "下级",
  other: "其他",
};

export function PendingAssignmentsPanel({
  open,
  onOpenChange,
  subjects,
  assignments,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: number;
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
  const [filterRelationship, setFilterRelationship] = useState<string>("");

  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );
  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const pendingAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status === "pending")
      .filter((a) =>
        filterRelationship ? a.relationship === filterRelationship : true,
      )
      .map((a) => {
        const subject = subjectMap.get(a.subjectId);
        const subjectEmployee = subject
          ? employeeMap.get(subject.employeeId)
          : undefined;
        const rater = a.raterEmployeeId
          ? employeeMap.get(a.raterEmployeeId)
          : undefined;
        return {
          ...a,
          subjectName: subjectEmployee?.name ?? "未知",
          raterName: rater?.name ?? "—",
          relationshipLabel:
            RELATIONSHIP_LABEL[a.relationship] ?? a.relationship,
          fillUrl: `${window.location.origin}/evaluations/fill/${a.token}`,
        };
      });
  }, [assignments, filterRelationship, employeeMap, subjectMap]);

  const copyAllLinks = () => {
    const lines = pendingAssignments.map(
      (a) =>
        `${a.raterName} → ${a.subjectName}（${a.relationshipLabel}）: ${a.fillUrl}`,
    );
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success(`已复制 ${pendingAssignments.length} 条链接`);
    });
  };

  const copySingleLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("链接已复制");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>待完成任务清单</DialogTitle>
          <DialogDescription>
            共 {pendingAssignments.length} 个待填写任务，可复制链接分发给评价人
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
            value={filterRelationship}
            onChange={(e) => setFilterRelationship(e.target.value)}
          >
            <option value="">全部关系</option>
            <option value="self">自评</option>
            <option value="manager">上级</option>
            <option value="peer">同事</option>
            <option value="direct_report">下级</option>
            <option value="other">其他</option>
          </select>
          <Button size="sm" variant="outline" onClick={copyAllLinks}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            复制全部链接
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          {pendingAssignments.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              没有待完成的任务
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>被评人</TableHead>
                  <TableHead>评价人</TableHead>
                  <TableHead>关系</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAssignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.subjectName}</TableCell>
                    <TableCell>{a.raterName}</TableCell>
                    <TableCell>{a.relationshipLabel}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copySingleLink(a.fillUrl)}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        复制链接
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
