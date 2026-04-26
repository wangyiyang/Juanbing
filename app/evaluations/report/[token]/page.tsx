import Link from "next/link";
import { notFound } from "next/navigation";

import { SubjectReport } from "@/components/evaluations/subject-report";
import { buildSubjectReport } from "@/lib/evaluations/report-service";
import { verifyReportToken } from "@/lib/evaluations/report-token";
import { ArrowLeft } from "lucide-react";

export default async function SelfServiceReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = await verifyReportToken(token);

  if (!payload) {
    notFound();
  }

  const report = await buildSubjectReport(payload.subjectId);

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/evaluations/report/lookup"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回查询页
          </Link>
        </div>

        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          这是您的 360 环评个人报告，仅供本人查看
        </div>

        <SubjectReport report={report} />
      </div>
    </div>
  );
}
