import { assertAdminPasswordPolicy } from "@/server/admin-login-security";

export type SeedAccount = {
  email: string;
  username: string;
  password: string;
  role: "ADMIN" | "USER";
};

type EnvSource = Record<string, string | undefined>;

export function readAdminSeedAccounts(env: EnvSource = process.env): SeedAccount[] {
  const jsonAccounts = readJsonAccounts(env.ADMIN_ACCOUNTS_JSON);

  if (jsonAccounts.length > 0) {
    return jsonAccounts;
  }

  const numberedAccounts = readNumberedAccounts(env);

  if (numberedAccounts.length > 0) {
    return numberedAccounts;
  }

  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const username = env.ADMIN_USERNAME?.trim().toLowerCase() || "yangxinyu";
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seed.");
  }

  return [
    {
      email,
      username,
      password,
      role: "ADMIN",
    },
  ];
}

export function readUserSeedAccounts(env: EnvSource = process.env): SeedAccount[] {
  const accounts: SeedAccount[] = [];

  for (const index of [1, 2, 3]) {
    const email = env[`USER_${index}_EMAIL`];
    const username = env[`USER_${index}_USERNAME`];
    const password = env[`USER_${index}_PASSWORD`];
    const hasAnyValue = email || username || password;

    if (!hasAnyValue) {
      continue;
    }

    accounts.push({
      ...normalizeAccount(
        email,
        username,
        password,
        `USER_${index}_EMAIL, USER_${index}_USERNAME and USER_${index}_PASSWORD`,
      ),
      role: "USER",
    });
  }

  return accounts;
}

function readJsonAccounts(value: string | undefined): SeedAccount[] {
  if (!value?.trim()) {
    return [];
  }

  const parsed = JSON.parse(value) as Array<{
    email?: string;
    username?: string;
    password?: string;
  }>;

  if (!Array.isArray(parsed)) {
    throw new Error("ADMIN_ACCOUNTS_JSON must be an array.");
  }

  return parsed.map((account, index) =>
    ({
      ...normalizeAccount(
        account.email,
        account.username,
        account.password,
        `ADMIN_ACCOUNTS_JSON[${index}]`,
      ),
      role: "ADMIN" as const,
    }),
  );
}

function readNumberedAccounts(env: EnvSource): SeedAccount[] {
  const accounts: SeedAccount[] = [];

  for (const index of [1, 2, 3]) {
    const email = env[`ADMIN_${index}_EMAIL`];
    const username = env[`ADMIN_${index}_USERNAME`];
    const password = env[`ADMIN_${index}_PASSWORD`];
    const hasAnyValue = email || username || password;

    if (!hasAnyValue) {
      continue;
    }

    accounts.push({
      ...normalizeAccount(
        email,
        username,
        password,
        `ADMIN_${index}_EMAIL, ADMIN_${index}_USERNAME and ADMIN_${index}_PASSWORD`,
      ),
      role: "ADMIN",
    });
  }

  return accounts;
}

function normalizeAccount(
  emailValue: string | undefined,
  usernameValue: string | undefined,
  passwordValue: string | undefined,
  label: string,
) {
  const email = emailValue?.trim().toLowerCase();
  const username = usernameValue?.trim().toLowerCase();
  const password = passwordValue;

  if (!email || !username || !password) {
    throw new Error(`${label} are required.`);
  }

  assertAdminPasswordPolicy(password);

  return {
    email,
    username,
    password,
  };
}
