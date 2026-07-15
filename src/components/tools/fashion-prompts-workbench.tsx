"use client";

import { useState } from "react";
import { OutfitPromptWorkbench } from "@/components/tools/outfit-prompt-workbench";

type FashionPromptsTab = "general" | "menswear" | "womenswear";

type FashionPromptsWorkbenchProps = {
  initialTab: FashionPromptsTab;
};

type TabConfig = {
  id: FashionPromptsTab;
  label: string;
  fixedGender: "men" | "women" | undefined;
};

const tabs: TabConfig[] = [
  { id: "general", label: "通用", fixedGender: undefined },
  { id: "menswear", label: "男装", fixedGender: "men" },
  { id: "womenswear", label: "女装", fixedGender: "women" },
];

export function FashionPromptsWorkbench({
  initialTab,
}: FashionPromptsWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<FashionPromptsTab>(initialTab);

  const currentTab =
    tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="grid gap-5">
      {/* Tab 切换栏 */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              aria-pressed={isActive}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 当前 Tab 的提示词工作台，key 变化触发重新挂载保证状态隔离 */}
      <OutfitPromptWorkbench
        fixedGender={currentTab.fixedGender}
        key={currentTab.id}
      />
    </div>
  );
}
