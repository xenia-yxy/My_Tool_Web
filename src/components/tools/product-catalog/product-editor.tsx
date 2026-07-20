"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };
type ProductImage = { id?: string; imageUrl: string; isPrimary: boolean; position?: number };
type ProductAnalysis = {
  description: string;
  keywords: string[];
  name: string;
  riskNotes: string[];
  scenes: string[];
  sellPoints: string[];
  tags: string[];
  targetAudience: string[];
  visibleAttributes: string[];
};
type Product = {
  id: string;
  aiAnalysis: Record<string, unknown>;
  aiAnalyzedAt: string | null;
  categoryId: string | null;
  description: string | null;
  images: ProductImage[];
  keywords: string[];
  name: string;
  scenes: string[];
  sellPoints: string[];
  tags: string[];
};

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
  const [notes, setNotes] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [visibleAttributes, setVisibleAttributes] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [showDetails] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
      setName(product.name);
      setCategoryId(product.categoryId ?? "");
      setDescription(product.description ?? "");
      setTags(product.tags.join(" "));
      setSellPoints(product.sellPoints.join("\n"));
      setScenes(product.scenes.join(" "));
      setKeywords(product.keywords.join(" "));
      setImages(product.images);
      const savedAnalysis = toProductAnalysis(product.aiAnalysis);
      setAnalysis(product.aiAnalyzedAt ? savedAnalysis : null);
      setTargetAudience(savedAnalysis.targetAudience.join(" "));
      setVisibleAttributes(savedAnalysis.visibleAttributes.join(" "));
      setRiskNotes(savedAnalysis.riskNotes.join("\n"));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载选品失败");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const available = 12 - images.length;
    if (available <= 0) {
      setError("每个选品最多上传 12 张图片");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).slice(0, available).map(async (file) => {
        const body = new FormData();
        body.set("image", file);
        const response = await fetch("/api/tools/products/upload", { method: "POST", body });
        const payload = await response.json() as { imageUrl?: string; error?: string };
        if (!response.ok || !payload.imageUrl) throw new Error(payload.error || "上传商品图片失败");
        return payload.imageUrl;
      }));
      setImages((current) => [...current, ...uploaded.map((imageUrl, index) => ({
        imageUrl,
        isPrimary: current.length === 0 && index === 0,
      }))]);
      setAnalysis(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "上传商品图片失败");
    } finally {
      setIsUploading(false);
    }
  }

  async function analyzeProduct() {
    if (!images.length) {
      setError("请先上传商品图片");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const body = new FormData();
      for (const [index, image] of images.entries()) {
        const response = await fetch(image.imageUrl);
        if (!response.ok) throw new Error("有商品图片无法读取，请重新上传后再识别");
        const blob = await response.blob();
        const extension = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
        body.append("image", new File([blob], `product-${index + 1}.${extension}`, { type: blob.type || "image/png" }));
      }
      body.set("categoryHint", categories.find((category) => category.id === categoryId)?.name || "");
      body.set("notes", notes.trim());
      const response = await fetch("/api/tools/products/analyze", { method: "POST", body });
      const payload = await response.json() as { analysis?: ProductAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error || "AI 识别商品失败");

      applyAnalysis(payload.analysis);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "AI 识别商品失败");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function applyAnalysis(next: ProductAnalysis) {
    setAnalysis(next);
    setName(next.name);
    setDescription(next.description);
    setTags(next.tags.join(" "));
    setSellPoints(next.sellPoints.join("\n"));
    setScenes(next.scenes.join(" "));
    setKeywords(next.keywords.join(" "));
    setTargetAudience(next.targetAudience.join(" "));
    setVisibleAttributes(next.visibleAttributes.join(" "));
    setRiskNotes(next.riskNotes.join("\n"));
  }

  async function save() {
    if (!name.trim()) {
      setError("请填写商品名称");
      return;
    }
    if (!images.length) {
      setError("请至少上传一张商品图片");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const primaryImageUrl = images.find((image) => image.isPrimary)?.imageUrl ?? images[0]!.imageUrl;
      const response = await fetch(productId ? `/api/tools/products/${productId}` : "/api/tools/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId: categoryId || null,
          description,
          imageUrls: images.map((image) => image.imageUrl),
          primaryImageUrl,
          tags: split(tags),
          sellPoints: split(sellPoints),
          scenes: split(scenes),
          keywords: split(keywords),
          aiAnalysis: {
            description,
            keywords: split(keywords),
            name: name.trim(),
            riskNotes: split(riskNotes),
            scenes: split(scenes),
            sellPoints: split(sellPoints),
            tags: split(tags),
            targetAudience: split(targetAudience),
            visibleAttributes: split(visibleAttributes),
          },
          aiAnalyzed: Boolean(analysis),
        }),
      });
      const payload = await response.json() as { product?: { id: string }; error?: string };
      if (!response.ok || !payload.product) throw new Error(payload.error || "保存选品失败");
      router.replace(`/tools/products/${payload.product.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "保存选品失败");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="grid min-h-64 place-items-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="grid gap-4">
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm font-semibold text-slate-950">1. 上传商品图片</p><p className="mt-1 text-sm text-slate-500">上传 1-12 张主图、细节图或背面图。可直接手动建档，也可用 AI 辅助回填。</p></div>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white"><Upload className="h-4 w-4" />{isUploading ? "上传中" : "上传图片"}<input accept="image/png,image/jpeg,image/webp" className="hidden" disabled={isUploading} multiple onChange={(event) => { void upload(event.target.files); event.target.value = ""; }} type="file" /></label>
          </div>
          {images.length ? <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">{images.map((image) => <div className="relative overflow-hidden rounded-md border border-slate-200" key={image.imageUrl}><div className="relative aspect-square bg-slate-50"><Image alt="商品图片" className="object-cover" fill sizes="200px" src={image.imageUrl} unoptimized /></div><div className="flex items-center justify-between p-2"><button className={`rounded p-1 ${image.isPrimary ? "text-amber-500" : "text-slate-400"}`} onClick={() => setImages((current) => current.map((item) => ({ ...item, isPrimary: item.imageUrl === image.imageUrl })))} title="设为主图" type="button"><Star className="h-4 w-4" fill={image.isPrimary ? "currentColor" : "none"} /></button><button className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => { setImages((current) => current.filter((item) => item.imageUrl !== image.imageUrl)); setAnalysis(null); }} title="删除图片" type="button"><Trash2 className="h-4 w-4" /></button></div></div>)}</div> : <div className="grid min-h-36 place-items-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">请先上传商品图片</div>}
        </section>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-3 md:grid-cols-2"><div><p className="text-sm font-semibold text-slate-950">AI 识别（可选）</p><p className="mt-1 text-sm text-slate-500">不使用 AI 也可以直接填写并保存；识别结果会回填到下方字段。</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">主分类（可选）</span><select className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">让 AI 根据图片判断</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="grid gap-2"><span className="text-sm font-medium">补充说明（可选）</span><input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setNotes(event.target.value)} placeholder="例如：主推通勤，重点识别版型" value={notes} /></label></div></div>
          <Button className="h-10 gap-2" disabled={isAnalyzing || !images.length} onClick={() => void analyzeProduct()} type="button">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}AI 识别商品</Button>
        </section>

        {analysis ? <section className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4"><div><p className="text-sm font-semibold text-slate-900">2. AI 识别结果</p><p className="mt-1 text-sm text-slate-600">已回填下方商品信息。请核对后再保存，品牌、材质成分、规格和价格等不可见信息不会被 AI 当作事实写入。</p></div><AnalysisList label="适用人群" onChange={(value) => setAnalysis((current) => current ? { ...current, targetAudience: split(value) } : current)} value={analysis.targetAudience.join(" ")} /><AnalysisList label="可见属性" onChange={(value) => setAnalysis((current) => current ? { ...current, visibleAttributes: split(value) } : current)} value={analysis.visibleAttributes.join(" ")} /><AnalysisList label="人工核对项" onChange={(value) => setAnalysis((current) => current ? { ...current, riskNotes: split(value) } : current)} value={analysis.riskNotes.join("\n")} multiline /></section> : null}

        {showDetails ? <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-sm font-semibold text-slate-950">2. 商品信息（可手动填写）</p><p className="mt-1 text-sm text-slate-500">所有选项默认展开。AI 识别只会辅助回填，内容仍可随时修改后保存。</p></div><TextField label="商品名称" onChange={setName} value={name} /><TextField label="搜索关键词" onChange={setKeywords} value={keywords} /><TextField label="商品描述" multiline onChange={setDescription} value={description} /><TextField label="卖点" multiline onChange={setSellPoints} value={sellPoints} /><TextField label="标签" onChange={setTags} value={tags} /><TextField label="适用场景" onChange={setScenes} value={scenes} /><TextField label="目标人群" onChange={setTargetAudience} value={targetAudience} /><TextField label="可见属性" onChange={setVisibleAttributes} value={visibleAttributes} /><TextField label="人工核对项" multiline onChange={setRiskNotes} value={riskNotes} /></section> : null}
      </section>

      <aside className="grid content-start gap-3"><div className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold">保存选品</h2><p className="mt-2 text-sm leading-6 text-slate-500">保存后可从男装、女装或零食百货工作台主动引用商品图片。商品图片不会自动进入素材中心。</p>{error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}<Button className="mt-4 w-full" disabled={isSaving || !images.length} onClick={() => void save()} type="button">{isSaving ? "保存中" : "保存选品"}</Button></div></aside>
    </div>
  );
}

function TextField({ label, multiline, onChange, value }: { label: string; multiline?: boolean; onChange: (value: string) => void; value: string }) {
  return <label className="grid gap-2"><span className="text-sm font-medium">{label}</span>{multiline ? <textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm" onChange={(event) => onChange(event.target.value)} value={value} /> : <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value} />}</label>;
}

function AnalysisList({ label, multiline, onChange, value }: { label: string; multiline?: boolean; onChange: (value: string) => void; value: string }) {
  return <TextField label={label} multiline={multiline} onChange={onChange} value={value} />;
}

function toProductAnalysis(value: Record<string, unknown>): ProductAnalysis {
  return {
    description: text(value.description), keywords: list(value.keywords), name: text(value.name), riskNotes: list(value.riskNotes), scenes: list(value.scenes), sellPoints: list(value.sellPoints), tags: list(value.tags), targetAudience: list(value.targetAudience), visibleAttributes: list(value.visibleAttributes),
  };
}

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function list(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function split(value: string) { return value.split(/[，,\n\s]+/).map((item) => item.trim()).filter(Boolean); }
