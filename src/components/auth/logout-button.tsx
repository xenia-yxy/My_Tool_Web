"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  callbackUrl?: string;
  className?: string;
  compact?: boolean;
};

export function LogoutButton({
  callbackUrl = "/",
  className,
  compact = false,
}: LogoutButtonProps) {
  return (
    <button
      aria-label="退出登录"
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950",
        className,
      )}
      onClick={() => void signOut({ callbackUrl })}
      title="退出登录"
      type="button"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      {compact ? null : "退出"}
    </button>
  );
}
