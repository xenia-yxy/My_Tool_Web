import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildUserLoginHref } from "@/server/user-auth-redirects";

type ToolPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export function ToolPageHeader({
  backHref = "/tools",
  backLabel = "返回工具",
}: ToolPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button asChild className="w-fit" variant="secondary">
        <Link href={backHref}>
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <Link
        className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
        href={buildUserLoginHref(backHref)}
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        登录
      </Link>
    </div>
  );
}
