"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveLoginRedirectTarget } from "@/lib/login-redirect-target";

type LoginFormProps = {
  defaultCallbackUrl?: string;
  submitLabel?: string;
  variant?: "default" | "modal";
};

export function LoginForm({
  defaultCallbackUrl = "/account",
  submitLabel = "登录",
  variant = "default",
}: LoginFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") ??
      defaultCallbackUrl;

    const result = await signIn("credentials", {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setError("账号或密码不正确。");
      return;
    }

    window.location.href = resolveLoginRedirectTarget({
      callbackUrl,
      resultUrl: result.url,
      defaultUrl: defaultCallbackUrl,
    });
  }

  const isModal = variant === "modal";

  return (
    <form className={cn("grid gap-4", isModal ? "mt-6" : "mt-8")} onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="identifier">
          账号或邮箱
        </label>
        <input
          autoComplete="username"
          autoFocus={isModal}
          className={cn(
            "rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
            isModal ? "h-12" : "h-11",
          )}
          id="identifier"
          name="identifier"
          placeholder="输入账号或邮箱"
          required
          type="text"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          密码
        </label>
        <input
          autoComplete="current-password"
          className={cn(
            "rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
            isModal ? "h-12" : "h-11",
          )}
          id="password"
          name="password"
          placeholder="输入密码"
          required
          type="password"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button
        className={cn(
          "h-11 gap-2",
          isModal && "mt-1 bg-blue-600 shadow-sm hover:bg-blue-700",
        )}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            正在进入
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
