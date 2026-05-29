import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminPlaceholderProps = {
  title: string;
  description: string;
  nextStep: string;
};

export function AdminPlaceholder({
  title,
  description,
  nextStep,
}: AdminPlaceholderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-blue-700">模块占位</p>
      <h2 className="mt-3 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        {nextStep}
      </div>
      <Button asChild className="mt-6" variant="secondary">
        <Link href="/admin/content">
          先回到内容资产
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  );
}
