import { NextResponse, type NextRequest } from "next/server";
import {
  normalizeHotspotQuery,
  queryHotspotSources,
} from "@/server/hotspot-radar";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const query = normalizeHotspotQuery({
      platform: request.nextUrl.searchParams.get("platform"),
      query: request.nextUrl.searchParams.get("query"),
      topic: request.nextUrl.searchParams.get("topic"),
    });
    const result = await queryHotspotSources(query);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "热点数据查询暂时不可用",
      },
      { status: 500 },
    );
  }
}
