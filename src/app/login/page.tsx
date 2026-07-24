import { redirect } from "next/navigation";
import { getAppSession } from "@/server/auth";
import { normalizeUserCallbackPath } from "@/server/user-auth-redirects";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAppSession();
  const params = await searchParams;
  const callbackUrl = normalizeUserCallbackPath(params?.callbackUrl, "/account");

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  redirect(`/?login=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
