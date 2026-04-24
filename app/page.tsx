import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Juanbing 问卷平台</h1>
        <p className="text-base text-slate-600">
          单管理员维护、自助发布链接、轻量收集数据的中文问卷系统。
        </p>
      </div>
      <Button asChild>
        <Link href="/surveys">进入管理台</Link>
      </Button>
    </main>
  );
}
