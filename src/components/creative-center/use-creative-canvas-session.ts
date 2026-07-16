"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CanvasPosition = { x: number; y: number };
export type CanvasViewport = CanvasPosition & { zoom: number };
export type CanvasNodeKind = "ASSET" | "SKILL" | "TEXT";
export type CanvasNode = {
  clientId: string;
  kind: CanvasNodeKind;
  position: CanvasPosition;
  snapshot: Record<string, unknown>;
  skillVersionId?: string;
};
export type CanvasEdge = { sourceClientId: string; targetClientId: string; role: string };
export type CanvasState = { title: string; viewport: CanvasViewport; nodes: CanvasNode[]; edges: CanvasEdge[] };

export type CanvasAction =
  | { type: "replace"; title?: string; viewport?: CanvasViewport; nodes: CanvasNode[]; edges: CanvasEdge[] }
  | { type: "add"; node: CanvasNode }
  | { type: "move"; clientId: string; position: CanvasPosition }
  | { type: "connect"; sourceClientId: string; targetClientId: string; role: string }
  | { type: "remove"; clientId: string }
  | { type: "viewport"; viewport: CanvasViewport }
  | { type: "title"; title: string }
  | { type: "snapshot"; clientId: string; snapshot: Record<string, unknown> };

export function createCanvasState(): CanvasState {
  return { title: "未命名创作", viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] };
}

export function reduceCanvasState(state: CanvasState, action: CanvasAction): CanvasState {
  if (action.type === "replace") return { title: action.title ?? state.title, viewport: action.viewport ?? state.viewport, nodes: action.nodes, edges: action.edges };
  if (action.type === "add") return { ...state, nodes: [...state.nodes, action.node] };
  if (action.type === "move") return { ...state, nodes: state.nodes.map((node) => node.clientId === action.clientId ? { ...node, position: action.position } : node) };
  if (action.type === "connect") {
    const exists = state.edges.some((edge) => edge.sourceClientId === action.sourceClientId && edge.targetClientId === action.targetClientId && edge.role === action.role);
    return exists ? state : { ...state, edges: [...state.edges, { sourceClientId: action.sourceClientId, targetClientId: action.targetClientId, role: action.role }] };
  }
  if (action.type === "remove") return { ...state, nodes: state.nodes.filter((node) => node.clientId !== action.clientId), edges: state.edges.filter((edge) => edge.sourceClientId !== action.clientId && edge.targetClientId !== action.clientId) };
  if (action.type === "viewport") return { ...state, viewport: action.viewport };
  if (action.type === "title") return { ...state, title: action.title };
  return { ...state, nodes: state.nodes.map((node) => node.clientId === action.clientId ? { ...node, snapshot: action.snapshot } : node) };
}

export function useCreativeCanvasSession(sessionId: string | null) {
  const [state, setState] = useState<CanvasState>(createCanvasState);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const initializedSessionId = useRef<string | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const dispatch = useCallback((action: CanvasAction) => setState((current) => reduceCanvasState(current, action)), []);
  const cacheKey = sessionId ? `creative-canvas:${sessionId}` : null;

  useEffect(() => {
    if (!sessionId || initializedSessionId.current === sessionId) return;
    initializedSessionId.current = sessionId;
    setIsLoading(true);
    const cached = readCache(sessionId);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/tools/creative-canvases/${sessionId}`, { cache: "no-store" });
          const payload = await response.json() as { canvas?: CanvasState; error?: string };
          if (!response.ok || !payload.canvas) throw new Error(payload.error || "恢复画布失败");
          dispatch({ type: "replace", ...payload.canvas });
        } catch (caughtError) {
          if (cached) dispatch({ type: "replace", ...cached });
          setError(caughtError instanceof Error ? caughtError.message : "恢复画布失败");
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dispatch, sessionId]);

  const persist = useCallback(async (value = stateRef.current) => {
    if (!sessionId) return;
    writeCache(sessionId, value);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tools/creative-canvases/${sessionId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
      const payload = await response.json() as { canvas?: CanvasState; error?: string };
      if (!response.ok || !payload.canvas) throw new Error(payload.error || "保存画布失败");
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "保存画布失败");
    } finally {
      setIsSaving(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || isLoading) return;
    const timer = window.setTimeout(() => { void persist(); }, 700);
    return () => window.clearTimeout(timer);
  }, [isLoading, persist, sessionId, state]);

  useEffect(() => {
    if (!sessionId) return;
    const handlePageHide = () => writeCache(sessionId, stateRef.current);
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [sessionId]);

  return { dispatch, error, isLoading, isSaving, persist, state };
}

function readCache(sessionId: string) {
  try {
    const raw = window.localStorage.getItem(`creative-canvas:${sessionId}`);
    return raw ? JSON.parse(raw) as CanvasState : null;
  } catch { return null; }
}

function writeCache(sessionId: string, state: CanvasState) {
  try { window.localStorage.setItem(`creative-canvas:${sessionId}`, JSON.stringify(state)); } catch { /* browser storage is best effort */ }
}
