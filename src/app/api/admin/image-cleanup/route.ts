import { NextResponse } from "next/server";
import {
  cleanupImages,
  getImageCleanupPreview,
  normalizeImageCleanupTargets,
} from "@/server/image-cleanup";
import { canAccessAdmin } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  const url = new URL(request.url);
  const targets = normalizeImageCleanupTargets(
    url.searchParams.getAll("target"),
  );
  const preview = await getImageCleanupPreview(targets);

  return NextResponse.json(
    { summary: preview.summary, targets },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    confirm?: unknown;
    targets?: unknown;
  };

  if (body.confirm !== "DELETE_IMAGES") {
    return NextResponse.json(
      { error: "请输入确认口令 DELETE_IMAGES 后再清理图片" },
      { headers: { "Cache-Control": "no-store" }, status: 400 },
    );
  }

  const targets = normalizeImageCleanupTargets(body.targets);
  const result = await cleanupImages(targets);

  return NextResponse.json(
    { result, targets },
    { headers: { "Cache-Control": "no-store" } },
  );
}
