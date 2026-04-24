import { CheckCircle } from "lucide-react";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            {preview === "1" ? "预览提交成功" : "感谢你的填写"}
          </h1>
          <p className="text-slate-600">
            {preview === "1"
              ? "这是预览模式，数据未入库。"
              : "你的回答已成功提交。"}
          </p>
        </div>
      </div>
    </div>
  );
}
