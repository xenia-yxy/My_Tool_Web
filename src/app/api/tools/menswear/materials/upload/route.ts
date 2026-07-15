import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { saveReferenceImageToRuntime } from "@/server/ai-image-tools";
import { createMenswearMaterial } from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxUploadBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      throw new Error("请先选择素材图片");
    }
    if (!allowedImageTypes.has(file.type)) {
      throw new Error("仅支持 PNG、JPG、WebP 图片");
    }
    if (file.size > maxUploadBytes) {
      throw new Error("素材图片不能超过 8MB");
    }

    const imageUrl = await saveReferenceImageToRuntime(file);
    const material = await createMenswearMaterial(session.user.id, {
      category: formText(formData, "category"),
      imageUrl,
      name: formText(formData, "name") || file.name.replace(/\.[^.]+$/, ""),
      promptNotes: formText(formData, "promptNotes"),
      sourceType: "UPLOAD",
      sourceUrl: formText(formData, "sourceUrl"),
      tags: formText(formData, "tags")
        .split(/[，,\s\n]+/)
        .filter(Boolean),
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传素材失败" },
      { status: 400 },
    );
  }
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
