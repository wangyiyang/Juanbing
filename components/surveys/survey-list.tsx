import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SurveyList({
  surveys,
}: {
  surveys: Array<{
    id: number;
    title: string;
    status: string;
    createdAt: number;
    expiresAt: number | null;
  }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surveys.map((survey) => (
          <TableRow key={survey.id}>
            <TableCell>{survey.title}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge variant="secondary">{survey.status}</Badge>
                {survey.expiresAt ? (
                  <span className="text-xs text-slate-500">
                    到期：{new Date(survey.expiresAt * 1000).toLocaleDateString("zh-CN")}
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {new Date(survey.createdAt * 1000).toLocaleString("zh-CN")}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/surveys/${survey.id}`}>编辑</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/surveys/${survey.id}/results`}>结果</Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
