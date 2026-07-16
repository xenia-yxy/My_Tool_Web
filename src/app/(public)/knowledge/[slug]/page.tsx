import Link from "next/link";
import { MarkdownPreview } from "@/components/content/markdown-preview";
import { getPublishedContentAssetBySlug } from "@/server/content-queries";
import { requireSignedInUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type KnowledgeArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function KnowledgeArticlePage({
  params,
}: KnowledgeArticlePageProps) {
  const { slug } = await params;
  await requireSignedInUser(`/knowledge/${slug}`);
  const note = await getPublishedContentAssetBySlug(slug);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link className="text-sm text-blue-700" href="/knowledge">
        返回知识库
      </Link>

      <article className="mt-8">
        <p className="text-sm font-medium text-slate-500">
          {formatDate(note.publishedAt)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
          {note.title}
        </h1>
        {note.excerpt ? (
          <p className="mt-5 text-lg leading-8 text-slate-600">{note.excerpt}</p>
        ) : null}

        <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <MarkdownPreview content={note.content} />
        </div>
      </article>
    </main>
  );
}
