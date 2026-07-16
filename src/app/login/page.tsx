import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAppSession } from "@/server/auth";
import { normalizeUserCallbackPath } from "@/server/user-auth-redirects";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAppSession();
  const params = await searchParams;
  const callbackUrl = normalizeUserCallbackPath(params?.callbackUrl, "/account");

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-5 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-grid absolute inset-0" />
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/80 bg-white/86 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.13)] backdrop-blur-xl">
        <Link className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/">
          返回 Xenia Tools
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold text-slate-500">Xenia Tools</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            进入个人库
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            这个库还在生长。登录后继续进入内部空间，里面放当前能用的东西。
          </p>
        </div>
        <LoginForm defaultCallbackUrl={callbackUrl} submitLabel="进入" />
      </section>
    </main>
  );
}
