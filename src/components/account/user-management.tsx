"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import useSWR from "swr";
import { KeyRound, Loader2, Pencil, Power, UserPlus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ManagedUser = {
  id: string;
  username: string;
  email: string | null;
  role: "ADMIN" | "USER";
  disabled: boolean;
  lastLoginAt: string | null;
};

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "USER" as ManagedUser["role"],
  disabled: false,
};

async function fetchUsers(url: string) {
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as {
    users?: ManagedUser[];
    error?: string;
  };

  if (!response.ok) throw new Error(payload.error || "用户列表加载失败");
  return { users: payload.users || [] };
}

export function UserManagement() {
  const { data, error: loadError, isLoading, mutate } = useSWR(
    "/api/account/users",
    fetchUsers,
  );
  const users = data?.users || [];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    const response = await fetch(
      editingId ? `/api/account/users/${editingId}` : "/api/account/users",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      user?: ManagedUser;
      error?: string;
    };
    setIsSaving(false);

    if (!response.ok || !payload.user) {
      setError(payload.error || "用户保存失败");
      return;
    }

    await mutate(
      editingId
        ? {
            users: users.map((item) =>
              item.id === payload.user?.id ? payload.user : item,
            ),
          }
        : { users: [...users, payload.user] },
      false,
    );
    setNotice(editingId ? "用户已更新" : "用户已创建，请安全地告知对方初始密码");
    resetForm();
  }

  function editUser(user: ManagedUser) {
    setError("");
    setNotice("");
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email || "",
      password: "",
      role: user.role,
      disabled: user.disabled,
    });
  }

  async function setDisabled(user: ManagedUser, disabled: boolean) {
    setError("");
    const response = await fetch(`/api/account/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      user?: ManagedUser;
      error?: string;
    };

    if (!response.ok || !payload.user) {
      setError(payload.error || "账户状态更新失败");
      return;
    }

    await mutate(
      {
        users: users.map((item) =>
          item.id === payload.user?.id ? payload.user : item,
        ),
      },
      false,
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,390px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "编辑用户" : "创建用户"}</CardTitle>
          <CardDescription>
            {editingId
              ? "留空密码即可保留原密码；填写新密码会使该账户重新登录。"
              : "默认创建普通用户，可按需要提升为管理员。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="登录账号" onChange={(username) => setForm((current) => ({ ...current, username }))} placeholder="例如：studio.user" value={form.username} />
            <Field label="邮箱（可选）" onChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="user@example.com" required={false} type="email" value={form.email} />
            <Field label={editingId ? "重置密码（留空不修改）" : "初始密码"} onChange={(password) => setForm((current) => ({ ...current, password }))} placeholder="至少 8 位" required={!editingId} type="password" value={form.password} />
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">角色</span>
              <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as ManagedUser["role"] }))} value={form.role}>
                <option value="USER">普通用户</option>
                <option value="ADMIN">管理员</option>
              </select>
            </label>
            {editingId ? <label className="flex items-center gap-2 text-sm text-slate-700"><input checked={form.disabled} onChange={(event) => setForm((current) => ({ ...current, disabled: event.target.checked }))} type="checkbox" />停用此账户</label> : null}
            {error || loadError ? <Message tone="error">{error || (loadError instanceof Error ? loadError.message : "用户列表加载失败")}</Message> : null}
            {notice ? <Message tone="success">{notice}</Message> : null}
            <div className="flex flex-wrap gap-2">
              <Button className="h-11 gap-2" disabled={isSaving} type="submit">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {editingId ? "保存修改" : "创建账户"}
              </Button>
              {editingId ? <Button className="h-11" onClick={resetForm} type="button" variant="secondary"><X className="mr-2 h-4 w-4" />取消</Button> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>可登录用户</CardTitle>
          <CardDescription>不会显示用户密码。停用和密码重置会使既有登录状态失效。</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />加载中</div> : null}
          {!isLoading && users.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">暂无用户</p> : null}
          <div className="grid gap-3">
            {users.map((user) => <article className="rounded-lg border border-slate-200 bg-white p-4" key={user.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{user.username}</h3><Badge variant={user.role === "ADMIN" ? "success" : "secondary"}>{user.role === "ADMIN" ? "管理员" : "普通用户"}</Badge><Badge variant={user.disabled ? "secondary" : "success"}>{user.disabled ? "已停用" : "启用"}</Badge></div>
                  <p className="mt-2 text-sm text-slate-600">{user.email || "未设置邮箱"}</p>
                  <p className="mt-1 text-xs text-slate-500">最近登录：{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => editUser(user)} type="button" variant="secondary"><Pencil className="mr-2 h-4 w-4" />编辑</Button>
                  <Button onClick={() => void setDisabled(user, !user.disabled)} type="button" variant="secondary"><Power className="mr-2 h-4 w-4" />{user.disabled ? "启用" : "停用"}</Button>
                </div>
              </div>
            </article>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, onChange, placeholder, required = true, type = "text", value }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string; value: string }) {
  return <label className="grid gap-2"><span className="text-sm font-medium text-slate-700">{label}</span><input className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} type={type} value={value} /></label>;
}

function Message({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return <p className={tone === "error" ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"}>{children}</p>;
}
