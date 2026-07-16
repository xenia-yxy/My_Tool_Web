"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };
type ProductImage = { id?: string; imageUrl: string; isPrimary: boolean; position?: number };
type Product = { id: string; categoryId: string | null; name: string; description: string | null; tags: string[]; sellPoints: string[]; scenes: string[]; keywords: string[]; images: ProductImage[] };

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [sellPoints, setSellPoints] = useState("");
  const [scenes, setScenes] = useState("");
  const [keywords, setKeywords] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const categoriesResponse = await fetch("/api/tools/product-categories", { cache: "no-store" });
      const categoryPayload = await categoriesResponse.json() as { categories?: Category[]; error?: string };
      if (!categoriesResponse.ok) throw new Error(categoryPayload.error || "加载分类失败");
      setCategories(categoryPayload.categories ?? []);
      if (!productId) return;
      const response = await fetch(`/api/tools/products/${productId}`, { cache: "no-store" });
      const payload = await response.json() as { product?: Product; error?: string };
      if (!response.ok || !payload.product) throw new Error(payload.error || "加载选品失败");
      const product = payload.product;
      setName(product.name); setCategoryId(product.categoryId ?? ""); setDescription(product.description ?? ""); setTags(product.tags.join(" ")); setSellPoints(product.sellPoints.join("\n")); setScenes(product.scenes.join(" ")); setKeywords(product.keywords.join(" ")); setImages(product.images);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "加载选品失败"); }
    finally { setIsLoading(false); }
  }, [productId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const available = 12 - images.length;
    if (available <= 0) { setError("每个选品最多上传 12 张图片"); return; }
    setIsUploading(true); setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).slice(0, available).map(async (file) => {
        const body = new FormData(); body.set("image", file);
        const response = await fetch("/api/tools/products/upload", { method: "POST", body });
        const payload = await response.json() as { imageUrl?: string; error?: string };
        if (!response.ok || !payload.imageUrl) throw new Error(payload.error || "上传商品图片失败");
        return payload.imageUrl;
      }));
      setImages((current) => [...current, ...uploaded.map((imageUrl, index) => ({ imageUrl, isPrimary: current.length === 0 && index === 0 }))]);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "上传商品图片失败"); }
    finally { setIsUploading(false); }
  }

  async function save() {
    if (!name.trim()) { setError("请填写商品名称"); return; }
    if (!images.length) { setError("请至少上传一张商品图片"); return; }
    setIsSaving(true); setError(null);
    try {
      const primaryImageUrl = images.find((image) => image.isPrimary)?.imageUrl ?? images[0]!.imageUrl;
      const response = await fetch(productId ? `/api/tools/products/${productId}` : "/api/tools/products", { method: productId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), categoryId: categoryId || null, description, imageUrls: images.map((image) => image.imageUrl), primaryImageUrl, tags: split(tags), sellPoints: split(sellPoints), scenes: split(scenes), keywords: split(keywords) }) });
      const payload = await response.json() as { product?: { id: string }; error?: string };
      if (!response.ok || !payload.product) throw new Error(payload.error || "保存选品失败");
      router.replace(`/tools/products/${payload.product.id}`); router.refresh();
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "保存选品失败"); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><section className="grid gap-4"><div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">商品名称</span><input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setName(event.target.value)} value={name} /></label><label className="grid gap-2"><span className="text-sm font-medium">主分类</span><select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">未分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="grid gap-2 md:col-span-2"><span className="text-sm font-medium">商品描述</span><textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm" onChange={(event) => setDescription(event.target.value)} value={description} /></label><TextField label="标签" onChange={setTags} value={tags} /><TextField label="搜索关键词" onChange={setKeywords} value={keywords} /><TextField label="卖点" multiline onChange={setSellPoints} value={sellPoints} /><TextField label="适用场景" onChange={setScenes} value={scenes} /></div><section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">商品图片</h2><p className="mt-1 text-xs text-slate-500">1-12 张，可设置主图。图片只属于选品中心。</p></div><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white"><Upload className="h-4 w-4" />{isUploading ? "上传中" : "上传图片"}<input accept="image/png,image/jpeg,image/webp" className="hidden" disabled={isUploading} multiple onChange={(event) => { void upload(event.target.files); event.target.value = ""; }} type="file" /></label></div><div className="grid gap-3 sm:grid-cols-3">{images.map((image) => <div className="relative overflow-hidden rounded-md border border-slate-200" key={image.imageUrl}><div className="relative aspect-square bg-slate-50"><Image alt="商品图片" className="object-cover" fill sizes="200px" src={image.imageUrl} unoptimized /></div><div className="flex items-center justify-between p-2"><button className={`rounded p-1 ${image.isPrimary ? "text-amber-500" : "text-slate-400"}`} onClick={() => setImages((current) => current.map((item) => ({ ...item, isPrimary: item.imageUrl === image.imageUrl })))} title="设为主图" type="button"><Star className="h-4 w-4" fill={image.isPrimary ? "currentColor" : "none"} /></button><button className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => setImages((current) => current.filter((item) => item.imageUrl !== image.imageUrl))} title="删除图片" type="button"><Trash2 className="h-4 w-4" /></button></div></div>)}</div></section></section><aside className="grid content-start gap-3"><div className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold">保存选品</h2><p className="mt-2 text-sm leading-6 text-slate-500">保存后可在详情页手动发起 AI 分析，或选择图片复制到素材库。</p>{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}<Button className="mt-4 w-full" disabled={isSaving} onClick={() => void save()} type="button">{isSaving ? "保存中" : "保存选品"}</Button></div></aside></div>;
}

function TextField({ label, multiline, onChange, value }: { label: string; multiline?: boolean; onChange: (value: string) => void; value: string }) { return <label className="grid gap-2"><span className="text-sm font-medium">{label}</span>{multiline ? <textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value} /> : <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value} />}</label>; }
function split(value: string) { return value.split(/[，,\n\s]+/).map((item) => item.trim()).filter(Boolean); }
