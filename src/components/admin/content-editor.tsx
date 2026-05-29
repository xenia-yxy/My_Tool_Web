"use client";

import Link from "next/link";
import { useState } from "react";
import { MarkdownPreview } from "@/components/content/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  createContentAsset,
  updateContentAsset,
  withdrawContentAsset,
} from "@/server/content-actions";
import type { ContentAssetStatus } from "@/server/content-assets";

type ContentEditorNote = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ContentAssetStatus;
};

type ContentEditorProps = {
  note?: ContentEditorNote;
};

export function ContentEditor({ note }: ContentEditorProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [excerpt, setExcerpt] = useState(note?.excerpt ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const action = note ? updateContentAsset.bind(null, note.id) : createContentAsset;
  const previewTitle = title.trim() || "未命名内容";
  const previewExcerpt = excerpt.trim();

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <form action={action} className="grid gap-6 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              标题
            </label>
            <input
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              id="title"
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：一次 AI SOP 实践复盘"
              required
              value={title}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="slug">
              链接标识
            </label>
            <input
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              defaultValue={note?.slug}
              id="slug"
              name="slug"
              placeholder="留空时会根据标题生成"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="excerpt">
            摘要
          </label>
          <textarea
            className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            id="excerpt"
            name="excerpt"
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="一句话说明这条内容资产的价值。"
            value={excerpt}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="content">
              Markdown 正文
            </label>
            <textarea
              className="min-h-[520px] rounded-md border border-slate-200 bg-white px-3 py-3 font-mono text-sm leading-7 text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              id="content"
              name="content"
              onChange={(event) => setContent(event.target.value)}
              placeholder={"# 标题\n\n记录真实实践、方法论、提示词、流程和复盘。"}
              required
              value={content}
            />
          </div>

          <section className="grid gap-2">
            <div>
              <p className="text-sm font-medium text-slate-700">公开效果预览</p>
              <p className="mt-1 text-xs text-slate-500">
                包含标题、摘要和正文，接近公开知识详情页排版。
              </p>
            </div>
            <div className="min-h-[520px] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <div className="h-full min-h-[520px] overflow-auto bg-white px-5 py-4">
                <header className="border-b border-slate-100 pb-5">
                  <p className="text-xs font-medium text-slate-400">
                    内容资产预览
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-slate-950">
                    {previewTitle}
                  </h2>
                  {previewExcerpt ? (
                    <p className="mt-3 text-base leading-7 text-slate-600">
                      {previewExcerpt}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      摘要为空，发布后正文前不会显示摘要。
                    </p>
                  )}
                </header>
                {content.trim() ? (
                  <MarkdownPreview content={content} />
                ) : (
                  <p className="mt-5 text-sm leading-6 text-slate-400">
                    在左侧输入 Markdown 后，这里会实时显示预览。
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
            href="/admin/content"
          >
            返回内容资产列表
          </Link>

          <div className="flex flex-wrap gap-2">
            {note?.status === "PUBLISHED" ? (
              <Button
                formAction={withdrawContentAsset.bind(null, note.id)}
                type="submit"
                variant="secondary"
              >
                撤回
              </Button>
            ) : null}
            <Button name="intent" type="submit" value="draft" variant="secondary">
              保存草稿
            </Button>
            <Button name="intent" type="submit" value="publish">
              发布
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
