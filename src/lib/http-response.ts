export async function readJsonResponse<T = Record<string, unknown>>(
  response: Response,
): Promise<T | Record<string, never>> {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {};
  }
}
