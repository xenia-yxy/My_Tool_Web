type LoginRedirectTargetInput = {
  callbackUrl?: string | null;
  resultUrl?: string | null;
  defaultUrl?: string;
};

function isSafeRelativePath(value?: string | null): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export function resolveLoginRedirectTarget({
  callbackUrl,
  resultUrl,
  defaultUrl = "/account",
}: LoginRedirectTargetInput) {
  if (isSafeRelativePath(callbackUrl)) {
    return callbackUrl;
  }

  if (resultUrl) {
    return resultUrl;
  }

  return defaultUrl;
}
