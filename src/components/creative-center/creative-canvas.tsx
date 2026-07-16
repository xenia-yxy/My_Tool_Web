"use client";

import { FileText, ImagePlus, Link2, Minus, Plus, Send, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { buildSkillPrompt, getSystemCreativeSkills, type SystemCreativeSkill } from "@/lib/creative-skills";
import { useCreativeCanvasSession, type CanvasNode, type CanvasPosition } from "@/components/creative-center/use-creative-canvas-session";

type SkillChoice = SystemCreativeSkill & { versionId: string };
type DragState = { kind: "node"; clientId: string; offset: CanvasPosition } | { kind: "pan"; start: CanvasPosition; viewport: CanvasPosition } | null;

export function CreativeCanvasWorkspace({ sessionId: initialSessionId }: { sessionId?: string }) {
  const [sessionId, setSessionId] = useState(initialSessionId ?? null);
  const [creating, setCreating] = useState(!initialSessionId);
  const { dispatch, error, isLoading, isSaving, state } = useCreativeCanvasSession(sessionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [skillChoices, setSkillChoices] = useState<SkillChoice[]>([]);
  const [drag, setDrag] = useState<DragState>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState("");
  const [agentPlan, setAgentPlan] = useState<{ summary: string; executorKeys: string[] } | null>(null);
  const [planning, setPlanning] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/tools/creative-canvases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "未命名创作" }) });
          const payload = await response.json() as { canvas?: { id: string }; error?: string };
          if (!response.ok || !payload.canvas) throw new Error(payload.error || "创建画布失败");
          setSessionId(payload.canvas.id);
          window.history.replaceState(null, "", `/tools/creative-center/canvas/${payload.canvas.id}`);
        } finally { setCreating(false); }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/tools/creative-skills", { cache: "no-store" });
          const payload = await response.json() as { skills?: Array<{ id: string; versions: Array<{ id: string; config: SystemCreativeSkill }> }> };
          if (response.ok && payload.skills) setSkillChoices(payload.skills.map((skill) => ({ ...skill.versions[0]!.config, versionId: skill.versions[0]!.id })));
          else setSkillChoices(getSystemCreativeSkills().map((skill) => ({ ...skill, versionId: `${skill.id}:v1` })));
        } catch { setSkillChoices(getSystemCreativeSkills().map((skill) => ({ ...skill, versionId: `${skill.id}:v1` }))); }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selected = state.nodes.find((node) => node.clientId === selectedId) ?? null;
  const edgeLines = useMemo(() => state.edges.map((edge) => {
    const source = state.nodes.find((node) => node.clientId === edge.sourceClientId);
    const target = state.nodes.find((node) => node.clientId === edge.targetClientId);
    return source && target ? { ...edge, x1: source.position.x + 220, y1: source.position.y + 72, x2: target.position.x, y2: target.position.y + 72 } : null;
  }).filter(Boolean), [state.edges, state.nodes]);

  function addSkill(skill: SkillChoice) {
    const position = nextPosition(state.nodes.length);
    const clientId = `skill-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId, kind: "SKILL", position, skillVersionId: skill.versionId, snapshot: { name: skill.name, description: skill.description, executorKey: skill.executorKey, prompt: buildSkillPrompt(skill, {}), values: {}, status: "DRAFT" } } });
    setSelectedId(clientId);
  }

  function addText() {
    const clientId = `text-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId, kind: "TEXT", position: nextPosition(state.nodes.length), snapshot: { text: "输入创作需求" } } });
    setSelectedId(clientId);
  }

  async function uploadAsset(file: File) {
    const formData = new FormData();
    formData.set("image", file);
    formData.set("category", "服装");
    formData.set("name", file.name.replace(/\.[^.]+$/, ""));
    const response = await fetch("/api/tools/menswear/materials/upload", { method: "POST", body: formData });
    const payload = await response.json() as { material?: { id: string; name: string; imageUrl: string; category: string }; error?: string };
    if (!response.ok || !payload.material) throw new Error(payload.error || "上传素材失败");
    const clientId = `asset-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId, kind: "ASSET", position: nextPosition(state.nodes.length), snapshot: { materialId: payload.material.id, name: payload.material.name, imageUrl: payload.material.imageUrl, category: payload.material.category } } });
    setSelectedId(clientId);
  }

  function startPointer(event: PointerEvent<HTMLDivElement>, node?: CanvasNode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (node) {
      event.stopPropagation();
      setSelectedId(node.clientId);
      setDrag({ kind: "node", clientId: node.clientId, offset: { x: (event.clientX - rect.left - state.viewport.x) / state.viewport.zoom - node.position.x, y: (event.clientY - rect.top - state.viewport.y) / state.viewport.zoom - node.position.y } });
      return;
    }
    setDrag({ kind: "pan", start: { x: event.clientX, y: event.clientY }, viewport: state.viewport });
  }

  async function requestAgentPlan() {
    if (!sessionId || !agentMessage.trim()) return;
    setPlanning(true);
    setAgentError(null);
    try {
      const response = await fetch(`/api/tools/creative-canvases/${sessionId}/agent-plan`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: agentMessage }) });
      const payload = await response.json() as { plan?: { summary: string; executorKeys: string[] }; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error || "生成计划失败");
      setAgentPlan(payload.plan);
    } catch (caughtError) { setAgentError(caughtError instanceof Error ? caughtError.message : "生成计划失败");
    } finally { setPlanning(false); }
  }

  function applyAgentPlan() {
    if (!agentPlan) return;
    let previousClientId: string | null = null;
    agentPlan.executorKeys.forEach((executorKey, index) => {
      const skill = skillChoices.find((item) => item.executorKey === executorKey);
      if (!skill) return;
      const clientId = `skill-${crypto.randomUUID()}`;
      dispatch({ type: "add", node: { clientId, kind: "SKILL", position: nextPosition(state.nodes.length + index), skillVersionId: skill.versionId, snapshot: { name: skill.name, description: skill.description, executorKey: skill.executorKey, prompt: buildSkillPrompt(skill, {}), values: {}, status: "DRAFT" } } });
      if (previousClientId) dispatch({ type: "connect", sourceClientId: previousClientId, targetClientId: clientId, role: "继续创作" });
      previousClientId = clientId;
    });
    setAgentPlan(null);
    setAgentMessage("");
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (drag.kind === "node") dispatch({ type: "move", clientId: drag.clientId, position: { x: (event.clientX - rect.left - state.viewport.x) / state.viewport.zoom - drag.offset.x, y: (event.clientY - rect.top - state.viewport.y) / state.viewport.zoom - drag.offset.y } });
    else dispatch({ type: "viewport", viewport: { ...state.viewport, x: drag.viewport.x + event.clientX - drag.start.x, y: drag.viewport.y + event.clientY - drag.start.y } });
  }

  if (creating || isLoading) return <div className="grid min-h-[70dvh] place-items-center text-sm text-slate-500">正在打开创作画布...</div>;

  return <main className="fixed inset-0 z-40 bg-[#f4f7fb] text-slate-950"><div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4"><div className="flex min-w-0 items-center gap-3"><Sparkles aria-hidden="true" className="h-5 w-5 text-blue-600" /><input aria-label="画布项目名称" className="min-w-0 bg-transparent text-lg font-semibold outline-none" onChange={(event) => dispatch({ type: "title", title: event.target.value })} value={state.title} /><span className="text-xs text-slate-500">{isSaving ? "保存中" : "已保存"}</span></div><div className="flex items-center gap-1"><button aria-label="缩小画布" className={iconButtonClass} onClick={() => dispatch({ type: "viewport", viewport: { ...state.viewport, zoom: Math.max(0.4, state.viewport.zoom - 0.1) } })} title="缩小画布" type="button"><Minus className="h-4 w-4" /></button><button aria-label="放大画布" className={iconButtonClass} onClick={() => dispatch({ type: "viewport", viewport: { ...state.viewport, zoom: Math.min(1.6, state.viewport.zoom + 0.1) } })} title="放大画布" type="button"><Plus className="h-4 w-4" /></button></div></div>
    <div className="grid h-[calc(100dvh-4rem)] grid-cols-[68px_minmax(0,1fr)] lg:grid-cols-[68px_minmax(0,1fr)_320px]">
      <aside className="flex flex-col items-center gap-2 border-r border-slate-200 bg-white py-3"><button aria-label="上传素材" className={iconButtonClass} onClick={() => fileInput.current?.click()} title="上传素材" type="button"><Upload className="h-4 w-4" /></button><button aria-label="添加文本需求" className={iconButtonClass} onClick={addText} title="添加文本需求" type="button"><FileText className="h-4 w-4" /></button><div className="my-1 h-px w-8 bg-slate-200" />{skillChoices.slice(0, 5).map((skill) => <button aria-label={`添加 ${skill.name}`} className={iconButtonClass} key={skill.id} onClick={() => addSkill(skill)} title={skill.name} type="button"><Sparkles className="h-4 w-4" /></button>)}<input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAsset(file); event.target.value = ""; }} ref={fileInput} type="file" /></aside>
      <div className="relative min-w-0 overflow-hidden bg-[linear-gradient(#dce5f0_1px,transparent_1px),linear-gradient(90deg,#dce5f0_1px,transparent_1px)] bg-[size:28px_28px]" onPointerDown={(event) => startPointer(event)} onPointerMove={movePointer} onPointerUp={() => setDrag(null)} ref={canvasRef}>
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 h-[2600px] w-[3400px] overflow-visible">{edgeLines.map((edge) => edge ? <g key={`${edge.sourceClientId}-${edge.targetClientId}-${edge.role}`}><line stroke="#60a5fa" strokeWidth="2" x1={edge.x1} x2={edge.x2} y1={edge.y1} y2={edge.y2} /><text fill="#2563eb" fontSize="12" x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2 - 6}>{edge.role}</text></g> : null)}</svg>
          {state.nodes.map((node) => <CanvasCard connecting={connectingFrom === node.clientId} key={node.clientId} node={node} onConnect={() => { if (connectingFrom && connectingFrom !== node.clientId) { dispatch({ type: "connect", sourceClientId: connectingFrom, targetClientId: node.clientId, role: "主体图" }); setConnectingFrom(null); } else setConnectingFrom(node.clientId); }} onPointerDown={(event) => startPointer(event, node)} selected={node.clientId === selectedId} />)}
        </div>
        {error ? <div className="absolute left-4 top-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </div>
      <CanvasInspector node={selected} onDelete={() => { if (selected) { dispatch({ type: "remove", clientId: selected.clientId }); setSelectedId(null); } }} onSnapshot={(snapshot) => selected && dispatch({ type: "snapshot", clientId: selected.clientId, snapshot })} />
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"><div className="pointer-events-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><div className="flex gap-2"><textarea className="min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-blue-400" onChange={(event) => setAgentMessage(event.target.value)} placeholder="描述你想完成的创作，Agent 会先生成可编辑的 Skill 流程" value={agentMessage} /><button aria-label="生成画布计划" className="grid h-11 w-11 place-items-center rounded-md bg-blue-600 text-white disabled:opacity-50" disabled={!agentMessage.trim() || planning} onClick={() => void requestAgentPlan()} title="生成画布计划" type="button"><Send className="h-4 w-4" /></button></div>{agentError ? <p className="mt-2 text-sm text-red-700">{agentError}</p> : null}{agentPlan ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-950"><span>{agentPlan.summary}</span><div className="flex gap-2"><Button className="h-8 px-3 text-xs" onClick={() => setAgentPlan(null)} type="button" variant="secondary">取消</Button><Button className="h-8 px-3 text-xs" onClick={applyAgentPlan} type="button">应用到画布</Button></div></div> : null}</div></div>
  </main>;
}

function CanvasCard({ node, selected, connecting, onPointerDown, onConnect }: { node: CanvasNode; selected: boolean; connecting: boolean; onPointerDown: (event: PointerEvent<HTMLDivElement>) => void; onConnect: () => void }) {
  const imageUrl = typeof node.snapshot.imageUrl === "string" ? node.snapshot.imageUrl : null;
  const title = String(node.snapshot.name ?? node.snapshot.text ?? "创作卡片");
  return <div className={`absolute w-56 cursor-grab rounded-lg border bg-white p-3 shadow-sm ${selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`} onPointerDown={onPointerDown} style={{ left: node.position.x, top: node.position.y }}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{title}</span><button aria-label="连接此卡片" className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700" onClick={(event) => { event.stopPropagation(); onConnect(); }} title="连接此卡片" type="button"><Link2 className="h-3.5 w-3.5" /></button></div>{imageUrl ? <img alt={title} className="mt-3 aspect-[4/3] w-full rounded-md border border-slate-100 object-cover" src={imageUrl} /> : <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{String(node.snapshot.description ?? node.snapshot.prompt ?? "等待设置参数")}</p>}<div className="mt-3 text-xs text-slate-400">{connecting ? "请选择要连接的卡片" : node.kind === "SKILL" ? "Skill" : node.kind === "ASSET" ? "素材" : "需求"}</div></div>;
}

function CanvasInspector({ node, onSnapshot, onDelete }: { node: CanvasNode | null; onSnapshot: (snapshot: Record<string, unknown>) => void; onDelete: () => void }) {
  if (!node) return <aside className="hidden border-l border-slate-200 bg-white p-4 lg:block"><p className="text-sm leading-6 text-slate-500">选择画布中的素材或 Skill，查看参数与完整提示词。</p></aside>;
  const prompt = String(node.snapshot.prompt ?? "");
  return <aside className="hidden overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block"><div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{String(node.snapshot.name ?? node.snapshot.text ?? "卡片")}</h2><button aria-label="删除卡片" className={iconButtonClass} onClick={onDelete} title="删除卡片" type="button"><Trash2 className="h-4 w-4 text-red-600" /></button></div>{node.kind === "TEXT" ? <textarea className="mt-4 min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, text: event.target.value })} value={String(node.snapshot.text ?? "")} /> : null}{node.kind === "SKILL" ? <><label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">完整提示词<textarea className="min-h-56 rounded-md border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, prompt: event.target.value })} value={prompt} /></label><Button className="mt-4 w-full gap-2" type="button"><ImagePlus aria-hidden="true" className="h-4 w-4" />前往生成</Button></> : null}{node.kind === "ASSET" && typeof node.snapshot.imageUrl === "string" ? <img alt={String(node.snapshot.name ?? "素材预览")} className="mt-4 max-h-72 w-full rounded-md border border-slate-200 object-contain" src={node.snapshot.imageUrl} /> : null}</aside>;
}

function nextPosition(index: number) { return { x: 120 + (index % 4) * 280, y: 120 + Math.floor(index / 4) * 210 }; }
const iconButtonClass = "grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950";
