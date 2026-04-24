import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EditorShell } from "@/components/survey-editor/editor-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getSurveyById } from "@/lib/surveys/service";

export default async function SurveyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const survey = await getSurveyById(Number(id));

  if (!survey) {
    notFound();
  }

  return (
    <AdminShell title={`编辑问卷：${survey.title}`}>
      <EditorShell survey={survey} />
    </AdminShell>
  );
}
