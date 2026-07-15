const defaultUserCallbackPath = "/account";

export function normalizeUserCallbackPath(
  input?: string | string[],
  fallback = defaultUserCallbackPath,
) {
  const value = Array.isArray(input) ? input[0] : input;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function buildUserLoginHref(targetPath: string) {
  const callbackUrl = normalizeUserCallbackPath(targetPath);

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
