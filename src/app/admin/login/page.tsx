import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
        <Link className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/">
          返回公开网站
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold text-blue-700">YXY AI Practice</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            登录内容资产工作台
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            后台是私有操作区，只用于管理 Markdown 内容、草稿和公开知识库发布。
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
