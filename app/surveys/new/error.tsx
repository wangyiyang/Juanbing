"use client";

export default function NewSurveyErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">加载失败</h1>
      <p className="text-slate-600">
        {error.message || "页面加载时出现错误，请稍后重试。"}
      </p>
    </main>
  );
}
