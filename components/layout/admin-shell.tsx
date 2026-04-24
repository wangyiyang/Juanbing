import Link from "next/link";

import { ClipboardList } from "lucide-react";

export function AdminShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-2" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Juanbing
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="text-slate-500 transition-colors hover:text-indigo-600"
              href="/"
            >
              首页
            </Link>
            <Link
              className="font-medium text-indigo-600"
              href="/surveys"
            >
              问卷管理
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">问卷管理</p>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          </div>
          {actions}
        </header>
        {children}
      </main>
    </div>
  );
}
