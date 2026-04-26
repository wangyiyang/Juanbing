"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubjectReport } from "@/lib/evaluations/report-service";
import { EyeOff } from "lucide-react";

const RELATIONSHIP_LABEL: Record<string, string> = {
  self: "自评",
  manager: "上级",
  peer: "同事",
  direct_report: "下级",
  other: "其他",
};

export function SubjectReport({ report }: { report: SubjectReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              被评人
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{report.subject.employeeName}</div>
            <div className="text-xs text-slate-500">
              {report.subject.department} {report.subject.title}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              项目
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{report.cycle.title}</div>
            <div className="text-xs text-slate-500">
              匿名阈值：{report.cycle.anonymityThreshold}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              完成度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {report.completion.submittedAssignments}/
              {report.completion.totalAssignments}
            </div>
          </CardContent>
        </Card>
      </div>

      {report.ratingQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">评分题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.ratingQuestions.map((question) => (
              <div key={question.questionId}>
                <h3 className="mb-2 text-sm font-medium">{question.title}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>关系组</TableHead>
                      <TableHead>平均分</TableHead>
                      <TableHead>样本数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {question.groups.map((group) => (
                      <TableRow key={group.relationship}>
                        <TableCell>
                          {RELATIONSHIP_LABEL[group.relationship] ??
                            group.relationship}
                        </TableCell>
                        <TableCell>
                          {group.hidden ? (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <EyeOff className="h-3 w-3" />
                              已隐藏
                            </span>
                          ) : (
                            group.average
                          )}
                        </TableCell>
                        <TableCell>{group.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {report.textQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">开放题摘录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.textQuestions.map((question) => (
              <div key={question.questionId}>
                <h3 className="mb-2 text-sm font-medium">{question.title}</h3>
                {question.groups.map((group) => (
                  <div key={group.relationship} className="mb-4">
                    <div className="mb-1 text-xs font-medium text-slate-500">
                      {RELATIONSHIP_LABEL[group.relationship] ??
                        group.relationship}
                    </div>
                    {group.hidden ? (
                      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-400">
                        <EyeOff className="mr-1 inline h-3 w-3" />
                        样本数不足，已按匿名规则隐藏
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.answers.map((answer, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
                          >
                            {answer}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(report.ratingQuestions.length === 0 &&
        report.textQuestions.length === 0) && (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            暂无报告数据，请等待评价任务提交后查看
          </CardContent>
        </Card>
      )}
    </div>
  );
}
