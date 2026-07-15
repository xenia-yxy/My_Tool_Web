import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolHistoryLink({ toolId }: { toolId: string }) {
  return (
    <Button asChild className="h-9 w-9 px-0" title="历史记录" type="button" variant="secondary">
      <Link aria-label="历史记录" href={`/tools/history/${toolId}`}>
        <History aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Button>
  );
}
