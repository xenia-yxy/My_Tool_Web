import { NextResponse } from "next/server";
import { canUseMemberTools } from "@/server/auth-permissions";
import { getAppSession } from "@/server/auth";
import {
  createAgentReply,
  normalizeAgentChatInput,
  searchWebForAgent,
} from "@/server/agent-chat";

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    return NextResponse.json({ error: "未登录。" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const input = normalizeAgentChatInput(body);
    const search = input.useSearch
      ? await searchWebForAgent(input.message)
      : { results: [] };
    const reply = await createAgentReply({
      userId: session.user.id,
      message: input.message,
      history: input.history,
      searchResults: search.results,
      searchWarning: "warning" in search ? search.warning : undefined,
    });

    return NextResponse.json({
      reply,
      sources: search.results,
      warning: "warning" in search ? search.warning : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent 请求失败。" },
      { status: 400 },
    );
  }
}
