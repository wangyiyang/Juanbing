import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock } from "lucide-react";

export function ResultsOverview({
  totalResponses,
  averageDurationSeconds,
}: {
  totalResponses: number;
  averageDurationSeconds: number;
}) {
  const minutes = Math.floor(averageDurationSeconds / 60);
  const seconds = averageDurationSeconds % 60;
  const durationText =
    minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-slate-200/80 bg-white transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600">
              回收量
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">{totalResponses}</p>
          <p className="mt-1 text-xs text-slate-500">份有效答卷</p>
        </CardContent>
      </Card>
      <Card className="border-slate-200/80 bg-white transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600">
              平均填写时长
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-slate-900">{durationText}</p>
          <p className="mt-1 text-xs text-slate-500">每份问卷平均耗时</p>
        </CardContent>
      </Card>
    </div>
  );
}
