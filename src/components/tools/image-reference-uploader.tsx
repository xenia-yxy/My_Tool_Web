"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";

type ImageReferenceUploaderProps = {
  files: File[];
  label: string;
  helper: string;
  emptyText: string;
  onChange: (files: File[]) => void;
  maxFiles?: number;
};

export function ImageReferenceUploader({
  emptyText,
  files,
  helper,
  label,
  maxFiles = 8,
  onChange,
}: ImageReferenceUploaderProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function appendFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    onChange([...files, ...Array.from(selectedFiles)].slice(0, maxFiles));
    event.target.value = "";
  }

  function removeFile(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800" htmlFor={inputId}>
          {label}
        </label>
        <span className="text-xs text-slate-500">
          {files.length}/{maxFiles} 张
        </span>
      </div>
      <div className="grid min-h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
        {previewUrls.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {previewUrls.map((url, index) => (
              <div className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white" key={`${url}-${index}`}>
                <button
                  aria-label={`预览${label}${index + 1}`}
                  className="absolute inset-0"
                  onClick={() => setPreviewUrl(url)}
                  type="button"
                >
                <Image
                  alt={`${label} ${index + 1}`}
                  className="object-contain"
                  fill
                  sizes="120px"
                  src={url}
                  unoptimized
                />
                </button>
                <button
                  aria-label={`删除${label}${index + 1}`}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeFile(index)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <label className="grid cursor-pointer gap-2 text-sm text-slate-500" htmlFor={inputId}>
            <Upload className="mx-auto h-7 w-7" />
            <span className="font-medium text-slate-700">{emptyText}</span>
            <span className="text-xs">{helper}</span>
          </label>
        )}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        id={inputId}
        multiple
        onChange={appendFiles}
        type="file"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="cursor-pointer text-xs font-semibold text-blue-700 hover:text-blue-900"
          htmlFor={inputId}
        >
          {files.length > 0 ? "继续添加图片" : "选择图片"}
        </label>
        {files.length > 0 ? (
          <button
            className="text-xs font-semibold text-slate-500 hover:text-slate-950"
            onClick={() => onChange([])}
            type="button"
          >
            清空全部
          </button>
        ) : null}
      </div>
      <ImagePreviewDialog imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}
