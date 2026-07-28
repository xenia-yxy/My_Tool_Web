import Link from "next/link";
import { UsersRound } from "lucide-react";
import { UserManagement } from "@/components/account/user-management";
import { Button } from "@/components/ui/button";
import { requireAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountUsersPage() {
  await requireAdminUser();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <Button asChild className="w-fit" variant="secondary">
          <Link href="/account">返回用户中心</Link>
        </Button>
        <section>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <UsersRound aria-hidden="true" className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            用户管理
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            创建和维护可登录账户。停用或重置密码后，该账户当前会话会立即失效。
          </p>
        </section>
        <UserManagement />
      </div>
    </main>
  );
}
