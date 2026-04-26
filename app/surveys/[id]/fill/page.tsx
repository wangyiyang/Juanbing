import { notFound, redirect } from "next/navigation";

import { SurveyFillPageClient } from "@/components/survey-fill/survey-fill-page-client";
import { requireAdminSession } from "@/lib/auth/session";
import { getSurveyById } from "@/lib/surveys/service";
import { ClipboardList } from "lucide-react";

export default async function SurveyFillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;

  if (preview === "1") {
    try {
      await requireAdminSession();
    } catch {
      redirect("/login");
    }
  }

  const survey = await getSurveyById(Number(id));

  if (!survey) {
    notFound();
  }

  if (survey.status !== "published" && preview !== "1") {
    notFound();
  }

  if (survey.expiresAt && Math.floor(Date.now() / 1000) > survey.expiresAt && preview !== "1") {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">问卷已过期</h1>
        <p className="mt-2 text-slate-600">
          该问卷已于 {new Date(survey.expiresAt * 1000).toLocaleDateString("zh-CN")} 截止。
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">
            卷饼问卷
          </span>
          {preview === "1" ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
              预览模式
            </span>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header className="space-y-2 rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {survey.title}
          </h1>
          {survey.description ? (
            <p className="text-slate-600">{survey.description}</p>
          ) : null}
        </header>
        <SurveyFillPageClient preview={preview === "1"} survey={survey} />
      </main>
    </div>
  );
}
