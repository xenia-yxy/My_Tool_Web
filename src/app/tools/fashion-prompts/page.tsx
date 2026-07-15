import { redirect } from "next/navigation";
import { resolveFashionPromptsRedirectTarget } from "@/lib/fashion-prompts-routing";

export const dynamic = "force-dynamic";

export default function FashionPromptsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  redirect(resolveFashionPromptsRedirectTarget(searchParams?.tab));
}
