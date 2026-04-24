import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EditorShell } from "@/components/survey-editor/editor-shell";
import { requireAdminSession } from "@/lib/auth/session";

export default async function NewSurveyPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  return (
    <AdminShell title="新建问卷">
      <EditorShell />
    </AdminShell>
  );
}
