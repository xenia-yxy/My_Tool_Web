"use client";

import { Copy, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillEditor, type EditableSkill } from "@/components/creative-center/skill-editor";

type SkillRecord = {
  id: string;
  ownerType: "SYSTEM" | "CUSTOM";
  name: string;
  category: string;
  enabled: boolean;
  versions: Array<{ id: string; version: number; config: EditableSkill }>;
};

export function SkillManager({ initialSkillId, openCreateOnLoad = false }: { initialSkillId?: string; openCreateOnLoad?: boolean }) {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const [editing, setEditing] = useState<SkillRecord | null>(null);
  const [creating, setCreating] = useState(openCreateOnLoad);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSkills() {
    setLoading(true);
    try {
      const response = await fetch("/api/tools/creative-skills?includeDisabled=true", { cache: "no-store" });
      const payload = await response.json() as { skills?: SkillRecord[]; error?: string };
      if (!response.ok || !payload.skills) throw new Error(payload.error || "读取 Skill 失败");
      setSkills(payload.skills);
      if (initialSkillId) setEditing(payload.skills.find((skill) => skill.id === initialSkillId) ?? null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "读取 Skill 失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSkills(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleSkills = useMemo(() => skills.filter((skill) => {
    const matchesQuery = `${skill.name} ${skill.category}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (filter === "ALL" || skill.ownerType === filter);
  }), [filter, query, skills]);

  async function saveSkill(value: EditableSkill) {
    setSaving(true);
    try {
      const isEditing = Boolean(editing?.id && editing.ownerType === "CUSTOM");
      const response = await fetch(isEditing ? `/api/tools/creative-skills/${editing!.id}` : "/api/tools/creative-skills", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "保存 Skill 失败");
      setCreating(false);
      setEditing(null);
      await loadSkills();
    } finally {
      setSaving(false);
    }
  }

  async function toggleSkill(skill: SkillRecord) {
    const response = await fetch(`/api/tools/creative-skills/${skill.id}/toggle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !skill.enabled }) });
    if (response.ok) await loadSkills();
  }

  async function deleteSkill(skill: SkillRecord) {
    if (!window.confirm(`删除“${skill.name}”后，历史画布仍会保留当时的版本快照。确认删除吗？`)) return;
    const response = await fetch(`/api/tools/creative-skills/${skill.id}`, { method: "DELETE" });
    if (response.ok) await loadSkills();
  }

  const editorValue = editing?.versions[0]?.config;
  if (creating || editing) {
    return <Card><CardHeader><CardTitle>{editing ? "编辑 Skill" : "新建 Skill"}</CardTitle><CardDescription>保存后会生成可在创作画布中调用的版本。</CardDescription></CardHeader><CardContent><SkillEditor initialValue={editorValue} onCancel={() => { setCreating(false); setEditing(null); }} onSave={saveSkill} saving={saving} /></CardContent></Card>;
  }

  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative min-w-60 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="搜索 Skill" value={query} /></div><select aria-label="Skill 类型筛选" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" onChange={(event) => setFilter(event.target.value as typeof filter)} value={filter}><option value="ALL">全部类型</option><option value="SYSTEM">系统 Skill</option><option value="CUSTOM">自定义 Skill</option></select><Button asChild className="gap-2"><Link href="/tools/creative-center/skills/new"><Plus aria-hidden="true" className="h-4 w-4" />新建 Skill</Link></Button></div>
    {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    {loading ? <p className="text-sm text-slate-500">正在读取 Skill...</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleSkills.map((skill) => <Card key={skill.id} className={!skill.enabled ? "opacity-60" : ""}><CardHeader><div className="flex items-center justify-between gap-2"><Badge variant={skill.ownerType === "SYSTEM" ? "secondary" : "success"}>{skill.ownerType === "SYSTEM" ? "系统" : "自定义"}</Badge><span className="text-xs text-slate-500">v{skill.versions[0]?.version ?? 1}</span></div><CardTitle className="text-lg">{skill.name}</CardTitle><CardDescription>{skill.category}</CardDescription></CardHeader><CardContent><p className="min-h-10 text-sm leading-5 text-slate-600">{skill.versions[0]?.config.description || "暂无说明"}</p><div className="mt-4 flex flex-wrap justify-end gap-1"><Button asChild size="icon" title="查看 Skill" variant="ghost"><Link aria-label={`查看 ${skill.name}`} href={`/tools/creative-center/skills/${skill.id}`}><Pencil aria-hidden="true" className="h-4 w-4" /></Link></Button>{skill.ownerType === "CUSTOM" ? <><Button aria-label={skill.enabled ? `停用 ${skill.name}` : `启用 ${skill.name}`} onClick={() => void toggleSkill(skill)} size="icon" title={skill.enabled ? "停用" : "启用"} type="button" variant="ghost">{skill.enabled ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}</Button><Button aria-label={`复制 ${skill.name}`} onClick={() => { setCreating(true); setEditing({ ...skill, id: undefined }); }} size="icon" title="复制为自定义 Skill" type="button" variant="ghost"><Copy aria-hidden="true" className="h-4 w-4" /></Button><Button aria-label={`删除 ${skill.name}`} onClick={() => void deleteSkill(skill)} size="icon" title="删除" type="button" variant="ghost"><Trash2 aria-hidden="true" className="h-4 w-4 text-red-600" /></Button></> : <Button aria-label={`复制 ${skill.name}`} onClick={() => { setCreating(true); setEditing(skill); }} size="icon" title="复制为自定义 Skill" type="button" variant="ghost"><Copy aria-hidden="true" className="h-4 w-4" /></Button>}</div></CardContent></Card>)}</div>}
  </div>;
}
