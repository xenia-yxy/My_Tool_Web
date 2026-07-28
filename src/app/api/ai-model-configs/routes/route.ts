import { NextResponse } from "next/server";
import {
  listActiveAiModelSelectionsForUser,
  listAiModelRoutesForUser,
  updateAiModelRouteForUser,
} from "@/server/ai-model-configs";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  const [routes, selections] = await Promise.all([
    listAiModelRoutesForUser(session.user.id),
    listActiveAiModelSelectionsForUser(session.user.id),
  ]);

  return NextResponse.json(
    { routes, selections },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { headers: { "Cache-Control": "no-store" }, status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const route = await updateAiModelRouteForUser(session.user.id, body);
    const selections = await listActiveAiModelSelectionsForUser(session.user.id);

    return NextResponse.json(
      { route, selections },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "模型路由保存失败" },
      { headers: { "Cache-Control": "no-store" }, status: 400 },
    );
  }
}
