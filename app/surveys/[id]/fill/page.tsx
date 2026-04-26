import { notFound, redirect } from "next/navigation";

import { SurveyFillPageClient } from "@/components/survey-fill/survey-fill-page-client";
import { requireAdminSession } from "@/lib/auth/session";
import { getSurveyById } from "@/lib/surveys/service";

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
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{survey.title}</h1>
        <p className="text-slate-600">{survey.description}</p>
      </header>
      <SurveyFillPageClient preview={preview === "1"} survey={survey} />
    </main>
  );
}
