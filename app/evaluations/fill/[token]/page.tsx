import { EvaluationFillPageClient } from "@/components/evaluations/evaluation-fill-page-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function loadAssignment(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/evaluations/assignments/${token}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as {
      data: {
        assignment: {
          token: string;
          status: string;
          relationship: string;
        };
        cycle: {
          title: string;
          status: string;
          endsAt: number | null;
        };
        subject: {
          name: string;
          department: string;
          title: string;
        };
        survey: import("@/lib/surveys/types").SurveyDetail;
      };
    };
  } catch {
    return null;
  }
}

export default async function EvaluationFillPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await loadAssignment(token);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>评价链接不存在</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            该评价链接无效或已被删除，请联系管理员获取正确的链接。
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, cycle, subject, survey } = result.data;

  if (cycle.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>评价项目尚未开始</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            该项目当前状态为{cycle.status === "draft" ? "草稿" : "已关闭"}，暂不可填写。
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cycle.endsAt && Math.floor(Date.now() / 1000) > cycle.endsAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>评价项目已结束</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            该评价项目已超过截止时间，不再接受新的填写。
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assignment.status === "submitted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>该评价任务已完成</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            您已经提交过该评价，请勿重复填写。
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <EvaluationFillPageClient
      token={token}
      cycleTitle={cycle.title}
      subjectName={subject.name}
      subjectDepartment={subject.department}
      subjectTitle={subject.title}
      relationship={assignment.relationship}
      survey={survey}
    />
  );
}
