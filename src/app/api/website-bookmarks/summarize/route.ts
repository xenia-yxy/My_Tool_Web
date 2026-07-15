import { NextResponse } from "next/server";
import {
  normalizeWebsiteSummaryUrls,
  summarizeWebsiteUrl,
} from "@/server/website-bookmarks";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      url?: string;
      urls?: string;
    };
    const urls = normalizeWebsiteSummaryUrls(body.urls || body.url || "");
    const results = [];

    for (const url of urls) {
      try {
        const result = await summarizeWebsiteUrl(session.user.id, url);
        results.push({ url, ...result });
      } catch (error) {
        results.push({
          url,
          title: url,
          summary: error instanceof Error ? error.message : "网页总结失败",
          error: true,
        });
      }
    }
    const firstResult = results[0];

    return NextResponse.json({
      ...firstResult,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "网页总结失败" },
      { status: 400 },
    );
  }
}
