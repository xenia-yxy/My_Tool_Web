import { NextResponse } from "next/server";
import {
  buildMenswearGenerationProvenance,
  buildSceneImagePrompt,
  buildStrictMenswearPrompt,
  normalizeMenswearGenerationInput,
  type MenswearReferencePolicy,
  type MenswearReferenceRole,
} from "@/lib/menswear-studio";
import { buildMenswearCopyBundle } from "@/lib/commerce-image-workflow";
import { prisma } from "@/lib/prisma";
import {
  createAiImageAsset,
  createAiImageJob,
  markAiImageJobCompleted,
  markAiImageJobFailed,
  markAiImageJobRunning,
} from "@/server/ai-image-assets";
import {
  editImageWithReferences,
  normalizeImageBatchCount,
  normalizeImageQuality,
  normalizeImageSize,
  saveGeneratedImageToRuntime,
} from "@/server/ai-image-tools";
import { getAppSession } from "@/server/auth";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getMenswearProject } from "@/server/menswear-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateRouteProps = { params: Promise<{ id: string }> };

type GenerateBody = {
  aspectRatio?: unknown;
  batchCount?: unknown;
  cameraDistance?: unknown;
  finalPrompt?: unknown;
  quality?: unknown;
  sceneMode?: unknown;
  workflow?: unknown;
};

export async function POST(
  request: Request,
  { params }: GenerateRouteProps,
) {
  const session = await getAppSession();
  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as GenerateBody;
    const project = await getMenswearProject(session.user.id, id);

    if (!project) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const settings = isRecord(project.settings) ? project.settings : {};
    const isSceneImage = body.workflow === "scene-image" || settings.workflow === "scene-image";
    const generation = normalizeMenswearGenerationInput({
      aspectRatio: body.aspectRatio ?? settings.aspectRatio,
      batchCount: body.batchCount ?? settings.batchCount,
      cameraDistance: body.cameraDistance ?? settings.cameraDistance,
      customInstructions: settings.customInstructions,
      description: project.description || project.name,
      modelProfileId: project.modelProfileId,
      sceneMode: body.sceneMode ?? settings.sceneMode,
      references: project.references.map((reference) => ({
        allowedChanges: reference.allowedChanges,
        fidelity: reference.fidelity,
        materialId: reference.materialId,
        policy: reference.policy,
        role: reference.role,
      })),
    });
    const promptInput = {
      aspectRatio: generation.aspectRatio,
      cameraDistance: generation.cameraDistance,
      customInstructions: generation.customInstructions,
      description: generation.description,
      mainProductCategory: stringSetting(settings.mainProductCategory),
      modelName: project.modelProfile?.name,
      references: project.references.map((reference) => ({
        fidelity: reference.fidelity,
        materialName: reference.material.name,
        policy: reference.policy as MenswearReferencePolicy,
        role: reference.role as MenswearReferenceRole,
      })),
      sceneAspectRatio: stringSetting(settings.sceneAspectRatio),
      sceneInstruction: stringSetting(settings.sceneInstruction),
      sceneMode: generation.sceneMode,
      stylePreset: stringSetting(settings.customStyle) || stringSetting(settings.stylePreset),
      systemControls: resolveSystemControls(settings),
    };
    const systemPrompt = isSceneImage
      ? buildSceneImagePrompt(promptInput)
      : buildStrictMenswearPrompt(promptInput);
    const finalPrompt = typeof body.finalPrompt === "string" && body.finalPrompt.trim()
      ? body.finalPrompt.trim()
      : systemPrompt;
    const imageReferences = uniqueMaterials(project);
    const files = await Promise.all(
      imageReferences.map((material) => materialToFile(material, request.url)),
    );
    const batchCount = normalizeImageBatchCount(generation.batchCount);
    const quality = normalizeImageQuality(
      typeof body.quality === "string" ? body.quality : "low",
    );
    const sourceTool = isSceneImage ? "menswear-scene-image" : "menswear-studio";
    const job = await createAiImageJob(session.user.id, {
      batchCount,
      mode: "menswear",
      sourceTool,
      title: project.name,
      prompt: finalPrompt,
    });
    await markAiImageJobRunning(session.user.id, job.id);

    const provenance = buildMenswearGenerationProvenance({
      modelProfileId: project.modelProfileId,
      projectId: project.id,
      references: project.references.map((reference) => ({
        fidelity: reference.fidelity,
        materialId: reference.materialId,
        policy: reference.policy as MenswearReferencePolicy,
        role: reference.role as MenswearReferenceRole,
      })),
    });
    const referenceNames = project.references.map((reference) => reference.material.name);
    const results = [];

    try {
      for (let index = 0; index < batchCount; index += 1) {
        const generated = await editImageWithReferences({
          images: files,
          prompt:
            batchCount > 1
              ? `${finalPrompt}\n\n批量序号：${index + 1}/${batchCount}。${isSceneImage ? "保持场景类型和用户指定的保留关系，调整构图或细节时不要偏离参考图。" : "仅允许在非锁定元素上调整构图、光线或自然姿态。"}`
              : finalPrompt,
          quality,
          size: normalizeImageSize(generation.aspectRatio),
          userId: session.user.id,
        });
        const saved = await saveGeneratedImageToRuntime(generated);
        const copyBundle = buildMenswearCopyBundle({
          description: generation.description,
          referenceNames,
          batchCount,
          index,
        });
        const asset = await createAiImageAsset(session.user.id, {
          caption: copyBundle.caption,
          description: JSON.stringify(provenance),
          downloadUrl: saved.downloadUrl,
          fileName: saved.fileName,
          imageUrl: saved.imageUrl,
          jobId: job.id,
          mimeType: saved.mimeType,
          mode: "menswear",
          productKeywords: copyBundle.productKeywords,
          prompt: finalPrompt,
          referenceImages: imageReferences.map((material) => material.imageUrl),
          sourceTool,
          status: "SUCCEEDED",
          tags: copyBundle.tags,
          title: copyBundle.title,
        });
        results.push({
          ...saved,
          asset,
          prompt: finalPrompt,
          title: copyBundle.title,
          caption: copyBundle.caption,
          tags: copyBundle.tags,
          productKeywords: copyBundle.productKeywords,
        });
      }

      await markAiImageJobCompleted(session.user.id, job.id, {
        completedCount: results.length,
      });
      await prisma.menswearPromptVersion.create({
        data: {
          finalPrompt,
          jobId: job.id,
          projectId: project.id,
          systemPrompt,
          userPrompt: finalPrompt === systemPrompt ? null : finalPrompt,
        },
      });
      await prisma.menswearProject.update({
        where: { id: project.id },
        data: { status: "READY" },
      });
    } catch (error) {
      const errorMessage = toPublicErrorMessage(error);
      await markAiImageJobFailed(session.user.id, job.id, errorMessage);
      throw error;
    }

    return NextResponse.json({ job, results, systemPrompt });
  } catch (error) {
    return NextResponse.json(
      { error: toPublicErrorMessage(error) },
      { status: 400 },
    );
  }
}

function uniqueMaterials(project: NonNullable<Awaited<ReturnType<typeof getMenswearProject>>>) {
  const materials = [...project.references.map((reference) => reference.material)];
  project.modelProfile?.images.forEach((image) => materials.push(image.material));

  return Array.from(new Map(materials.map((material) => [material.id, material])).values());
}

async function materialToFile(
  material: { id: string; imageUrl: string; name: string },
  requestUrl: string,
) {
  const response = await fetch(new URL(material.imageUrl, requestUrl));
  if (!response.ok) {
    throw new Error(`无法读取参考素材：${material.name}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  return new File([await response.blob()], `${material.id}.${extension}`, {
    type: contentType,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringSetting(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveSystemControls(settings: Record<string, unknown>) {
  if (!isRecord(settings.systemControls)) return [];
  return Object.values(settings.systemControls)
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());
}

function toPublicErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "男装图片生成失败";
}
