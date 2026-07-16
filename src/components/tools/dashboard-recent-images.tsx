import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { DashboardRecentImage } from "@/server/tools-dashboard";

type DashboardRecentImagesProps = {
  images: DashboardRecentImage[];
};

/**
 * 最近生成图片展示区。
 * 以缩略图网格展示最近 4 张 AI 生成图片，点击跳转到 AI 生图工具。
 * 无图片时展示空状态。
 */
export function DashboardRecentImages({
  images,
}: DashboardRecentImagesProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">
          最近生成图片
        </h2>
        <Link
          className="text-sm font-medium text-blue-700 hover:underline"
          href="/tools/ai-image"
        >
          查看全部
        </Link>
      </div>

      {images.length === 0 ? (
        <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon
              aria-hidden="true"
              className="h-6 w-6 text-slate-300"
            />
            还没有生成过图片
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <Link
              className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-blue-200"
              href="/tools/ai-image"
              key={image.id}
            >
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={image.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  src={image.imageUrl}
                />
              </div>
              <p className="truncate px-2 py-1.5 text-xs font-medium text-slate-600">
                {image.title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
