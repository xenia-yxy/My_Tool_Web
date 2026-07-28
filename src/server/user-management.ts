import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/password";

export type ManagedUserRole = "ADMIN" | "USER";

type ManagedUserInput = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
  disabled?: unknown;
};

export function normalizeManagedUserCreateInput(input: ManagedUserInput) {
  const username = normalizeUsername(input.username);
  const email = normalizeOptionalEmail(input.email);
  const password = normalizePassword(input.password, true);
  const role = normalizeRole(input.role) || "USER";

  return { username, email, password, role };
}

export function normalizeManagedUserUpdateInput(input: ManagedUserInput) {
  const result: {
    username?: string;
    email?: string | null;
    password?: string;
    role?: ManagedUserRole;
    disabled?: boolean;
  } = {};

  if (input.username !== undefined) result.username = normalizeUsername(input.username);
  if (input.email !== undefined) result.email = normalizeOptionalEmail(input.email);
  if (input.password !== undefined && readTrimmedString(input.password)) {
    result.password = normalizePassword(input.password, false);
  }
  if (input.role !== undefined) result.role = normalizeRole(input.role, true);
  if (input.disabled !== undefined) {
    if (typeof input.disabled !== "boolean") throw new Error("账户状态无效");
    result.disabled = input.disabled;
  }

  if (Object.keys(result).length === 0) {
    throw new Error("没有可更新的账户内容");
  }

  return result;
}

export function assertAdminAccountChangeIsSafe(input: {
  currentRole: ManagedUserRole;
  enabledAdminCount: number;
  nextRole: ManagedUserRole;
  nextDisabled: boolean;
}) {
  const removesEnabledAdmin =
    input.currentRole === "ADMIN" &&
    (input.nextRole !== "ADMIN" || input.nextDisabled);

  if (removesEnabledAdmin && input.enabledAdminCount <= 1) {
    throw new Error("至少保留一个启用的管理员");
  }
}

export async function listManagedUsers() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map((user) => ({
    ...user,
    username: user.name || "",
    disabled: Boolean(user.disabledAt),
    disabledAt: user.disabledAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

export async function createManagedUser(input: ManagedUserInput) {
  const normalized = normalizeManagedUserCreateInput(input);
  await assertIdentifiersAvailable(normalized.username, normalized.email);

  const user = await prisma.user.create({
    data: {
      name: normalized.username,
      email: normalized.email,
      passwordHash: await hashPassword(normalized.password),
      role: normalized.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return {
    ...user,
    username: user.name || "",
    createdAt: user.createdAt.toISOString(),
  };
}

export async function updateManagedUser(id: string, input: ManagedUserInput) {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) throw new Error("用户不存在");

  const normalized = normalizeManagedUserUpdateInput(input);
  const nextRole = normalized.role || (current.role as ManagedUserRole);
  const nextDisabled = normalized.disabled ?? Boolean(current.disabledAt);

  if (nextRole !== current.role || nextDisabled !== Boolean(current.disabledAt)) {
    const enabledAdminCount = await prisma.user.count({
      where: { role: "ADMIN", disabledAt: null },
    });
    assertAdminAccountChangeIsSafe({
      currentRole: current.role as ManagedUserRole,
      enabledAdminCount,
      nextRole,
      nextDisabled,
    });
  }

  if (normalized.username || normalized.email !== undefined) {
    await assertIdentifiersAvailable(normalized.username, normalized.email, id);
  }

  const invalidatesSession =
    Boolean(normalized.password) ||
    normalized.disabled !== undefined ||
    normalized.role !== undefined;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(normalized.username ? { name: normalized.username } : {}),
      ...(normalized.email !== undefined ? { email: normalized.email } : {}),
      ...(normalized.role ? { role: normalized.role } : {}),
      ...(normalized.disabled !== undefined
        ? { disabledAt: normalized.disabled ? new Date() : null }
        : {}),
      ...(normalized.password
        ? {
            passwordHash: await hashPassword(normalized.password),
            passwordChangedAt: new Date(),
          }
        : {}),
      ...(invalidatesSession ? { authVersion: { increment: 1 } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      lastLoginAt: true,
      updatedAt: true,
    },
  });

  return {
    ...user,
    username: user.name || "",
    disabled: Boolean(user.disabledAt),
    disabledAt: user.disabledAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function assertIdentifiersAvailable(
  username?: string,
  email?: string | null,
  excludeId?: string,
) {
  const clauses = [
    ...(username ? [{ name: username }] : []),
    ...(email ? [{ email }] : []),
  ];
  if (clauses.length === 0) return;

  const existing = await prisma.user.findFirst({
    where: {
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      OR: clauses,
    },
    select: { id: true },
  });

  if (existing) throw new Error("账号或邮箱已存在");
}

function normalizeUsername(value: unknown) {
  const username = readTrimmedString(value).toLowerCase();
  if (username.length < 3 || username.length > 40 || /\s/.test(username)) {
    throw new Error("账号需为 3-40 位，且不能包含空格");
  }
  return username;
}

function normalizeOptionalEmail(value: unknown) {
  const email = readTrimmedString(value).toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("邮箱格式不正确");
  }
  return email;
}

function normalizePassword(value: unknown, required: boolean) {
  const password = readTrimmedString(value);
  if (!password && required) throw new Error("密码不能为空");
  if (password.length < 8) throw new Error("密码至少 8 位");
  return password;
}

function normalizeRole(value: unknown, required = false): ManagedUserRole | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) throw new Error("角色无效");
    return undefined;
  }
  if (value === "ADMIN" || value === "USER") return value;
  throw new Error("角色无效");
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
