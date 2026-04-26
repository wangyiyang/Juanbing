import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function EvaluationThankYouPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
          <CardTitle className="text-center">提交成功</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-500">
          感谢您的填写，评价结果将匿名汇总后反馈给被评人。
        </CardContent>
      </Card>
    </div>
  );
}
