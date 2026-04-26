import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  FileEdit,
  Share2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">卷饼</h1>
              <p className="text-xs text-slate-500">轻量问卷平台</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Main Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl">
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              卷饼问卷平台
            </h1>
            <p className="mx-auto max-w-xl text-base text-slate-600">
              单管理员维护、自助发布链接、轻量收集数据的中文问卷系统。创建问卷，分享链接，实时查看结果。
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-violet-600 px-8 text-base shadow-md hover:from-indigo-600 hover:to-violet-700"
            size="lg"
          >
            <Link href="/surveys">进入管理台</Link>
          </Button>
        </section>

        {/* Feature Cards */}
        <section className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/80 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <FileEdit className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-base">创建问卷</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                支持单选、多选、填空、评分、下拉、日期等多种题型，拖拽排序快速搭建。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Share2 className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-base">分享链接</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                一键发布问卷，生成公开链接，通过微信、邮件等任意渠道分发。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <ExternalLink className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-base">收集数据</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                匿名填写，自动去重，实时收集答卷数据，支持移动端自适应。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
                <BarChart3 className="h-5 w-5 text-rose-600" />
              </div>
              <CardTitle className="text-base">分析结果</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                可视化数据看板，趋势图表展示，一键导出 CSV 进行深度分析。
              </CardDescription>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60 py-6 text-center text-sm text-slate-500">
        <p>卷饼问卷平台 · 轻量、简单、高效</p>
        <p className="mt-1 text-xs text-slate-400">Made by Wang Yiyang</p>
      </footer>
    </div>
  );
}
