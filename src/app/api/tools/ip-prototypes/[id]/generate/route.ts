import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import { normalizeImageBatchCount } from "@/server/ai-image-tools";
import { createAiImageAsset } from "@/server/ai-image-assets";
import { generateIpPrototype } from "@/server/ip-prototype";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpProjectGenerateRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxUploadBytes = 8 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: IpProjectGenerateRouteProps,
) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const draftImages = readOptionalImages(formData, "draftImage");
    const styleImages = readOptionalImages(formData, "styleImage");
    const batchCount = normalizeImageBatchCount(getFormText(formData, "batchCount"));
    const prompt = getFormText(formData, "prompt");
    const results = [];

    for (let index = 0; index < batchCount; index += 1) {
      const result = await generateIpPrototype({
        authorId: session.user.id,
        projectId: id,
        draftImages,
        styleImages,
        generationInput: {
          ipType: getFormText(formData, "ipType"),
          outputGoal: getFormText(formData, "outputGoal"),
          prompt:
            batchCount > 1
              ? `${prompt || ""}\n\n批量生成序号：${index + 1}/${batchCount}。请保持 IP 核心设定一致，但让构图、镜头、姿态或视觉细节有所区别。`
              : prompt,
          styleText: getFormText(formData, "styleText"),
          conceptStatement: getFormText(formData, "conceptStatement"),
          targetAudience: getFormText(formData, "targetAudience"),
          personality: getFormText(formData, "personality"),
          visualAnchors: getFormText(formData, "visualAnchors"),
          avoidDirections: getFormText(formData, "avoidDirections"),
          scenario: getFormText(formData, "scenario"),
          aspectRatio: getFormText(formData, "aspectRatio"),
          quality: getFormText(formData, "quality"),
        },
        finalPrompt: buildBatchFinalPrompt(
          getFormText(formData, "finalPrompt"),
          index,
          batchCount,
        ),
      });

      await createAiImageAsset(session.user.id, {
        mode: "ip-prototype",
        sourceTool: "ip-prototype",
        title: `${result.projectName} - IP 原型 ${index + 1}`,
        description: getFormText(formData, "outputGoal"),
        caption: getFormText(formData, "prompt"),
        tags: ["#IP原型", "#AI生图", `#${getFormText(formData, "ipType") || "person"}`],
        productKeywords: [result.projectName, getFormText(formData, "outputGoal") || "原型图"],
        prompt: result.prompt,
        imageUrl: result.imageUrl,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
      });

      results.push(result);
    }
    const firstResult = results[0];

    return NextResponse.json({ ...firstResult, results }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "IP 原型生成失败。" },
      { status: 400 },
    );
  }
}

function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function buildBatchFinalPrompt(
  finalPrompt: string | undefined,
  index: number,
  batchCount: number,
) {
  if (!finalPrompt?.trim()) return undefined;

  return batchCount > 1
    ? `${finalPrompt}\n\n批量生成序号：${index + 1}/${batchCount}。请保持 IP 核心设定一致，但让构图、镜头、姿态或视觉细节有所区别。`
    : finalPrompt;
}

function readOptionalImages(formData: FormData, key: string) {
  const images = formData
    .getAll(key)
    .filter((image): image is File => image instanceof File && image.size > 0)
    .slice(0, 8);

  images.forEach((image) => {
    if (!allowedImageTypes.has(image.type)) {
      throw new Error("仅支持 PNG、JPG、WebP 图片。");
    }

    if (image.size > maxUploadBytes) {
      throw new Error("单张图片不能超过 8MB。");
    }
  });

  return images;
}
