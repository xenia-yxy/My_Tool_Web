import Link from "next/link";
import {
  ArrowRight,
  HardDrive,
  ImageIcon,
  KeyRound,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSignedInUser } from "@/server/auth";
import { canAccessAdmin } from "@/server/auth-permissions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireSignedInUser("/account");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link href="/">返回首页</Link>
          </Button>
          <LogoutButton />
        </div>

        <section>
          <Badge variant="secondary">已登录账号</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            用户中心
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            当前登录：{user.email || user.name || user.id}
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                <ImageIcon aria-hidden="true" className="h-5 w-5" />
              </div>
              <CardTitle>AI 工具</CardTitle>
              <CardDescription>
                使用 AI 自定义生图、穿搭生图和工具导航。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                className="inline-flex items-center text-sm font-medium text-blue-700"
                href="/tools"
              >
                进入工具
                <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                <UserRound aria-hidden="true" className="h-5 w-5" />
              </div>
              <CardTitle>账号安全</CardTitle>
              <CardDescription>
                登录已启用失败锁定、登录审计和 8 小时会话有效期。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center text-sm font-medium text-slate-500">
                <LogOut aria-hidden="true" className="mr-1 h-4 w-4" />
                可通过右上角退出登录
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700">
                <KeyRound aria-hidden="true" className="h-5 w-5" />
              </div>
              <CardTitle>模型配置</CardTitle>
              <CardDescription>
                保存自己的模型 API Key，并标记文本、视觉、生图等能力。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                className="inline-flex items-center text-sm font-medium text-violet-700"
                href="/account/models"
              >
                管理模型
                <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {canAccessAdmin(user.role) ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <UsersRound aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <CardTitle>用户管理</CardTitle>
                  <CardDescription>
                    创建、停用和维护网站登录账户。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    className="inline-flex items-center text-sm font-medium text-emerald-700"
                    href="/account/users"
                  >
                    管理用户
                    <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                    <HardDrive aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <CardTitle>图片清理</CardTitle>
                  <CardDescription>
                    统计和清理 OSS、画廊、素材、选品和本地残留图片。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    className="inline-flex items-center text-sm font-medium text-amber-700"
                    href="/account/storage"
                  >
                    进入清理中心
                    <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
