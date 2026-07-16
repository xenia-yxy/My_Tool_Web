export type FashionPromptsLegacyTab = "general" | "menswear" | "womenswear";

export function resolveFashionPromptsRedirectTarget(
  tab?: string,
): "/tools/menswear" | "/tools/womenswear" {
  return tab === "womenswear" ? "/tools/womenswear" : "/tools/menswear";
}
