"use client";

import Link from "next/link";
import { ImagePlus, Images, Shirt, UserRound } from "lucide-react";

const actions = [
  { href: "/tools/womenswear/generate", icon: ImagePlus, label: "女装严格保真生图", description: "锁定裙装、上衣、下装和配饰细节，稳定生成真实女装上身图。" },
  { href: "/tools/womenswear/scene-image", icon: ImagePlus, label: "女装场景图生成", description: "保留人物、姿势或场景参考，只替换锁定的女装商品。" },
  { href: "/tools/womenswear/style-reference", icon: ImagePlus, label: "女装风格参考生图", description: "锁定主商品，参考女装氛围图的构图、光线和画面风格。" },
  { href: "/tools/womenswear/single-outfit", icon: Shirt, label: "女装单品穿搭生图", description: "上传单品和可选构图参考，一张图生成一套真实女装搭配。" },
  { href: "/tools/womenswear/multi-outfit", icon: Shirt, label: "女装一衣多搭合集", description: "为同一女装主商品生成多套可穿的季节搭配合集。" },
  { href: "/tools/womenswear/flatlay-outfit-split", icon: Shirt, label: "女装平铺多搭拆分生图", description: "识别平铺多搭图中的每套组合，逐套生成单张女装人物穿搭图。" },
  { href: "/tools/menswear/materials", icon: Images, label: "公开素材库", description: "选择服装、脸部、姿势、背景、构图和光线参考素材。" },
  { href: "/tools/menswear/models", icon: UserRound, label: "模特档案", description: "使用或创建女模特脸部、身材和一致性参考。" },
];

export function WomenswearWorkspace() {
  return (
    <div className="grid gap-5">
      <section className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Shirt className="h-4 w-4 text-rose-600" />女装生产工作台</div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">从商品锁定、女模特脸部和参考构图开始，完成真实、可穿且适合女装运营的整套视觉生产流程。</p>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return <Link className="grid min-h-36 gap-3 rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 hover:bg-rose-50" href={action.href} key={action.href}><Icon className="h-5 w-5 text-rose-600" /><div><h2 className="text-sm font-semibold text-slate-950">{action.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p></div></Link>;
        })}
      </section>
    </div>
  );
}
