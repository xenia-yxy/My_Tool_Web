"use client";

import { X } from "lucide-react";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AdvancedParameterModalProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function AdvancedParameterModal({
  children,
  description,
  onClose,
  open,
  title,
}: AdvancedParameterModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[86dvh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="关闭高级参数"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end border-t border-slate-100 p-4">
          <Button onClick={onClose} type="button">
            保存参数
          </Button>
        </div>
      </div>
    </div>
  );
}
