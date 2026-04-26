"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, ArrowLeft } from "lucide-react";

export default function ReportLookupPage() {
  const [employeeNo, setEmployeeNo] = useState("");
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<
    Array<{
      subjectId: number;
      cycleId: number;
      cycleTitle: string;
      token: string;
    }>
  >([]);

  const handleSubmit = async () => {
    if (!employeeNo.trim()) {
      toast.error("请输入员工编号");
      return;
    }

    setPending(true);
    setResults([]);

    try {
      const response = await fetch("/api/evaluations/report/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeNo: employeeNo.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "查询失败");
      } else {
        setResults(data.data);
        if (data.data.length === 0) {
          toast.info("暂无可用报告");
        }
      }
    } catch {
      toast.error("查询请求失败，请重试");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回首页
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              查看我的 360 报告
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeNo">员工编号</Label>
              <div className="flex gap-2">
                <Input
                  id="employeeNo"
                  placeholder="请输入员工编号"
                  value={employeeNo}
                  onChange={(e) => setEmployeeNo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <Button
                  disabled={pending || !employeeNo.trim()}
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600"
                >
                  <Search className="mr-1 h-4 w-4" />
                  查询
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                输入员工编号查询已关闭环评项目的个人报告
              </p>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium">可查看的报告</h3>
                <div className="space-y-2">
                  {results.map((r) => (
                    <Link
                      key={r.subjectId}
                      href={`/evaluations/report/${r.token}`}
                    >
                      <div className="flex items-center justify-between rounded-lg border bg-white p-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="text-sm font-medium">
                            {r.cycleTitle}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            点击查看报告
                          </div>
                        </div>
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
