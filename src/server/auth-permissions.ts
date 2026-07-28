type AppRole = "ADMIN" | "USER";

export function canAccessAdmin(role?: string | null) {
  return role === "ADMIN";
}

export function canUseMemberTools(role?: string | null) {
  return role === "ADMIN" || role === "USER";
}

export function canUseActiveSession(
  user: { disabledAt: Date | null; authVersion: number },
  sessionAuthVersion?: number,
) {
  return !user.disabledAt && user.authVersion === sessionAuthVersion;
}

export type { AppRole };
