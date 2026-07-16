type AppRole = "ADMIN" | "USER";

export function canAccessAdmin(role?: string | null) {
  return role === "ADMIN";
}

export function canUseMemberTools(role?: string | null) {
  return role === "ADMIN" || role === "USER";
}

export type { AppRole };
