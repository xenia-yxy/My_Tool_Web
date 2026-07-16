export const maxFailedLoginAttempts = 5;
export const lockoutMinutes = 15;
export const adminSessionMaxAgeSeconds = 8 * 60 * 60;

export type PasswordPolicyResult = {
  ok: boolean;
  errors: string[];
};

type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>
  | undefined;

export function validateAdminPasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("密码至少需要 12 位");
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const classCount = [hasLowercase, hasUppercase, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;

  if (classCount < 3) {
    errors.push("密码需要包含大小写字母、数字、符号中的至少三类");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertAdminPasswordPolicy(password: string) {
  const result = validateAdminPasswordPolicy(password);

  if (!result.ok) {
    throw new Error(`管理员密码不符合安全策略：${result.errors.join("；")}`);
  }
}

export function buildFailedLoginUpdate(
  currentFailedLoginCount: number,
  now = new Date(),
) {
  const failedLoginCount = currentFailedLoginCount + 1;
  const lockedUntil =
    failedLoginCount >= maxFailedLoginAttempts
      ? new Date(now.getTime() + lockoutMinutes * 60 * 1000)
      : null;

  return {
    failedLoginCount,
    lockedUntil,
  };
}

export function isAccountLocked(
  lockedUntil: Date | null | undefined,
  now = new Date(),
) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}

export function getClientIpFromHeaders(headers: HeaderSource) {
  if (!headers) {
    return null;
  }

  const forwardedFor = getHeaderValue(headers, "x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  if (forwardedFor) {
    return forwardedFor;
  }

  return getHeaderValue(headers, "x-real-ip")?.trim() || null;
}

export function getUserAgentFromHeaders(headers: HeaderSource) {
  if (!headers) {
    return null;
  }

  return getHeaderValue(headers, "user-agent")?.slice(0, 500) || null;
}

function getHeaderValue(headers: Exclude<HeaderSource, undefined>, key: string) {
  if (headers instanceof Headers) {
    return headers.get(key) || undefined;
  }

  const value = headers[key] ?? headers[key.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function isSafeAuthRedirect(url: string, baseUrl: string) {
  if (url.startsWith("/")) {
    return !url.startsWith("//");
  }

  try {
    const target = new URL(url);
    const base = new URL(baseUrl);

    return target.origin === base.origin;
  } catch {
    return false;
  }
}
