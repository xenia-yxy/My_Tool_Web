import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPublishedContentAssetBySlug } from "@/server/content-queries";

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
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-8 text-2xl font-semibold text-slate-950">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-3 mt-8 text-xl font-semibold text-slate-950">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-6 text-lg font-semibold text-slate-950">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="my-4 text-base leading-8 text-slate-700">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-4 list-disc space-y-2 pl-6 text-base leading-8 text-slate-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 list-decimal space-y-2 pl-6 text-base leading-8 text-slate-700">
                  {children}
                </ol>
              ),
              code: ({ children }) => (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-900">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-5 border-l-4 border-blue-200 bg-blue-50/60 px-4 py-2 text-slate-700">
                  {children}
                </blockquote>
              ),
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
