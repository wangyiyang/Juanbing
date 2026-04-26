"use client";

import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileCheck } from "lucide-react";

export function EmployeeImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      toast.error("请先粘贴 CSV 内容或上传文件");
      return;
    }

    setPending(true);
    setResult(null);

    try {
      const response = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "导入失败");
      } else {
        setResult(data.data);
        if (data.data.success > 0) {
          toast.success(`成功导入 ${data.data.success} 位员工`);
          router.refresh();
        }
        if (data.data.failed > 0) {
          toast.error(`${data.data.failed} 行导入失败`);
        }
      }
    } catch {
      toast.error("导入请求失败，请重试");
    } finally {
      setPending(false);
    }
  };

  const sampleCsv = `name,email,department,title,manager_email,employee_no
张三,zhangsan@example.com,研发部,工程师,lisi@example.com,E001
李四,lisi@example.com,研发部,技术主管,wangwu@example.com,E002
王五,wangwu@example.com,产品部,产品经理,,E003`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>批量导入员工</DialogTitle>
          <DialogDescription>
            上传 CSV 文件或粘贴 CSV 内容批量导入员工档案
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>CSV 内容</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCsvText(sampleCsv)}
                >
                  填入示例
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  上传文件
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <Textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setResult(null);
              }}
              placeholder={`name,email,department,title,manager_email,employee_no
张三,zhangsan@example.com,研发部,工程师,,E001`}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              必填列：name。可选列：email, department, title, manager_email, employee_no。
              支持通过 manager_email 自动关联上级。
            </p>
          </div>

          {result && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <FileCheck className="h-4 w-4" />
                  成功 {result.success}
                </span>
                {result.failed > 0 && (
                  <span className="text-red-600">失败 {result.failed}</span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-auto space-y-1">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="text-xs text-red-600">
                      第 {err.row} 行：{err.message}
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      ...还有 {result.errors.length - 10} 条错误
                    </div>
                  )}
                </div>
              )}
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
            disabled={pending || !csvText.trim()}
            className="bg-gradient-to-r from-indigo-500 to-violet-600"
            onClick={handleSubmit}
          >
            {pending ? "导入中..." : "开始导入"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
