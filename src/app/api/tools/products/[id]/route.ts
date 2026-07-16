import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { deleteProduct, getProduct, updateProduct } from "@/server/product-catalog";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Props) { const user = await member(); if (!user) return unauthorized(); const product = await getProduct(user.id, (await params).id); return product ? NextResponse.json({ product }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); }
export async function PATCH(request: Request, { params }: Props) { const user = await member(); if (!user) return unauthorized(); try { const product = await updateProduct(user.id, (await params).id, await request.json()); return product ? NextResponse.json({ product }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "更新选品失败" }, { status: 400 }); } }
export async function DELETE(_request: Request, { params }: Props) { const user = await member(); if (!user) return unauthorized(); const product = await deleteProduct(user.id, (await params).id); return product ? NextResponse.json({ deleted: true, id: product.id }) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }); }
async function member() { const session = await getAppSession(); return session?.user?.id && canUseMemberTools(session.user.role) ? session.user : null; }
function unauthorized() { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
