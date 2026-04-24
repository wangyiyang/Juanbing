import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResultsOverview({
  totalResponses,
  averageDurationSeconds,
}: {
  totalResponses: number;
  averageDurationSeconds: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>回收量</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {totalResponses}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>平均填写时长</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {averageDurationSeconds} 秒
        </CardContent>
      </Card>
    </div>
  );
}
