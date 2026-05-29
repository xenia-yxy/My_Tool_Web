export type ContentAssetStatus = "PRIVATE" | "PUBLISHED";
export type ContentAssetFilter = "ALL" | ContentAssetStatus;

type ContentAssetStatusSummaryItem = {
  status: ContentAssetStatus;
};

type ContentAssetFormInput = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content: string;
};

export function normalizeContentAssetFilter(
  value?: string | string[],
): ContentAssetFilter {
  const status = Array.isArray(value) ? value[0] : value;

  if (status === "PRIVATE" || status === "PUBLISHED") {
    return status;
  }

  return "ALL";
}

export function normalizeContentAssetQuery(value?: string | string[]) {
  const query = (Array.isArray(value) ? value[0] : value)?.trim();

  return query || undefined;
}

export function summarizeContentAssetStats(
  assets: ContentAssetStatusSummaryItem[],
) {
  return assets.reduce(
    (stats, asset) => {
      stats.total += 1;

      if (asset.status === "PUBLISHED") {
        stats.published += 1;
      } else {
        stats.private += 1;
      }

      return stats;
    },
    {
      total: 0,
      private: 0,
      published: 0,
    },
  );
}

export function getPublishedContentAssetHref(asset: {
  slug: string;
  status: ContentAssetStatus;
}) {
  return asset.status === "PUBLISHED" ? `/knowledge/${asset.slug}` : null;
}

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
