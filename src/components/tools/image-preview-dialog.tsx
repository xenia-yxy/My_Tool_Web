"use client";

import Image from "next/image";
import { X } from "lucide-react";

export function ImagePreviewDialog({
  alt = "图片预览",
  imageUrl,
  onClose,
}: {
  alt?: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  if (!imageUrl) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-6xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="关闭图片预览"
          className="absolute right-1 top-1 z-10 grid h-10 w-10 place-items-center rounded-md bg-slate-950/70 text-white hover:bg-slate-950"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
        <Image
          alt={alt}
          className="max-h-[90dvh] w-auto max-w-full rounded-md object-contain"
          height={1600}
          src={imageUrl}
          unoptimized
          width={1600}
        />
      </div>
    </div>
  );
}
