"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft: { label: "草稿", variant: "secondary", color: "text-slate-600 bg-slate-100 border-slate-200" },
  published: { label: "已发布", variant: "default", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  closed: { label: "已关闭", variant: "outline", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

export function SurveyList({
  surveys,
}: {
  surveys: Array<{
    id: number;
    title: string;
    description: string | null;
    status: string;
    createdAt: number;
    updatedAt: number;
  }>;
}) {
  const router = useRouter();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = (surveyId: number, status: string) => {
    if (status !== "published") {
      toast.error("问卷未发布，请先发布后再分享");
      return;
    }
    const url = `${window.location.origin}/surveys/${surveyId}/fill`;
    setShareUrl(url);
    setCopied(false);
    setShareDialogOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
    }
  };

  const handleDelete = async (surveyId: number) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("删除失败");
      toast.success("问卷已删除");
      router.refresh();
    } catch {
      toast.error("删除失败，请重试");
    }
  };

  const handleToggleStatus = async (surveyId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "closed" : "published";
    try {
      const response = await fetch(`/api/surveys/${surveyId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) throw new Error("状态切换失败");
      toast.success(nextStatus === "published" ? "问卷已发布" : "问卷已关闭");
      router.refresh();
    } catch {
      toast.error("操作失败，请重试");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">共 {surveys.length} 个问卷</p>
      </div>

      {surveys.length === 0 ? (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-slate-700">
              还没有问卷
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              点击右上角按钮创建你的第一个问卷
            </p>
            <Button
              asChild
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              variant="outline"
            >
              <Link href="/surveys/new">
                <Plus className="mr-2 h-4 w-4" />
                立即创建
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const statusInfo = STATUS_MAP[survey.status] ?? STATUS_MAP.draft;
            return (
              <Card
                key={survey.id}
                className="group border-slate-200/80 bg-white transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">
                        {survey.title}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`shrink-0 text-xs ${statusInfo.color}`}
                      variant="outline"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1 min-h-[2.5rem] text-xs">
                    {survey.description || "暂无描述"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      创建于{" "}
                      {new Date(survey.createdAt * 1000).toLocaleDateString(
                        "zh-CN",
                      )}
                    </span>
                    <span>
                      更新于{" "}
                      {new Date(survey.updatedAt * 1000).toLocaleDateString(
                        "zh-CN",
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/surveys/${survey.id}`}>
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={survey.status !== "published"}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare(survey.id, survey.status)}
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      分享
                    </Button>
                    <Button
                      className="h-8 px-2 text-xs text-slate-600 hover:bg-amber-50 hover:text-amber-600"
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/surveys/${survey.id}/results`}>
                        <BarChart3 className="mr-1 h-3.5 w-3.5" />
                        结果
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button
                          className="h-8 px-2 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            删除问卷「{survey.title}」将同时删除所有收集的数据，此操作不可恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDelete(survey.id)}
                          >
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {survey.status !== "draft" && (
                    <div className="mt-2 border-t pt-2">
                      <Button
                        className="w-full h-7 text-xs"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleToggleStatus(survey.id, survey.status)
                        }
                      >
                        {survey.status === "published" ? (
                          <>
                            <EyeOff className="mr-1 h-3.5 w-3.5" />
                            关闭问卷
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            重新发布
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分享问卷</DialogTitle>
            <DialogDescription>
              将以下链接发送给他人即可填写问卷
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input className="flex-1 bg-slate-50" readOnly value={shareUrl} />
              <Button
                className={
                  copied
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : ""
                }
                onClick={copyToClipboard}
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
