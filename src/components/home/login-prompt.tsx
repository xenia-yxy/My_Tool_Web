"use client";

import { useEffect, useState } from "react";
import { LogIn, X } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

type LoginPromptProps = {
  autoOpenFromQuery?: boolean;
  defaultCallbackUrl?: string;
};

export function LoginPrompt({
  autoOpenFromQuery = false,
  defaultCallbackUrl = "/tools",
}: LoginPromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!autoOpenFromQuery) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("login") === "1") {
      const timeoutId = window.setTimeout(() => setIsOpen(true), 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [autoOpenFromQuery]);

  return (
    <>
      <button
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-4 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:bg-white"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        登录
      </button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid min-h-dvh place-items-center bg-slate-900/28 px-5 py-8 backdrop-blur-md"
          role="dialog"
        >
          <div className="max-h-[calc(100dvh-4rem)] w-full max-w-[430px] overflow-y-auto rounded-2xl border border-white/90 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Xenia Tools
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  进入个人库
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  登录后进入内部空间，继续整理工具、知识和计划。
                </p>
              </div>
              <button
                aria-label="关闭登录提示"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <LoginForm
              defaultCallbackUrl={defaultCallbackUrl}
              submitLabel="进入个人库"
              variant="modal"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
