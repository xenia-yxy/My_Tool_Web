"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FileText, Images, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FloatingAgent } from "@/components/agent/floating-agent";
import {
  getAllNavItemsFlat,
  getActiveGroupId,
  getActiveNavId,
  navGroups,
  overviewNav,
  type NavGroup,
} from "@/components/tools/nav-config";
import { PromptEditorDialog } from "@/components/tools/prompt-editor-dialog";
import { ToolHistoryLink } from "@/components/tools/tool-history-link";
import { useWorkbenchSession } from "@/components/tools/workbench-session-client";
import {
  buildWorkbenchPrompt,
  getWorkbenchToolForPathname,
  type WorkbenchSessionStatus,
  type WorkbenchToolId,
} from "@/lib/workbench-sessions";
import { Button } from "@/components/ui/button";

type WorkspaceShellProps = {
  active?: string;
  children: ReactNode;
  description: string;
  title: string;
  userLabel: string;
};

type WorkspaceFrameProps = {
  children: ReactNode;
  userLabel: string;
};

export function WorkspacePageHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <header className="mb-5 overflow-visible rounded-2xl border border-slate-200 bg-white/86 p-4 shadow-sm backdrop-blur-xl sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-700">Xenia Tools</p>
          <h1 className="mt-2 break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700 [&_*]:!text-white"
          href="/tools/image-gallery"
        >
          <Images className="h-4 w-4 text-white" />
          <span className="text-white">图片画廊</span>
        </Link>
      </div>
    </header>
  );
}

export function WorkspaceFrame({
  children,
  userLabel,
}: WorkspaceFrameProps) {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);
  const activeGroupId = getActiveGroupId(pathname);
  const currentTool = getWorkbenchToolForPathname(pathname);

  // 分组展开状态：默认展开当前所在组，总览页展开全部
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const group of navGroups) {
        initial[group.id] = activeGroupId ? group.id === activeGroupId : true;
      }
      return initial;
    },
  );

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  // 当前所在组始终强制展开
  function isGroupExpanded(groupId: string): boolean {
    if (groupId === activeGroupId) {
      return true;
    }
    return expandedGroups[groupId] ?? false;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-100/80 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1500px] gap-5 px-4 pb-5 pt-7 lg:grid-cols-[236px_1fr] lg:px-6 lg:py-5">
        <aside className="sticky top-5 hidden h-[calc(100dvh-2.5rem)] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white/86 p-3 shadow-sm backdrop-blur-xl lg:flex">
          <Link className="flex items-center gap-2 px-2 py-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-950">
                Xenia Tools
              </span>
              <span className="block truncate text-xs text-slate-500">
                {userLabel}
              </span>
            </span>
          </Link>

          <nav aria-label="工具导航" className="mt-3 grid gap-1">
            {/* 总览入口（独立项） */}
            <NavLink
              href={overviewNav.href}
              icon={overviewNav.icon}
              isSelected={activeNavId === overviewNav.id}
              label={overviewNav.label}
            />

            {/* 分组折叠菜单 */}
            {navGroups.map((group) => (
              <NavGroupSection
                group={group}
                activeNavId={activeNavId}
                expanded={isGroupExpanded(group.id)}
                onToggle={() => toggleGroup(group.id)}
                key={group.id}
              />
            ))}
          </nav>
        </aside>

        <section className="min-w-0 pb-28">
          <MobileWorkspaceNav active={activeNavId} />
          {currentTool ? <WorkspacePageActions toolId={currentTool.id} toolLabel={currentTool.label} /> : null}
          {children}
        </section>
      </div>
      <FloatingAgent />
    </main>
  );
}

function WorkspacePageActions({
  toolId,
  toolLabel,
}: {
  toolId: WorkbenchToolId;
  toolLabel: string;
}) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const { create, persist, session } = useWorkbenchSession(toolId);

  function openPrompt() {
    setPromptDraft(session?.prompt || buildPromptFromVisibleFields(toolLabel));
    setPromptOpen(true);
  }

  async function savePrompt(prompt: string) {
    if (session) {
      await persist({ prompt });
      return;
    }

    await create({
      title: `${toolLabel} 工作记录`,
      status: "DRAFT",
      prompt,
      inputSnapshot: {},
      outputSnapshot: {},
      imageAssetIds: [],
      externalJobId: null,
      errorMessage: null,
    });
  }

  return (
    <div className="mb-4 grid gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        <Button className="gap-2" onClick={openPrompt} type="button" variant="secondary">
          <FileText aria-hidden="true" className="h-4 w-4" />
          工作记录提示词
        </Button>
        <ToolHistoryLink toolId={toolId} />
        <PromptEditorDialog
          description="用于保存当前页面的工作记录。实际生图提示词请在生成前的“确认生图提示词”窗口中编辑。"
          onClose={() => setPromptOpen(false)}
          onSave={savePrompt}
          open={promptOpen}
          prompt={promptDraft}
        />
      </div>
      {session ? <RestoredSessionStatus session={session} /> : null}
    </div>
  );
}

function RestoredSessionStatus({
  session,
}: {
  session: NonNullable<ReturnType<typeof useWorkbenchSession>["session"]>;
}) {
  const output = session.outputSnapshot;
  const imageUrls = Array.isArray(output.imageUrls)
    ? output.imageUrls.filter((item): item is string => typeof item === "string")
    : typeof output.imageUrl === "string" && output.imageUrl
      ? [output.imageUrl]
      : [];
  const summary = typeof output.summary === "string" ? output.summary : "";

  if (session.status === "DRAFT" && !summary && imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/86 px-3 py-2 text-sm shadow-sm">
      <div className="min-w-0">
        <span className="font-semibold text-slate-800">
          {sessionStatusLabel(session.status)}
        </span>
        <span className="ml-2 text-slate-500">
          {summary || session.title}
        </span>
      </div>
      {imageUrls.length > 0 ? (
        <div className="flex shrink-0 gap-2">
          {imageUrls.slice(0, 4).map((imageUrl, index) => (
            <img
              alt={`恢复的生成图片 ${index + 1}`}
              className="h-10 w-10 rounded-md border border-slate-200 object-cover"
              key={`${imageUrl}-${index}`}
              src={imageUrl}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function sessionStatusLabel(status: WorkbenchSessionStatus) {
  if (status === "RUNNING") return "生成中";
  if (status === "SUCCEEDED") return "已完成";
  if (status === "FAILED") return "失败";
  return "草稿";
}

function buildPromptFromVisibleFields(toolLabel: string) {
  const fields = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "textarea, input, select",
    ),
  )
    .filter((field): field is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => {
      if (field instanceof HTMLInputElement && ["file", "hidden", "checkbox", "radio"].includes(field.type)) {
        return false;
      }
      return Boolean(field.value.trim());
    })
    .map((field) => ({
      label:
        field.closest("label")?.innerText.split("\n")[0]?.trim() ||
        field.getAttribute("aria-label") ||
        field.name ||
        "参数",
      value: field.value,
    }));

  return buildWorkbenchPrompt(toolLabel, fields);
}

export function WorkspaceShell({
  children,
  description,
  title,
  userLabel,
}: WorkspaceShellProps) {
  return (
    <WorkspaceFrame userLabel={userLabel}>
      <WorkspacePageHeader description={description} title={title} />
      {children}
    </WorkspaceFrame>
  );
}

function NavGroupSection({
  group,
  activeNavId,
  expanded,
  onToggle,
}: {
  group: NavGroup;
  activeNavId: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const GroupIcon = group.icon;
  const hasActiveChild = group.items.some(
    (item) => item.id === activeNavId,
  );

  return (
    <div className="grid gap-0.5">
      <button
        aria-expanded={expanded}
        aria-label={`${expanded ? "折叠" : "展开"} ${group.label} 分组`}
        className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
          hasActiveChild
            ? "text-slate-950"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
        }`}
        onClick={onToggle}
        type="button"
      >
        <GroupIcon aria-hidden="true" className="h-4 w-4" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded ? (
        <div className="grid gap-0.5 pl-4">
          {group.items.map((item) => (
            <NavLink
              href={item.href}
              icon={item.icon}
              isSelected={item.id === activeNavId}
              key={item.id}
              label={item.label}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  isSelected,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  isSelected: boolean;
  label: string;
}) {
  return (
    <Link
      className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
        isSelected
          ? "border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
      href={href}
    >
      <Icon aria-hidden={true} className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MobileWorkspaceNav({ active }: { active: string | null }) {
  const flatItems = getAllNavItemsFlat();

  return (
    <nav
      aria-label="移动工具导航"
      className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/86 p-2 shadow-sm backdrop-blur-xl lg:hidden"
    >
      {flatItems.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;

        return (
          <Link
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
              selected
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950"
            }`}
            href={item.href}
            key={item.id}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
