"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkbenchSessionStatus } from "@/lib/workbench-sessions";

export type WorkbenchSessionState = {
  id: string;
  toolId: string;
  title: string;
  status: WorkbenchSessionStatus;
  prompt: string;
  inputSnapshot: Record<string, unknown>;
  outputSnapshot: Record<string, unknown>;
  imageAssetIds: string[];
  externalJobId: string | null;
  errorMessage?: string | null;
  updatedAt?: string;
};

export type WorkbenchSessionDraft = Omit<WorkbenchSessionState, "id" | "toolId" | "updatedAt">;
export type WorkbenchSessionPatch = Partial<Omit<WorkbenchSessionDraft, "toolId">>;

export function getSessionCacheKey(toolId: string) {
  return `workbench-session:${toolId}`;
}

export function mergeRestoredSession<T extends Pick<WorkbenchSessionState, "id" | "toolId" | "status" | "updatedAt">>(
  serverSession: T | null,
  cachedSession: T | null,
) {
  if (serverSession) {
    return serverSession;
  }

  if (cachedSession?.status === "RUNNING") {
    return null;
  }

  return cachedSession;
}

export function useWorkbenchSession(toolId: string) {
  const [session, setSession] = useState<WorkbenchSessionState | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestSession = useRef<WorkbenchSessionState | null>(null);

  useEffect(() => {
    latestSession.current = session;
  }, [session]);

  const writeCache = useCallback((value: WorkbenchSessionState) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getSessionCacheKey(toolId), JSON.stringify(value));
    }
  }, [toolId]);

  const restore = useCallback(async () => {
    setIsRestoring(true);
    setError(null);

    const cachedSession = readCachedSession(toolId);

    try {
      const response = await fetch(`/api/tools/sessions?toolId=${encodeURIComponent(toolId)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("恢复工作记录失败");
      }

      const payload = (await response.json()) as { sessions?: WorkbenchSessionState[] };
      const restored = mergeRestoredSession(payload.sessions?.[0] ?? null, cachedSession);
      setSession(restored);

      if (restored) {
        writeCache(restored);
      }
    } catch (caughtError) {
      setSession(cachedSession);
      setError(caughtError instanceof Error ? caughtError.message : "恢复工作记录失败");
    } finally {
      setIsRestoring(false);
    }
  }, [toolId, writeCache]);

  const create = useCallback(async (draft: WorkbenchSessionDraft) => {
    const response = await fetch("/api/tools/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...draft, toolId }),
    });
    const payload = (await response.json()) as { error?: string; session?: WorkbenchSessionState };

    if (!response.ok || !payload.session) {
      throw new Error(payload.error || "保存工作记录失败");
    }

    setSession(payload.session);
    writeCache(payload.session);
    return payload.session;
  }, [toolId, writeCache]);

  const persist = useCallback(async (patch: WorkbenchSessionPatch) => {
    const current = latestSession.current;

    if (!current) {
      return null;
    }

    const response = await fetch(`/api/tools/sessions/${current.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = (await response.json()) as { error?: string; session?: WorkbenchSessionState };

    if (!response.ok || !payload.session) {
      throw new Error(payload.error || "更新工作记录失败");
    }

    setSession(payload.session);
    writeCache(payload.session);
    return payload.session;
  }, [writeCache]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void restore();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [restore]);

  useEffect(() => {
    const handlePageHide = () => {
      const current = latestSession.current;
      if (current) {
        writeCache(current);
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [writeCache]);

  return { create, error, isRestoring, persist, restore, session };
}

function readCachedSession(toolId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(getSessionCacheKey(toolId));
    if (!value) return null;
    const parsed = JSON.parse(value) as WorkbenchSessionState;
    return parsed.toolId === toolId && parsed.id ? parsed : null;
  } catch {
    return null;
  }
}
