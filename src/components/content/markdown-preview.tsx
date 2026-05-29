import ReactMarkdown from "react-markdown";

type MarkdownPreviewProps = {
  content: string;
};

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
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
      {content}
    </ReactMarkdown>
  );
}
