"use client";

import { useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ComponentPalette } from "@/components/survey-editor/component-palette";
import { PropertyPanel } from "@/components/survey-editor/property-panel";
import { QuestionList } from "@/components/survey-editor/question-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Copy,
  Eye,
  FileEdit,
  Save,
  Share2,
} from "lucide-react";
import {
  createInitialEditorState,
  editorReducer,
} from "@/lib/surveys/editor-state";
import type { SurveyDetail } from "@/lib/surveys/types";

export function EditorShell({ survey }: { survey?: SurveyDetail | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, dispatch] = useReducer(
    editorReducer,
    createInitialEditorState(survey),
  );
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedQuestion = useMemo(
    () =>
      state.questions.find(
        (question) => question.clientId === state.selectedQuestionId,
      ) ?? null,
    [state.questions, state.selectedQuestionId],
  );

  async function handleSave() {
    setPending(true);

    const response = await fetch(survey ? `/api/surveys/${survey.id}` : "/api/surveys", {
      method: survey ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: state.title,
        description: state.description,
        expiresAt: state.expiresAt,
        questions: state.questions.map((question) => ({
          id: question.id,
          type: question.type,
          title: question.title,
          required: question.required,
          orderIndex: question.orderIndex,
          config: question.config ?? null,
          options: question.options,
        })),
      }),
    });

    setPending(false);

    if (!response.ok) {
      toast.error("保存失败，请检查题目配置");
      return;
    }

    const payload = (await response.json()) as { data: { id: number } };
    toast.success("问卷已保存");

    if (!survey) {
      router.replace(`/surveys/${payload.data.id}`);
    }

    router.refresh();
  }

  const handleShare = () => {
    if (!survey) {
      toast.error("请先保存问卷");
      return;
    }
    if (survey.status !== "published") {
      toast.error("问卷未发布，请先发布后再分享");
      return;
    }
    const url = `${window.location.origin}/surveys/${survey.id}/fill`;
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <header className="border-b bg-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <FileEdit className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">
                {state.title || "未命名问卷"}
              </h1>
              <p className="text-xs text-slate-500">
                {state.questions.length} 个问题
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {survey ? (
              <Button
                className="text-slate-600"
                size="sm"
                type="button"
                variant="outline"
                onClick={() =>
                  window.open(`/surveys/${survey.id}/fill?preview=1`, "_blank")
                }
              >
                <Eye className="mr-1 h-4 w-4" />
                预览
              </Button>
            ) : null}
            {survey ? (
              <Button
                className="text-slate-600"
                size="sm"
                type="button"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="mr-1 h-4 w-4" />
                分享
              </Button>
            ) : null}
            <Button
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
              disabled={pending}
              size="sm"
              type="button"
              onClick={handleSave}
            >
              <Save className="mr-1 h-4 w-4" />
              {pending ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette
          onAdd={(questionType) =>
            dispatch({ type: "addQuestion", questionType })
          }
        />
        <Separator orientation="vertical" className="h-auto" />
        <section className="flex-1 overflow-auto bg-slate-50/50 p-4">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
              <Input
                className="text-lg font-semibold"
                placeholder="问卷标题"
                value={state.title}
                onChange={(event) =>
                  dispatch({ type: "setTitle", value: event.target.value })
                }
              />
              <Input
                placeholder="问卷描述（可选）"
                value={state.description}
                onChange={(event) =>
                  dispatch({ type: "setDescription", value: event.target.value })
                }
              />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="expires-at">
                  过期时间（可选）
                </label>
                <Input
                  id="expires-at"
                  type="date"
                  value={
                    state.expiresAt
                      ? new Date(state.expiresAt * 1000).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(event) => {
                    const dateValue = event.target.value;
                    dispatch({
                      type: "setExpiresAt",
                      value: dateValue
                        ? Math.floor(new Date(dateValue).getTime() / 1000)
                        : null,
                    });
                  }}
                />
              </div>
            </div>
            <QuestionList
              onDelete={(clientId) =>
                dispatch({ type: "deleteQuestion", clientId })
              }
              onMoveUp={(clientId) =>
                dispatch({ type: "moveQuestionUp", clientId })
              }
              onSelect={(clientId) =>
                dispatch({ type: "selectQuestion", clientId })
              }
              questions={state.questions}
              selectedQuestionId={state.selectedQuestionId}
            />
          </div>
        </section>
        <Separator orientation="vertical" className="h-auto" />
        <div className="w-80 shrink-0 overflow-auto bg-white p-4">
          <PropertyPanel
            onChange={(patch) => {
              if (!selectedQuestion) {
                return;
              }

              dispatch({
                type: "updateQuestion",
                clientId: selectedQuestion.clientId,
                patch,
              });
            }}
            question={selectedQuestion}
          />
        </div>
      </div>

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
                className={copied ? "bg-emerald-500 hover:bg-emerald-600" : ""}
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
    </div>
  );
}
