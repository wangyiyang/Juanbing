export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">
          {preview === "1" ? "预览提交成功" : "感谢你的填写"}
        </h1>
        <p className="text-slate-600">
          {preview === "1"
            ? "这是预览模式，数据未入库。"
            : "你的回答已成功提交。"}
        </p>
      </div>
    </main>
  );
}
