"use client";

import { ChevronDown, FileText, ImagePlus, Link2, Minus, Plus, Send, Sparkles, Trash2, Upload, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Button } from "@/components/ui/button";
import { getSystemCreativeSkills, type SystemCreativeSkill } from "@/lib/creative-skills";
import { useCreativeCanvasSession, type CanvasNode, type CanvasPosition } from "@/components/creative-center/use-creative-canvas-session";
import { buildCanvasTemplateNodes, createSkillSnapshot, creativeCanvasTemplates, type CreativeCanvasTemplate } from "@/lib/creative-canvas-templates";
import { getCanvasFlowStage, getCanvasNodeAccentColor } from "@/lib/creative-canvas-flow";

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
  const [generatingNodeId, setGeneratingNodeId] = useState<string | null>(null);
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
  const flowStage = getCanvasFlowStage(state.nodes);
  const edgeLines = useMemo(() => state.edges.map((edge) => {
    const source = state.nodes.find((node) => node.clientId === edge.sourceClientId);
    const target = state.nodes.find((node) => node.clientId === edge.targetClientId);
    return source && target ? { ...edge, x1: source.position.x + 288, y1: source.position.y + 88, x2: target.position.x, y2: target.position.y + 88 } : null;
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
    const material = payload.material;
    const clientId = `asset-${crypto.randomUUID()}`;
    dispatch({ type: "add", node: { clientId, kind: "ASSET", position: nextPosition(state.nodes.length), snapshot: { materialId: material.id, name: material.name, imageUrl: material.imageUrl, category: material.category } } });
    setSelectedId(clientId);
    void extractImageAccentColor(material.imageUrl).then((accentColor) => {
      if (accentColor) dispatch({ type: "snapshot", clientId, snapshot: { materialId: material.id, name: material.name, imageUrl: material.imageUrl, category: material.category, accentColor } });
    });
  }

  function startPointer(event: PointerEvent<HTMLDivElement>, node?: CanvasNode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
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

  async function generateFromSkill(node: CanvasNode) {
    const prompt = String(node.snapshot.prompt ?? "").trim();
    if (!prompt) {
      setAgentError("请先补充该 Skill 的提示词");
      return;
    }
    setGeneratingNodeId(node.clientId);
    setAgentError(null);
    try {
      const references = state.edges
        .filter((edge) => edge.targetClientId === node.clientId)
        .map((edge) => state.nodes.find((item) => item.clientId === edge.sourceClientId))
        .filter((item): item is CanvasNode => item?.kind === "ASSET" && typeof item.snapshot.imageUrl === "string");
      const request = references.length ? new FormData() : null;
      if (request) {
        for (const reference of references.slice(0, 4)) {
          const response = await fetch(String(reference.snapshot.imageUrl));
          if (!response.ok) throw new Error("读取画布参考图失败，请重新上传该素材");
          const blob = await response.blob();
          request.append("image", new File([blob], `${reference.clientId}.png`, { type: blob.type || "image/png" }));
        }
        request.set("mode", "custom");
        request.set("finalPrompt", prompt);
        request.set("purpose", String(node.snapshot.name ?? "画布生成"));
        request.set("sourceTool", "creative-canvas");
        request.set("batchCount", "1");
      }
      const response = await fetch("/api/tools/image-generation", request ? { method: "POST", body: request } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "custom", finalPrompt: prompt, purpose: String(node.snapshot.name ?? "画布生成"), sourceTool: "creative-canvas", batchCount: 1 }) });
      const payload = await response.json() as { error?: string; results?: Array<{ imageUrl: string; asset?: { id: string; title?: string } }> };
      if (!response.ok || !payload.results?.length) throw new Error(payload.error || "画布生图失败");
      payload.results.forEach((result, index) => {
        const clientId = `result-${crypto.randomUUID()}`;
        dispatch({ type: "add", node: { clientId, kind: "ASSET", position: { x: node.position.x + 360 + index * 28, y: node.position.y + index * 28 }, snapshot: { materialId: result.asset?.id ?? clientId, name: result.asset?.title ?? "生成结果", imageUrl: result.imageUrl, category: "生成结果", accentColor: "#16a34a", source: "GENERATED" } } });
        dispatch({ type: "connect", sourceClientId: node.clientId, targetClientId: clientId, role: "生成结果" });
        setSelectedId(clientId);
      });
    } catch (caughtError) {
      setAgentError(caughtError instanceof Error ? caughtError.message : "画布生图失败");
    } finally {
      setGeneratingNodeId(null);
    }
  }

  function stopPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDrag(null);
  }

  function zoomCanvas(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextZoom = Math.min(1.8, Math.max(0.35, state.viewport.zoom + (event.deltaY < 0 ? 0.08 : -0.08)));
    dispatch({ type: "viewport", viewport: { ...state.viewport, zoom: nextZoom } });
  }

  if (creating || isLoading) return <div className="grid min-h-[70dvh] place-items-center text-sm text-slate-500">正在打开创作画布...</div>;

  return <main className="fixed inset-0 z-40 bg-[#f4f7fb] text-slate-950"><div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4"><div className="flex min-w-0 items-center gap-3"><Sparkles aria-hidden="true" className="h-5 w-5 text-blue-600" /><input aria-label="画布项目名称" className="min-w-0 bg-transparent text-lg font-semibold outline-none" onChange={(event) => dispatch({ type: "title", title: event.target.value })} value={state.title} /><span className="text-xs text-slate-500">{isSaving ? "保存中" : "已保存"}</span></div><div className="flex items-center gap-1"><button aria-label="缩小画布" className={iconButtonClass} onClick={() => dispatch({ type: "viewport", viewport: { ...state.viewport, zoom: Math.max(0.4, state.viewport.zoom - 0.1) } })} title="缩小画布" type="button"><Minus className="h-4 w-4" /></button><button aria-label="放大画布" className={iconButtonClass} onClick={() => dispatch({ type: "viewport", viewport: { ...state.viewport, zoom: Math.min(1.6, state.viewport.zoom + 0.1) } })} title="放大画布" type="button"><Plus className="h-4 w-4" /></button></div></div>
    <div className="grid h-[calc(100dvh-4rem)] grid-cols-[minmax(164px,220px)_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      <aside className="overflow-y-auto border-r border-slate-200 bg-white p-3"><div className="grid gap-2"><p className="px-1 text-xs font-medium text-slate-500">开始创作</p><button className={actionButtonClass} onClick={() => fileInput.current?.click()} type="button"><Upload className="h-4 w-4" />上传素材</button><button className={actionButtonClass} onClick={addText} type="button"><FileText className="h-4 w-4" />写下需求</button></div><div className="my-4 h-px bg-slate-200" /><div className="grid gap-2"><p className="px-1 text-xs font-medium text-slate-500">选择功能</p><button aria-expanded={showSkillPicker} className={actionButtonClass} onClick={() => setShowSkillPicker((current) => !current)} type="button"><Sparkles className="h-4 w-4" />添加 Skill<ChevronDown className={`ml-auto h-4 w-4 transition ${showSkillPicker ? "rotate-180" : ""}`} /></button>{showSkillPicker ? <div className="grid gap-1 rounded-md bg-slate-50 p-1">{skillChoices.map((skill) => <button className="rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-white hover:text-blue-700" key={skill.id} onClick={() => addSkill(skill)} type="button"><span className="block font-medium">{skill.name}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{skill.description}</span></button>)}</div> : null}</div><p className="mt-5 px-1 text-xs leading-5 text-slate-500">先选一个目标，再补充素材和要求。卡片可继续拖动和连接。</p><input accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAsset(file); event.target.value = ""; }} ref={fileInput} type="file" /></aside>
      <div className="relative min-w-0 overflow-hidden bg-[#f5f6f8] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px]" onPointerCancel={stopPointer} onPointerDown={(event) => startPointer(event)} onPointerMove={movePointer} onPointerUp={stopPointer} onWheel={zoomCanvas} ref={canvasRef}>
        <CanvasFlowRail onAddMaterial={() => fileInput.current?.click()} onAddSkill={() => setShowSkillPicker(true)} stage={flowStage} />
        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 h-[2600px] w-[3400px] overflow-visible">{edgeLines.map((edge) => edge ? <g key={`${edge.sourceClientId}-${edge.targetClientId}-${edge.role}`}><line stroke="#60a5fa" strokeWidth="2" x1={edge.x1} x2={edge.x2} y1={edge.y1} y2={edge.y2} /><text fill="#2563eb" fontSize="12" x={(edge.x1 + edge.x2) / 2} y={(edge.y1 + edge.y2) / 2 - 6}>{edge.role}</text></g> : null)}</svg>
          {state.nodes.map((node) => <CanvasCard connecting={connectingFrom === node.clientId} key={node.clientId} node={node} onConnect={() => { if (connectingFrom && connectingFrom !== node.clientId) { dispatch({ type: "connect", sourceClientId: connectingFrom, targetClientId: node.clientId, role: "主体图" }); setConnectingFrom(null); } else setConnectingFrom(node.clientId); }} onPointerDown={(event) => startPointer(event, node)} selected={node.clientId === selectedId} />)}
        </div>
        {state.nodes.length === 0 ? <CanvasEmptyState onChoose={addTemplate} /> : null}
        {error ? <div className="absolute left-4 top-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </div>
      <CanvasInspector generating={selected?.clientId === generatingNodeId} node={selected} onDelete={() => { if (selected) { dispatch({ type: "remove", clientId: selected.clientId }); setSelectedId(null); } }} onGenerate={() => selected && void generateFromSkill(selected)} onOpenSkill={(executorKey) => { const route = skillDestinationRoutes[executorKey]; if (route) window.location.assign(route); }} onSnapshot={(snapshot) => selected && dispatch({ type: "snapshot", clientId: selected.clientId, snapshot })} />
    </div>
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"><div className="pointer-events-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-3 shadow-lg"><div className="flex gap-2"><textarea className="min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-blue-400" onChange={(event) => setAgentMessage(event.target.value)} placeholder="例如：我上传一件衬衫，帮我做秋季一衣多搭和小红书封面" value={agentMessage} /><button aria-label="让 Agent 推荐流程" className="grid h-11 w-11 place-items-center rounded-md bg-blue-600 text-white disabled:opacity-50" disabled={!agentMessage.trim() || planning} onClick={() => void requestAgentPlan()} title="让 Agent 推荐流程" type="button"><Send className="h-4 w-4" /></button></div>{agentError ? <p className="mt-2 text-sm text-red-700">{agentError}</p> : null}{agentPlan ? <div className="mt-3 grid gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-950"><p>{agentPlan.summary}</p><div className="flex flex-wrap gap-1.5">{agentPlan.executorKeys.map((executorKey) => <span className="rounded bg-white px-2 py-1 text-xs text-slate-700" key={executorKey}>{skillChoices.find((skill) => skill.executorKey === executorKey)?.name ?? executorKey}</span>)}</div><div className="flex justify-end gap-2"><Button className="h-8 px-3 text-xs" onClick={() => setAgentPlan(null)} type="button" variant="secondary">取消</Button><Button className="h-8 px-3 text-xs" onClick={applyAgentPlan} type="button">应用推荐流程</Button></div></div> : null}</div></div>
  </main>;
}

function CanvasFlowRail({ stage, onAddMaterial, onAddSkill }: { stage: "MATERIAL" | "SKILL" | "REFINE"; onAddMaterial: () => void; onAddSkill: () => void }) {
  const stages = [{ id: "MATERIAL", label: "添加素材" }, { id: "SKILL", label: "选择能力" }, { id: "REFINE", label: "调整画面" }, { id: "GENERATE", label: "生成结果" }];
  const active = stage === "MATERIAL" ? 0 : stage === "SKILL" ? 1 : 2;
  return <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-4"><div className="pointer-events-auto flex items-center rounded-full border border-slate-200 bg-white/95 p-1 shadow-sm">{stages.map((item, index) => <button className={`flex h-9 items-center gap-2 rounded-full px-3 text-sm ${index === active ? "bg-slate-950 text-white" : index < active ? "text-slate-700" : "text-slate-400"}`} key={item.id} onClick={item.id === "MATERIAL" ? onAddMaterial : item.id === "SKILL" ? onAddSkill : undefined} type="button"><span className="grid h-5 w-5 place-items-center rounded-full border border-current text-xs">{index + 1}</span>{item.label}</button>)}</div></div>;
}

function CanvasEmptyState({ onChoose }: { onChoose: (template: CreativeCanvasTemplate) => void }) {
  return <section className="pointer-events-none absolute inset-0 grid place-items-center p-6"><div className="pointer-events-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><WandSparkles className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-950">新建创作画布</p><p className="text-xs text-slate-500">选一个起点，画布会生成可继续编辑的节点。</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{creativeCanvasTemplates.map((template) => <button className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50" key={template.id} onClick={() => onChoose(template)} type="button"><span className="text-sm font-semibold text-slate-900">{template.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{template.description}</span><span className="mt-3 block text-xs font-medium text-violet-700">创建流程</span></button>)}</div></div></section>;
}

function CanvasCard({ node, selected, connecting, onPointerDown, onConnect }: { node: CanvasNode; selected: boolean; connecting: boolean; onPointerDown: (event: PointerEvent<HTMLDivElement>) => void; onConnect: () => void }) {
  const imageUrl = typeof node.snapshot.imageUrl === "string" ? node.snapshot.imageUrl : null;
  const title = String(node.snapshot.name ?? node.snapshot.text ?? "创作卡片");
  const description = node.kind === "TEXT" ? String(node.snapshot.text ?? "") : String(node.snapshot.description ?? node.snapshot.prompt ?? "等待设置参数");
  const accent = getCanvasNodeAccentColor(node.snapshot, node.kind);
  const tone = node.kind === "SKILL" ? "bg-violet-50/90" : node.kind === "TEXT" ? "bg-amber-50/90" : "bg-white";
  return <div className={`absolute w-72 cursor-grab rounded-xl border-2 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ${tone} ${selected ? "ring-2 ring-violet-300" : ""}`} onPointerDown={onPointerDown} style={{ borderColor: accent, boxShadow: `0 12px 32px ${accent}2b`, left: node.position.x, top: node.position.y }}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-900">{title}</span><button aria-label="连接此节点" className="grid h-7 w-7 place-items-center rounded-full bg-white/80 text-slate-500 hover:text-violet-700" onClick={(event) => { event.stopPropagation(); onConnect(); }} type="button"><Link2 className="h-3.5 w-3.5" /></button></div>{imageUrl ? <img alt={title} className="mt-3 aspect-[4/3] w-full rounded-lg object-cover" src={imageUrl} /> : <p className="mt-3 line-clamp-3 rounded-lg bg-white/70 p-3 text-sm leading-5 text-slate-600">{description}</p>}<div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{node.kind === "SKILL" ? "AI 能力" : node.kind === "ASSET" ? "参考素材" : "创作备注"}</span><span>{connecting ? "选择下一个节点" : "可拖动"}</span></div></div>;
}

function CanvasInspector({ node, onSnapshot, onDelete, onOpenSkill, onGenerate, generating }: { node: CanvasNode | null; onSnapshot: (snapshot: Record<string, unknown>) => void; onDelete: () => void; onOpenSkill: (executorKey: string) => void; onGenerate: () => void; generating: boolean }) {
  if (!node) return <aside className="hidden border-l border-slate-200 bg-white p-5 lg:block"><h2 className="text-base font-semibold text-slate-950">当前步骤说明</h2><ol className="mt-5 grid gap-4 text-sm leading-6 text-slate-600"><li><span className="font-semibold text-slate-900">1. 选目标</span><br />从画布中间的模板开始，或在左侧添加 Skill。</li><li><span className="font-semibold text-slate-900">2. 补素材和要求</span><br />上传主体图、参考图，或点击需求卡写清楚目的。</li><li><span className="font-semibold text-slate-900">3. 检查提示词</span><br />点击 Skill 卡，在这里确认必填素材和完整提示词。</li><li><span className="font-semibold text-slate-900">4. 打开功能生成</span><br />从 Skill 卡打开对应工作台继续生成，画布会保留你的流程。</li></ol></aside>;
  const prompt = String(node.snapshot.prompt ?? "");
  const inputLabels = readSkillInputs(node.snapshot.inputs);
  const executorKey = typeof node.snapshot.executorKey === "string" ? node.snapshot.executorKey : "";
  return <aside className="hidden overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block"><div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{String(node.snapshot.name ?? node.snapshot.text ?? "卡片")}</h2><button aria-label="删除卡片" className={iconButtonClass} onClick={onDelete} title="删除卡片" type="button"><Trash2 className="h-4 w-4 text-red-600" /></button></div>{node.kind === "TEXT" ? <textarea className="mt-4 min-h-32 w-full rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, text: event.target.value })} value={String(node.snapshot.text ?? "")} /> : null}{node.kind === "SKILL" ? <><section className="mt-5"><h3 className="text-sm font-medium text-slate-800">需要补充</h3>{inputLabels.length ? <ul className="mt-2 grid gap-2">{inputLabels.map((input) => <li className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700" key={input.label}>{input.label}{input.required ? <span className="ml-1 text-red-600">必填</span> : null}</li>)}</ul> : null}</section><label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">完整提示词<textarea className="min-h-56 rounded-md border border-slate-200 p-3 text-sm font-normal leading-6 outline-none focus:border-blue-400" onChange={(event) => onSnapshot({ ...node.snapshot, prompt: event.target.value })} value={prompt} /></label><Button className="mt-4 w-full gap-2" disabled={generating} onClick={onGenerate} type="button"><ImagePlus aria-hidden="true" className="h-4 w-4" />{generating ? "正在生成" : "在画布内生成"}</Button><button className="mt-3 w-full text-sm text-slate-500 hover:text-slate-900" onClick={() => onOpenSkill(executorKey)} type="button">打开完整工作台</button></> : null}{node.kind === "ASSET" ? <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">素材名称<input className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal" onChange={(event) => onSnapshot({ ...node.snapshot, name: event.target.value })} value={String(node.snapshot.name ?? "")} /></label> : null}{node.kind === "ASSET" && typeof node.snapshot.imageUrl === "string" ? <img alt={String(node.snapshot.name ?? "素材预览")} className="mt-4 max-h-72 w-full rounded-md border border-slate-200 object-contain" src={node.snapshot.imageUrl} /> : null}</aside>;
}

function nextPosition(index: number) { return { x: 120 + (index % 4) * 280, y: 120 + Math.floor(index / 4) * 210 }; }
const iconButtonClass = "grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950";
const actionButtonClass = "flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950";
const skillDestinationRoutes: Record<string, string> = {
  "menswear-generate": "/tools/menswear/generate",
  "menswear-style-reference": "/tools/menswear/style-reference",
  "menswear-multi-outfit": "/tools/menswear/multi-outfit",
  "menswear-flatlay-outfit-split": "/tools/menswear/flatlay-outfit-split",
  "menswear-single-outfit": "/tools/menswear/single-outfit",
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

async function extractImageAccentColor(imageUrl: string) {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return resolve(null);
      context.drawImage(image, 0, 0, 1, 1);
      try {
        const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
        resolve(`#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`);
      } catch { resolve(null); }
    };
    image.onerror = () => resolve(null);
    image.src = imageUrl;
  });
}
