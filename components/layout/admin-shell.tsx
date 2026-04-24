import Link from "next/link";

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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link className="text-sm text-slate-500" href="/">
            Juanbing
          </Link>
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
