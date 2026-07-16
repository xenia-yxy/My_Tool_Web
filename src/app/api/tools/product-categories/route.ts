import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { createProductCategory, listProductCategories } from "@/server/product-catalog";
export const dynamic = "force-dynamic";
export async function GET() { const user = await member(); return user ? NextResponse.json({ categories: await listProductCategories(user.id) }) : unauthorized(); }
export async function POST(request: Request) { const user = await member(); if (!user) return unauthorized(); try { return NextResponse.json({ category: await createProductCategory(user.id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "创建分类失败" }, { status: 400 }); } }
async function member() { const session = await getAppSession(); return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null; }
function unauthorized() { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
