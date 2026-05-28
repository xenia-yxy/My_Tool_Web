import Link from "next/link";
import type { Note } from "../../../generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  createContentAsset,
  updateContentAsset,
  withdrawContentAsset,
} from "@/server/content-actions";

type ContentEditorProps = {
  note?: Note;
};

export function ContentEditor({ note }: ContentEditorProps) {
  const action = note ? updateContentAsset.bind(null, note.id) : createContentAsset;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <form action={action} className="grid gap-6 p-5 sm:p-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            标题
          </label>
          <input
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            defaultValue={note?.title}
            id="title"
            name="title"
            placeholder="例如：一次 AI SOP 实践复盘"
            required
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

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="excerpt">
            摘要
          </label>
          <textarea
            className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            defaultValue={note?.excerpt ?? ""}
            id="excerpt"
            name="excerpt"
            placeholder="一句话说明这条内容资产的价值。"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="content">
            Markdown 正文
          </label>
          <textarea
            className="min-h-[460px] rounded-md border border-slate-200 bg-white px-3 py-3 font-mono text-sm leading-7 text-slate-950 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            defaultValue={note?.content ?? ""}
            id="content"
            name="content"
            placeholder={"# 标题\n\n记录真实实践、方法论、提示词、流程和复盘。"}
            required
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-950"
            href="/admin"
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
