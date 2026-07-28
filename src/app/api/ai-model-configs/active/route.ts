import { NextResponse } from "next/server";
import { listActiveAiModelSelectionsForUser } from "@/server/ai-model-configs";
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

  const selections = await listActiveAiModelSelectionsForUser(session.user.id);

  return NextResponse.json(
    { selections },
    { headers: { "Cache-Control": "no-store" } },
  );
}
