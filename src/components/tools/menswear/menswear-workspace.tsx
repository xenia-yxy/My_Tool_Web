"use client";

import Link from "next/link";
import { ImagePlus, Images, Shirt, UserRound } from "lucide-react";

const actions = [
  { href: "/tools/menswear/generate", icon: ImagePlus, label: "严格保真生图", description: "锁定服装、模特与关键参考素材，稳定复现商品真实细节。" },
  { href: "/tools/menswear/scene-image", icon: ImagePlus, label: "场景图生成", description: "使用场景图完成人物换装、商品替换或纯背景视觉创作。" },
  { href: "/tools/menswear/style-reference", icon: ImagePlus, label: "风格参考生图", description: "上传多张主图与一张风格参考图，保留商品真实细节后生成。" },
  { href: "/tools/menswear/multi-outfit", icon: Shirt, label: "一衣多搭生图", description: "上传单个或多个主商品，生成上身模特或无模特平铺的多套搭配图。" },
  { href: "/tools/menswear/materials", icon: Images, label: "公开素材库", description: "分类管理服装、姿势、背景和脸部参考素材。" },
  { href: "/tools/menswear/models", icon: UserRound, label: "模特档案", description: "建立多模特身份和一致性控制。" },
];

export function MenswearWorkspace() {
  return (
    <div className="grid gap-5">
      <section className="border-b border-slate-200 pb-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Shirt className="h-4 w-4 text-blue-600" />男装生产工作台</div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">从公开素材、模特档案和严格商品锁定开始。生成结果统一沉淀到图片画廊。</p></section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{actions.map((action) => { const Icon = action.icon; return <Link className="grid min-h-36 gap-3 rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50" href={action.href} key={action.href}><Icon className="h-5 w-5 text-blue-600" /><div><h2 className="text-sm font-semibold text-slate-950">{action.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p></div></Link>; })}</section>
    </div>
  );
}
