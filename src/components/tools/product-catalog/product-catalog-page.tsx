"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProductCategory = { id: string; name: string; sortOrder: number };
type ProductImage = { id: string; imageUrl: string; isPrimary: boolean; position: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  aiAnalyzedAt: string | null;
  category: ProductCategory | null;
  images: ProductImage[];
};

export function ProductCatalogPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.set("categoryId", categoryId);
      if (query.trim()) params.set("query", query.trim());
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/tools/products?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/tools/product-categories", { cache: "no-store" }),
      ]);
      const productPayload = await productsResponse.json() as { error?: string; products?: Product[] };
      const categoryPayload = await categoriesResponse.json() as { error?: string; categories?: ProductCategory[] };
      if (!productsResponse.ok) throw new Error(productPayload.error || "加载选品失败");
      if (!categoriesResponse.ok) throw new Error(categoryPayload.error || "加载选品分类失败");
      setProducts(productPayload.products ?? []);
      setCategories(categoryPayload.categories ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "加载选品中心失败");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  async function createProductCategory() {
    const name = categoryName.trim();
    if (!name) {
      setError("请填写分类名称");
      return;
    }

    setIsSavingCategory(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/product-categories", {
        body: JSON.stringify({ name, sortOrder: categories.length }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json() as { category?: ProductCategory; error?: string };
      if (!response.ok || !payload.category) throw new Error(payload.error || "创建选品分类失败");
      setCategories((current) => [...current, payload.category!].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)));
      setCategoryId(payload.category.id);
      setCategoryName("");
      setCategoryDialogOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建选品分类失败");
    } finally {
      setIsSavingCategory(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[minmax(220px,1fr)_220px_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">搜索选品</span>
          <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="名称、标签或关键词" value={query} /></div>
        </label>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">分类筛选</span>
          <div className="flex gap-2"><select className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm" onChange={(event) => setCategoryId(event.target.value)} value={categoryId}><option value="">全部分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Button aria-label="新增分类" className="h-10 w-10 shrink-0 p-0" onClick={() => { setError(null); setCategoryDialogOpen(true); }} title="新增分类" type="button" variant="secondary"><Plus aria-hidden="true" className="h-4 w-4" /></Button></div>
        </div>
        <div className="flex gap-2"><Button aria-label="刷新选品列表" className="h-10 w-10 p-0" onClick={() => void loadCatalog()} title="刷新选品列表" type="button" variant="secondary"><RefreshCw aria-hidden="true" className="h-4 w-4" /></Button><Button asChild className="h-10 gap-2"><Link href="/tools/products/new"><Plus aria-hidden="true" className="h-4 w-4" />新建选品</Link></Button></div>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {isLoading ? <div className="grid min-h-60 place-items-center text-sm text-slate-500"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /></div> : null}
      {!isLoading && products.length === 0 ? <section className="grid min-h-64 place-items-center border border-dashed border-slate-300 px-6 text-center"><div><p className="text-sm font-semibold text-slate-800">暂无选品</p><p className="mt-2 text-sm leading-6 text-slate-500">新建商品档案并上传一张或多张商品图后，会在这里显示。</p><Button asChild className="mt-4 gap-2"><Link href="/tools/products/new"><Plus aria-hidden="true" className="h-4 w-4" />新建选品</Link></Button></div></section> : null}
      {!isLoading && products.length ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</section> : null}
      {isCategoryDialogOpen ? <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog"><form className="grid w-full max-w-md gap-4 rounded-lg bg-white p-5 shadow-2xl" onSubmit={(event) => { event.preventDefault(); void createProductCategory(); }}><div><h2 className="text-lg font-semibold text-slate-950">新增分类</h2><p className="mt-1 text-sm text-slate-500">创建选品分类</p></div><label className="grid gap-2 text-sm font-medium text-slate-700">分类名称<input autoFocus className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setCategoryName(event.target.value)} placeholder="例如：女装、零食、数码" value={categoryName} /></label><div className="flex justify-end gap-2"><Button disabled={isSavingCategory} onClick={() => setCategoryDialogOpen(false)} type="button" variant="secondary">取消</Button><Button disabled={isSavingCategory || !categoryName.trim()} type="submit">{isSavingCategory ? "创建中" : "创建分类"}</Button></div></form></div> : null}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
  return <article className="overflow-hidden rounded-lg border border-slate-200 bg-white"><Link className="group block" href={`/tools/products/${product.id}`}><div className="relative aspect-square bg-slate-50">{primaryImage ? <Image alt={product.name} className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" fill sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw" src={primaryImage.imageUrl} unoptimized /> : <span className="grid h-full place-items-center text-sm text-slate-400">暂无图片</span>}</div><div className="grid gap-2 p-3"><div className="flex items-start justify-between gap-2"><h2 className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</h2><span className="shrink-0 text-xs text-slate-500">{product.images.length} 张</span></div><p className="text-xs text-slate-500">{product.category?.name ?? "未分类"} · 图片数量 {product.images.length}</p><p className="text-xs text-slate-500">AI 分析状态：{product.aiAnalyzedAt ? "已分析" : "未分析"}</p>{product.description ? <p className="line-clamp-2 text-xs leading-5 text-slate-600">{product.description}</p> : null}<div className="flex flex-wrap gap-1">{product.tags.slice(0, 3).map((tag) => <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600" key={tag}>{tag}</span>)}</div></div></Link></article>;
}
