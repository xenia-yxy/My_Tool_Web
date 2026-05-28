"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
      onClick={() => void signOut({ callbackUrl: "/admin/login" })}
      type="button"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      退出
    </button>
  );
}
