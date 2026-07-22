import Link from "next/link";
import { LogIn } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeSwitch } from "@/components/home/theme-switch";
import { getAppSession } from "@/server/auth";

export async function SiteHeader() {
  const session = await getAppSession();
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-5 lg:px-8">
        <Link
          aria-label="返回首页"
          className="home-logo group grid h-10 w-10 place-items-center"
          href="/"
        >
          <span className="home-logo-layer home-logo-layer-one" />
          <span className="home-logo-layer home-logo-layer-two" />
          <span className="home-logo-layer home-logo-layer-three" />
        </Link>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <>
              <span className="home-session-state">已登录</span>
              <Link className="home-login-button" href="/tools">
                进入工作台
              </Link>
              <LogoutButton
                callbackUrl="/"
                className="home-icon-button"
                compact
              />
            </>
          ) : (
            <Link className="home-login-button" href="/login?callbackUrl=%2Ftools">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              登录
            </Link>
          )}
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
