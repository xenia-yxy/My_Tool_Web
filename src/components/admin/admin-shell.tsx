import Link from "next/link";
import { Globe2, Package } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

export function AdminShell({ children, title, description }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-50/70">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-slate-200 bg-white/80 px-5 py-5 backdrop-blur lg:border-b-0 lg:border-r">
          <Link className="block" href="/admin">
            <p className="text-sm font-semibold text-slate-950">YXY AI Practice</p>
            <p className="mt-1 text-xs text-slate-500">内容资产工作台</p>
          </Link>

          <AdminNav />

          <div className="mt-8 flex flex-col items-start gap-3 border-t border-slate-200 pt-5">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
              href="/admin/content/new"
            >
              <Package aria-hidden="true" className="h-4 w-4" />
              新建内容
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
              href="/"
            >
              <Globe2 aria-hidden="true" className="h-4 w-4" />
              返回公开网站
            </Link>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <LogoutButton />
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
