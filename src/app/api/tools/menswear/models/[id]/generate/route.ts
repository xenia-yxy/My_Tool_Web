import { NextResponse } from "next/server";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { readAliyunOssObjectByUrl } from "@/server/oss-storage";
import {
  editImageWithReferences,
  generateImageFromText,
  saveGeneratedImageToRuntime,
} from "@/server/ai-image-tools";
import {
  attachMenswearModelProfileImage,
  createMenswearMaterial,
  getMenswearModelProfile,
} from "@/server/menswear-studio";

type RouteProps = { params: Promise<{ id: string }> };
type GenerateBody = { output?: unknown };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: RouteProps) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as GenerateBody;
    const output = body.output === "face" ? "face" : "body";
    const profile = await getMenswearModelProfile(session.user.id, id);
    if (!profile) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const prompt = buildModelImagePrompt(profile.name, profile.profile, output);
    const referenceMaterials = profile.images.map((image) => image.material);
    const generated = referenceMaterials.length > 0
      ? await editImageWithReferences({
          images: await Promise.all(referenceMaterials.map((material) => materialToFile(material, request.url))),
          prompt,
          quality: "medium",
          size: output === "face" ? "1024x1024" : "1024x1536",
          userId: session.user.id,
        })
      : await generateImageFromText({
          prompt,
          quality: "medium",
          size: output === "face" ? "1024x1024" : "1024x1536",
          userId: session.user.id,
        });
    const saved = await saveGeneratedImageToRuntime(generated);
    const material = await createMenswearMaterial(session.user.id, {
      category: output === "face" ? "model_face" : "model_body",
      imageUrl: saved.imageUrl,
      name: `${profile.name}${output === "face" ? " 脸部参考图" : " 全身模特图"}`,
      sourceType: "GENERATED",
      tags: ["模特档案", output === "face" ? "脸部" : "全身"],
    });
    const updatedProfile = await attachMenswearModelProfileImage({
      authorId: session.user.id,
      materialId: material.id,
      profileId: profile.id,
      role: output === "face" ? "face" : "body",
    });

    return NextResponse.json({ material, profile: updatedProfile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成模特图失败" },
      { status: 400 },
    );
  }
}

function buildModelImagePrompt(name: string, profile: unknown, output: "body" | "face") {
  const parameters = readModelParameters(profile);
  const characterDescription = [
    parameters.ageFeeling,
    parameters.bodyType,
    parameters.hairStyle,
    parameters.skinTone,
    parameters.height ? `身高约 ${parameters.height}` : "",
  ].filter(Boolean).join("，");

  return output === "face"
    ? `为模特档案「${name}」生成一张干净的正面脸部参考图。人物参数：${characterDescription || "自然青年男模特"}。保持已有参考人物的五官、发型、年龄感和肤色一致；自然表情，纯净浅色背景，无遮挡，不要文字、水印或其他人物。`
    : `为模特档案「${name}」生成一张全身男模特参考图。人物参数：${characterDescription || "自然青年男模特"}。保持已有参考人物的脸部、发型和身材比例一致；自然站姿，简洁纯色服装和浅色背景，完整可见全身，不要文字、水印或其他人物。`;
}

function readModelParameters(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    ageFeeling: typeof source.ageFeeling === "string" ? source.ageFeeling.trim() : "",
    bodyType: typeof source.bodyType === "string" ? source.bodyType.trim() : "",
    hairStyle: typeof source.hairStyle === "string" ? source.hairStyle.trim() : "",
    height: typeof source.height === "string" ? source.height.trim() : "",
    skinTone: typeof source.skinTone === "string" ? source.skinTone.trim() : "",
  };
}

async function materialToFile(
  material: { id: string; imageUrl: string },
  requestUrl: string,
) {
  const response = await readAliyunOssObjectByUrl(material.imageUrl).catch(() => null)
    ?? await fetch(new URL(material.imageUrl, requestUrl));
  if (!response.ok) throw new Error("无法读取模特参考图片");

  const contentType = response.headers.get("content-type") || "image/png";
  const extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  return new File([await response.blob()], `${material.id}.${extension}`, { type: contentType });
}
