"use client";

import { ChevronDown, FileText, ImagePlus, Link2, Minus, Plus, Send, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { getSystemCreativeSkills, type SystemCreativeSkill } from "@/lib/creative-skills";
import { useCreativeCanvasSession, type CanvasNode, type CanvasPosition } from "@/components/creative-center/use-creative-canvas-session";
import { buildCanvasTemplateNodes, createSkillSnapshot, creativeCanvasTemplates, type CreativeCanvasTemplate } from "@/lib/creative-canvas-templates";

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
  const [showSkillPicker, setShowSkillPicker] = useState(false);
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
    dispatch({ type: "add", node: { clientId, kind: "SKILL", position, skillVersionId: skill.versionId, snapshot: createSkillSnapshot(skill) } });
    setSelectedId(clientId);
    setShowSkillPicker(false);
  }

  function addText() {
    const clientId = `text-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId, kind: "TEXT", position: nextPosition(state.nodes.length), snapshot: { text: "输入创作需求" } } });
    setSelectedId(clientId);
  }

  function addTemplate(template: CreativeCanvasTemplate) {
    const skill = skillChoices.find((item) => item.executorKey === template.executorKey);
    if (!skill) return;
    const result = buildCanvasTemplateNodes(template, {
      textClientId: `text-${crypto.randomUUID()}`,
      skillClientId: `skill-${crypto.randomUUID()}`,
      skillVersionId: skill.versionId,
    });
    result.nodes.forEach((node) => dispatch({ type: "add", node }));
    result.edges.forEach((edge) => dispatch({ type: "connect", ...edge }));
    setSelectedId(result.nodes[1]?.clientId ?? null);
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
    const requirementClientId = `text-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId: requirementClientId, kind: "TEXT", position: nextPosition(state.nodes.length), snapshot: { name: "创作需求", text: agentMessage.trim() } } });
    let previousClientId: string | null = requirementClientId;
    agentPlan.executorKeys.forEach((executorKey, index) => {
      const skill = skillChoices.find((item) => item.executorKey === executorKey);
      if (!skill) return;
      const clientId = `skill-${crypto.randomUUID()}`;
      dispatch({ type: "add", node: { clientId, kind: "SKILL", position: nextPosition(state.nodes.length + index + 1), skillVersionId: skill.versionId, snapshot: createSkillSnapshot(skill) } });
      if (previousClientId) dispatch({ type: "connect", sourceClientId: previousClientId, targetClientId: clientId, role: previousClientId === requirementClientId ? "创作需求" : "继续创作" });
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
    <div className="grid h-[calc(100dvh-4rem)] grid-cols-[minmax(164px,220px)_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      <aside className="overflow-y-auto border-r border-slate-200 bg-white p-3"><div className="grid gap-2"><p className="px-1 text-xs font-medium text-slate-500">开始创作</p><button className={actionButtonClass} onClick={() => fileInput.current?.click()} type="button"><Upload className="h-4 w-4" />上传素材</button><button className={actionButtonClass} onClick={addText} type="button"><FileText className="h-4 w-4" />写下需求</button></div><div className="my-4 h-px bg-slate-200" /><div className="grid gap-2"><p className="px-1 text-xs font-medium text-slate-500">选择功能</p><button aria-expanded={showSkillPicker} className={actionButtonClass} onClick={() => setShowSkillPicker((current) => !current)} type="button"><Sparkles className="h-4 w-4" />添加 Skill<ChevronDown className={`ml-auto h-4 w-4 transition ${showSkillPicker ? "rotate-180" : ""}`} /></button>{showSkillPicker ? <div className="grid gap-1 rounded-md bg-slate-50 p-1">{skillChoices.map((skill) => <button className="rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-white hover:text-blue-700" key={skill.id} onClick={() => addSkill(skill)} type="button"><span className="block font-medium">{skill.name}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{skill.description}</span></button>)}</div> : null}</div><p className="mt-5 px-1 text-xs leading-5 text-slate-500">先选一个目标，再补充素材和要求。卡片可继续拖动和连接。</p><input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAsset(file); event.target.value = ""; }} ref={fileInput} type="file" /></aside>
      <div className="relative min-w-0 overflow-hidden bg-[linear-gradient(#dce5f0_1px,transparent_1px),linear-gradient(90deg,#dce5f0_1px,transparent_1px)] bg-[size:28px_28px]" onPointerDown={(event) => startPointer(event)} onPointerMove={movePointer} onPointerUp={() => setDrag(null)} ref={canvasRef}>
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 h-[2600px] w-[3400px] overflow-visible">{edgeLines.map((edge) => edge ? <g key={`${edge.sourceClientId}-${edge.targetClientId}-${edge.role}`}><line stroke="#60a5fa" strokeWidth="2" x1={edge.x1} x2={edge.x2} y1={edge.y1} y2={edge.y2} /><text fill="#2563eb" fontSize="12" x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2 - 6}>{edge.role}</text></g> : null)}</svg>
          {state.nodes.map((node) => <CanvasCard connecting={connectingFrom === node.clientId} key={node.clientId} node={node} onConnect={() => { if (connectingFrom && connectingFrom !== node.clientId) { dispatch({ type: "connect", sourceClientId: connectingFrom, targetClientId: node.clientId, role: "主体图" }); setConnectingFrom(null); } else setConnectingFrom(node.clientId); }} onPointerDown={(event) => startPointer(event, node)} selected={node.clientId === selectedId} />)}
        </div>
        {state.nodes.length === 0 ? <CanvasEmptyState onChoose={addTemplate} /> : null}
        {error ? <div className="absolute left-4 top-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </div>
      <CanvasInspector node={selected} onDelete={() => { if (selected) { dispatch({ type: "remove", clientId: selected.clientId }); setSelectedId(null); } }} onOpenSkill={(executorKey) => { const route = skillDestinationRoutes[executorKey]; if (route) window.location.assign(route); }} onSnapshot={(snapshot) => selected && dispatch({ type: "snapshot", clientId: selected.clientId, snapshot })} />
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"><div className="pointer-events-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><div className="flex gap-2"><textarea className="min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-blue-400" onChange={(event) => setAgentMessage(event.target.value)} placeholder="例如：我上传一件衬衫，帮我做秋季一衣多搭和小红书封面" value={agentMessage} /><button aria-label="让 Agent 推荐流程" className="grid h-11 w-11 place-items-center rounded-md bg-blue-600 text-white disabled:opacity-50" disabled={!agentMessage.trim() || planning} onClick={() => void requestAgentPlan()} title="让 Agent 推荐流程" type="button"><Send className="h-4 w-4" /></button></div>{agentError ? <p className="mt-2 text-sm text-red-700">{agentError}</p> : null}{agentPlan ? <div className="mt-3 grid gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-950"><p>{agentPlan.summary}</p><div className="flex flex-wrap gap-1.5">{agentPlan.executorKeys.map((executorKey) => <span className="rounded bg-white px-2 py-1 text-xs text-slate-700" key={executorKey}>{skillChoices.find((skill) => skill.executorKey === executorKey)?.name ?? executorKey}</span>)}</div><div className="flex justify-end gap-2"><Button className="h-8 px-3 text-xs" onClick={() => setAgentPlan(null)} type="button" variant="secondary">取消</Button><Button className="h-8 px-3 text-xs" onClick={applyAgentPlan} type="button">应用推荐流程</Button></div></div> : null}</div></div>
  </main>;
}

function CanvasEmptyState({ onChoose }: { onChoose: (template: CreativeCanvasTemplate) => void }) {
  return <section className="absolute inset-0 grid place-items-center p-5"><div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-blue-700">从一个创作目标开始</p><h1 className="mt-2 text-xl font-semibold text-slate-950">选择你现在想完成的事</h1><p className="mt-2 text-sm leading-6 text-slate-600">系统会自动创建需求和 Skill 步骤。接着上传素材、修改提示词，最后打开对应功能完成生成。</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{creativeCanvasTemplates.map((template) => <button className="rounded-md border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50" key={template.id} onClick={() => onChoose(template)} type="button"><span className="text-sm font-semibold text-slate-900">{template.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{template.description}</span></button>)}</div><p className="mt-5 text-xs leading-5 text-slate-500">也可以从左侧上传素材、写下需求，或在底部直接告诉 Agent 你想做什么。</p></div></section>;
}

function CanvasCard({ node, selected, connecting, onPointerDown, onConnect }: { node: CanvasNode; selected: boolean; connecting: boolean; onPointerDown: (event: PointerEvent<HTMLDivElement>) => void; onConnect: () => void }) {
  const imageUrl = typeof node.snapshot.imageUrl === "string" ? node.snapshot.imageUrl : null;
  const title = String(node.snapshot.name ?? node.snapshot.text ?? "创作卡片");
  const description = node.kind === "TEXT" ? String(node.snapshot.text ?? "") : String(node.snapshot.description ?? node.snapshot.prompt ?? "等待设置参数");
  return <div className={`absolute w-56 cursor-grab rounded-lg border bg-white p-3 shadow-sm ${selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`} onPointerDown={onPointerDown} style={{ left: node.position.x, top: node.position.y }}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{title}</span><button aria-label="连接此卡片" className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700" onClick={(event) => { event.stopPropagation(); onConnect(); }} title="连接此卡片" type="button"><Link2 className="h-3.5 w-3.5" /></button></div>{imageUrl ? <img alt={title} className="mt-3 aspect-[4/3] w-full rounded-md border border-slate-100 object-cover" src={imageUrl} /> : <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{description}</p>}<div className="mt-3 text-xs text-slate-400">{connecting ? "请选择要连接的卡片" : node.kind === "SKILL" ? "Skill" : node.kind === "ASSET" ? "素材" : "需求"}</div></div>;
}

function CanvasInspector({ node, onSnapshot, onDelete, onOpenSkill }: { node: CanvasNode | null; onSnapshot: (snapshot: Record<string, unknown>) => void; onDelete: () => void; onOpenSkill: (executorKey: string) => void }) {
  if (!node) return <aside className="hidden border-l border-slate-200 bg-white p-5 lg:block"><h2 className="text-base font-semibold text-slate-950">当前步骤说明</h2><ol className="mt-5 grid gap-4 text-sm leading-6 text-slate-600"><li><span className="font-semibold text-slate-900">1. 选目标</span><br />从画布中间的模板开始，或在左侧添加 Skill。</li><li><span className="font-semibold text-slate-900">2. 补素材和要求</span><br />上传主体图、参考图，或点击需求卡写清楚目的。</li><li><span className="font-semibold text-slate-900">3. 检查提示词</span><br />点击 Skill 卡，在这里确认必填素材和完整提示词。</li><li><span className="font-semibold text-slate-900">4. 打开功能生成</span><br />从 Skill 卡打开对应工作台继续生成，画布会保留你的流程。</li></ol></aside>;
  const prompt = String(node.snapshot.prompt ?? "");
  const inputLabels = readSkillInputs(node.snapshot.inputs);
  const executorKey = typeof node.snapshot.executorKey === "string" ? node.snapshot.executorKey : "";
  return <aside className="hidden overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block"><div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{String(node.snapshot.name ?? node.snapshot.text ?? "卡片")}</h2><button aria-label="删除卡片" className={iconButtonClass} onClick={onDelete} title="删除卡片" type="button"><Trash2 className="h-4 w-4 text-red-600" /></button></div>{node.kind === "TEXT" ? <><p className="mt-3 text-sm leading-6 text-slate-500">这一步告诉 Agent 和 Skill 你希望获得什么结果。</p><textarea className="mt-4 min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, text: event.target.value })} value={String(node.snapshot.text ?? "")} /></> : null}{node.kind === "SKILL" ? <><p className="mt-3 text-sm leading-6 text-slate-500">{String(node.snapshot.description ?? "")}</p><section className="mt-5"><h3 className="text-sm font-medium text-slate-800">需要补充</h3>{inputLabels.length ? <ul className="mt-2 grid gap-2">{inputLabels.map((input) => <li className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700" key={input.label}>{input.label}{input.required ? <span className="ml-1 text-red-600">必填</span> : <span className="ml-1 text-slate-400">可选</span>}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">此 Skill 暂无额外输入。</p>}</section><label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">完整提示词<textarea className="min-h-56 rounded-md border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, prompt: event.target.value })} value={prompt} /></label><Button className="mt-4 w-full gap-2" onClick={() => onOpenSkill(executorKey)} type="button"><ImagePlus aria-hidden="true" className="h-4 w-4" />打开对应功能</Button></> : null}{node.kind === "ASSET" ? <p className="mt-3 text-sm leading-6 text-slate-500">素材可连接到 Skill，作为主体图、参考图或风格参考。</p> : null}{node.kind === "ASSET" && typeof node.snapshot.imageUrl === "string" ? <img alt={String(node.snapshot.name ?? "素材预览")} className="mt-4 max-h-72 w-full rounded-md border border-slate-200 object-contain" src={node.snapshot.imageUrl} /> : null}</aside>;
}

function nextPosition(index: number) { return { x: 120 + (index % 4) * 280, y: 120 + Math.floor(index / 4) * 210 }; }
const iconButtonClass = "grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950";
const actionButtonClass = "flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950";
const skillDestinationRoutes: Record<string, string> = {
  "menswear-generate": "/tools/menswear/generate",
  "menswear-style-reference": "/tools/menswear/style-reference",
  "menswear-multi-outfit": "/tools/menswear/multi-outfit",
  "platform-cover-design": "/tools/platform-cover-design",
  "ip-derivative-factory": "/tools/ip-factory",
  "menswear-model-generate": "/tools/menswear/models",
  "menswear-material-extract": "/tools/menswear/materials",
  "hotspot-research": "/tools/hotspots",
};

function readSkillInputs(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ label: string; required: boolean }>;
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const input = item as Record<string, unknown>;
    return typeof input.label === "string" ? [{ label: input.label, required: input.required === true }] : [];
  });
}
