import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <main className="login-shell relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="login-grid absolute inset-0" />
        <div className="login-ribbon login-ribbon-one" />
        <div className="login-ribbon login-ribbon-two" />
      </div>

      <section className="login-panel relative z-10 w-full max-w-md p-6 sm:p-7">
        <Link className="login-back" href="/">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          返回首页
        </Link>
        <div className="mt-8">
          <div aria-hidden="true" className="login-mark">
            <span />
            <span />
            <span />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-950">进入工作台</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            使用账号登录后继续创作。
          </p>
        </div>
        <LoginForm defaultCallbackUrl={callbackUrl} submitLabel="登录" />
      </section>
    </main>
  );
}
