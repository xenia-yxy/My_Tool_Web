import { NextResponse } from "next/server";
import {
  createUserAiModelConfig,
  listUserAiModelConfigs,
} from "@/server/ai-model-configs";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const configs = await listUserAiModelConfigs(session.user.id);

  return NextResponse.json(
    { configs },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const config = await createUserAiModelConfig(session.user.id, body);

    return NextResponse.json(
      { config },
      { headers: { "Cache-Control": "no-store" }, status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "模型配置保存失败" },
      { headers: { "Cache-Control": "no-store" }, status: 400 },
    );
  }
}
