import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const algorithm = "aes-256-gcm";
const version = "v1";

function deriveKey(secret: string) {
  if (!secret.trim()) {
    throw new Error("缺少 API Key 加密密钥");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    version,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptApiKey(encryptedValue: string, secret: string) {
  try {
    const [storedVersion, ivText, tagText, encryptedText] =
      encryptedValue.split(":");

    if (storedVersion !== version || !ivText || !tagText || !encryptedText) {
      throw new Error("unsupported encrypted API key format");
    }

    const decipher = createDecipheriv(
      algorithm,
      deriveKey(secret),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("API Key 解密失败");
  }
}

export function maskApiKey(apiKey: string) {
  if (apiKey.length < 12) {
    return "已配置";
  }

  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
