export type ContentAssetStatus = "PRIVATE" | "PUBLISHED";

type ContentAssetFormInput = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content: string;
};

export function makeSlug(value: string, fallbackSeed = Date.now().toString()) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `content-${fallbackSeed}`;
}

export function normalizeContentAssetInput(input: ContentAssetFormInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  const slugSource = input.slug?.trim() || title;
  const excerpt = input.excerpt?.trim() || null;

  if (!title) {
    throw new Error("标题不能为空");
  }

  if (!content) {
    throw new Error("正文不能为空");
  }

  return {
    title,
    slug: makeSlug(slugSource),
    excerpt,
    content,
  };
}

export function resolvePublication(
  status: ContentAssetStatus,
  currentPublishedAt: Date | null,
  now = new Date(),
) {
  if (status === "PUBLISHED") {
    return {
      status,
      publishedAt: currentPublishedAt ?? now,
    };
  }

  return {
    status,
    publishedAt: null,
  };
}
