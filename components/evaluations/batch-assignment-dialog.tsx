"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export function BatchAssignmentDialog({
  open,
  onOpenChange,
  cycleId,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: number;
  subjects: Array<{ id: number; employeeId: number }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [self, setSelf] = useState(true);
  const [manager, setManager] = useState(true);
  const [peerCount, setPeerCount] = useState("2");
  const [directReportCount, setDirectReportCount] = useState("2");
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const handleSubmit = async () => {
    if (subjects.length === 0) {
      toast.error("没有可用的被评人");
      return;
    }

    setPending(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/evaluations/${cycleId}/assignments/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectIds: subjects.map((s) => s.id),
            rules: {
              self,
              manager,
              peerCount: peerCount ? Number(peerCount) : 0,
              directReportCount: directReportCount
                ? Number(directReportCount)
                : 0,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "批量生成失败");
      } else {
        setResult(data.data);
        toast.success(`成功创建 ${data.data.created} 个任务`);
        if (data.data.skipped > 0) {
          toast.info(`跳过 ${data.data.skipped} 个已存在的任务`);
        }
        if (data.data.failed > 0) {
          toast.error(`${data.data.failed} 个任务生成失败`);
        }
        router.refresh();
      }
    } catch {
      toast.error("批量生成请求失败，请重试");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量生成评价任务</DialogTitle>
          <DialogDescription>
            为 {subjects.length} 位被评人按规则自动生成评价任务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自评</Label>
              <p className="text-xs text-muted-foreground">
                为每位被评人生成自评任务
              </p>
            </div>
            <Switch checked={self} onCheckedChange={setSelf} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>上级评价</Label>
              <p className="text-xs text-muted-foreground">
                根据组织架构自动关联上级
              </p>
            </div>
            <Switch checked={manager} onCheckedChange={setManager} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="peerCount">同事评价人数</Label>
            <Input
              id="peerCount"
              type="number"
              min={0}
              max={20}
              value={peerCount}
              onChange={(e) => setPeerCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              从同部门在职员工中随机抽取
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="directReportCount">下级评价人数</Label>
            <Input
              id="directReportCount"
              type="number"
              min={0}
              max={20}
              value={directReportCount}
              onChange={(e) => setDirectReportCount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              从直接下属中抽取（按组织架构 managerId）
            </p>
          </div>

          {result && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600">
                  成功 {result.created}
                </span>
                {result.skipped > 0 && (
                  <span className="text-amber-600">
                    跳过 {result.skipped}
                  </span>
                )}
                {result.failed > 0 && (
                  <span className="text-red-600">失败 {result.failed}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
          <Button
            type="button"
            disabled={pending || subjects.length === 0}
            className="bg-gradient-to-r from-indigo-500 to-violet-600"
            onClick={handleSubmit}
          >
            {pending ? "生成中..." : "开始生成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
