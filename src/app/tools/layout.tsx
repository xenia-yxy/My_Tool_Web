import type { ReactNode } from "react";
import { WorkspaceFrame } from "@/components/tools/workspace-shell";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const user = await requireSignedInUser("/tools");

  return (
    <WorkspaceFrame userLabel={user.name || user.email || "Xenia"}>
      {children}
    </WorkspaceFrame>
  );
}
