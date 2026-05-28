"use client";

import {
  deleteContentAsset,
  publishContentAsset,
  withdrawContentAsset,
} from "@/server/content-actions";

type ContentAssetActionsProps = {
  id: string;
  status: "PRIVATE" | "PUBLISHED";
};

export function ContentAssetActions({ id, status }: ContentAssetActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status === "PUBLISHED" ? (
        <form action={withdrawContentAsset.bind(null, id)}>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            type="submit"
          >
            撤回
          </button>
        </form>
      ) : (
        <form action={publishContentAsset.bind(null, id)}>
          <button
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            type="submit"
          >
            发布
          </button>
        </form>
      )}

      <form
        action={deleteContentAsset.bind(null, id)}
        onSubmit={(event) => {
          if (!window.confirm("确认删除这条内容资产？此操作不可撤销。")) {
            event.preventDefault();
          }
        }}
      >
        <button
          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          type="submit"
        >
          删除
        </button>
      </form>
    </div>
  );
}
