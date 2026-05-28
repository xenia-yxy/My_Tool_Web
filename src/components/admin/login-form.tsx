"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") ?? "/admin";

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

    window.location.href = result.url ?? callbackUrl;
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="identifier">
          管理员账号
        </label>
        <input
          autoComplete="username"
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          id="identifier"
          name="identifier"
          placeholder="yangxinyu"
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
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "登录中..." : "进入后台"}
      </Button>
    </form>
  );
}
