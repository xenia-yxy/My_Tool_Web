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

  return `/?login=1&callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function removeUserLoginPromptQuery(search: string) {
  const params = new URLSearchParams(search);
  params.delete("login");
  const next = params.toString();

  return next ? `?${next}` : "";
}
