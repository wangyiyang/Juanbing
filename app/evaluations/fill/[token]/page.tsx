import { EvaluationFillPageClient } from "@/components/evaluations/evaluation-fill-page-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { employees, evaluationAssignments, evaluationCycles, evaluationSubjects } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { getSurveyById } from "@/lib/surveys/service";

async function loadAssignment(token: string) {
  const assignment = db
    .select()
    .from(evaluationAssignments)
    .where(eq(evaluationAssignments.token, token))
    .get();

  if (!assignment) {
    return null;
  }

  const cycle = db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, assignment.cycleId))
    .get();

  if (!cycle) {
    return null;
  }

  const subject = db
    .select()
    .from(evaluationSubjects)
    .where(eq(evaluationSubjects.id, assignment.subjectId))
    .get();

  const subjectEmployee = subject
    ? db.select().from(employees).where(eq(employees.id, subject.employeeId)).get()
    : undefined;

  const survey = await getSurveyById(cycle.surveyId);

  return {
    assignment: {
      token: assignment.token,
      status: assignment.status,
      relationship: assignment.relationship,
    },
    cycle: {
      title: cycle.title,
      status: cycle.status,
      startsAt: cycle.startsAt,
      endsAt: cycle.endsAt,
    },
    subject: {
      name: subjectEmployee?.name ?? "",
      department: subjectEmployee?.department ?? "",
      title: subjectEmployee?.title ?? "",
    },
    survey,
  };
}

export default async function EvaluationFillPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await loadAssignment(token);

  if (!result || !result.survey) {
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

  const { assignment, cycle, subject, survey } = result;

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

  const now = Math.floor(Date.now() / 1000);

  if (cycle.startsAt && now < cycle.startsAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>评价项目尚未开始</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            该评价项目尚未到开始时间，请稍后再试。
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cycle.endsAt && now > cycle.endsAt) {
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
