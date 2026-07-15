"use client";

import Image from "next/image";
import { Images, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ImagePreviewDialog } from "@/components/tools/image-preview-dialog";
import type { MenswearMaterial } from "@/components/tools/menswear/types";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<string, string> = {
  accessory: "配饰",
  background: "背景",
  bag: "包",
  bottom: "裤子",
  composition: "构图",
  inner: "内搭",
  lighting: "光线",
  model_body: "模特身体",
  model_face: "模特脸部",
  mood: "氛围",
  outfit: "整套穿搭",
  other: "其他",
  pose: "姿势",
  shoes: "鞋子",
  top: "上衣",
};

export function MaterialPickerDialog({
  materials,
  onSelect,
  selectedId,
}: {
  materials: MenswearMaterial[];
  onSelect: (material: MenswearMaterial) => void;
  selectedId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const categories = useMemo(
    () => Array.from(new Set(materials.map((item) => item.category))).sort(),
    [materials],
  );
  const visibleMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return materials.filter((material) => {
      const matchesCategory = !category || material.category === category;
      const haystack = `${material.name} ${material.tags.join(" ")}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [category, materials, query]);

  function choose(material: MenswearMaterial) {
    onSelect(material);
    setIsOpen(false);
  }

  return (
    <>
      <Button className="h-9 gap-2" onClick={() => setIsOpen(true)} type="button" variant="secondary">
        <Images className="h-4 w-4" />
        从素材库选择
      </Button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 sm:p-6">
          <div className="mx-auto grid h-full max-w-6xl grid-rows-[auto_auto_1fr] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div><h2 className="text-base font-semibold text-slate-950">公开素材库</h2><p className="mt-1 text-xs text-slate-500">选择一张完整素材作为当前参考图。</p></div>
              <button aria-label="关闭素材库" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setIsOpen(false)} type="button"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_200px]">
              <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称或标签" value={query} /></label>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setCategory(event.target.value)} value={category}><option value="">全部分类</option>{categories.map((value) => <option key={value} value={value}>{categoryLabels[value] || value}</option>)}</select>
            </div>
            <div className="overflow-auto p-4">
              {visibleMaterials.length === 0 ? <div className="grid min-h-56 place-items-center border border-dashed border-slate-300 text-sm text-slate-500">暂无匹配素材，请先上传图片。</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visibleMaterials.map((material) => <article className={`overflow-hidden rounded-md border bg-white ${selectedId === material.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`} key={material.id}><button aria-label={`预览 ${material.name}`} className="relative block aspect-square w-full cursor-zoom-in bg-slate-50" onClick={() => setPreviewUrl(material.imageUrl)} type="button"><Image alt={material.name} className="object-contain" fill sizes="180px" src={material.imageUrl} unoptimized /></button><div className="grid gap-2 p-3"><p className="truncate text-sm font-semibold text-slate-900">{material.name}</p><p className="text-xs text-slate-500">{categoryLabels[material.category] || material.category}</p><Button className="h-8 text-xs" onClick={() => choose(material)} type="button" variant={selectedId === material.id ? "default" : "secondary"}>{selectedId === material.id ? "已选择" : "使用此素材"}</Button></div></article>)}</div>}
            </div>
          </div>
        </div>
      ) : null}
      <ImagePreviewDialog imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
    </>
  );
}
