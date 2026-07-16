import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { saveReferenceImageToRuntime } from "@/server/ai-image-tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const file = (await request.formData()).get("image");
    if (!(file instanceof File)) throw new Error("请先选择商品图片");
    if (!allowedImageTypes.has(file.type)) throw new Error("仅支持 PNG、JPG、WebP 图片");
    if (file.size > 8 * 1024 * 1024) throw new Error("商品图片不能超过 8MB");
    const imageUrl = await saveReferenceImageToRuntime(file);
    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "上传商品图片失败" }, { status: 400 });
  }
}
