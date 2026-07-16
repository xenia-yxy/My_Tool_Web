import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createProduct, listProducts } from "@/server/product-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await member(); if (!user) return unauthorized();
  const url = new URL(request.url);
  return NextResponse.json({ products: await listProducts(user.id, { categoryId: url.searchParams.get("categoryId"), query: url.searchParams.get("query") }) });
}

export async function POST(request: Request) {
  const user = await member(); if (!user) return unauthorized();
  try { return NextResponse.json({ product: await createProduct(user.id, await request.json()) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "创建选品失败" }, { status: 400 }); }
}

async function member() { const session = await getAppSession(); return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null; }
function unauthorized() { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
