export function normalizeAdminIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function buildAdminCredentialWhere(value: string) {
  const identifier = normalizeAdminIdentifier(value);

  return {
    OR: [{ email: identifier }, { name: identifier }],
  };
}
