import { NextResponse } from "next/server";
import {
  deleteAiImageAsset,
  updateAiImageAsset,
} from "@/server/ai-image-assets";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImageAssetRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: ImageAssetRouteProps) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    note?: string | null;
  };
  const asset = await updateAiImageAsset(session.user.id, id, body);

  if (!asset) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ asset });
}

export async function DELETE(
  _request: Request,
  { params }: ImageAssetRouteProps,
) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const asset = await deleteAiImageAsset(session.user.id, id);

  if (!asset) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, id: asset.id });
}
