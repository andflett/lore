"use client";

import { Children, Fragment, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SearchSource } from "@/lib/types";
import { Divider } from "@/components/shared/Divider";

interface Props {
  content: string;
  sources: SearchSource[];
}

// Walks children, replacing inline [n] tokens in string nodes with citation links.
function linkify(children: ReactNode, sources: SearchSource[]): ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child !== "string") return child;
    const parts = child.split(/(\[\d+\])/);
    if (parts.length === 1) return child;
    return (
      <Fragment key={i}>
        {parts.map((part, j) => {
          const m = part.match(/^\[(\d+)\]$/);
          if (!m) return <Fragment key={j}>{part}</Fragment>;
          const idx = parseInt(m[1], 10);
          const source = sources.find((s) => s.index === idx);
          if (!source) return <Fragment key={j}>{part}</Fragment>;
          return (
            <a
              key={j}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={source.title}
              className="-mx-0.5 -my-1 inline-block px-1 py-1 align-super text-[10px] text-gold-text underline decoration-gold-b3 hover:text-gold-bright"
            >
              [{idx}]
            </a>
          );
        })}
      </Fragment>
    );
  });
}

// Themed markdown renderer tuned for chat-reply tone (not document layout):
// small headings, tight spacing, subtle accents, mobile-first sizes.
export function MarkdownAnswer({ content, sources }: Props) {
  const components: Components = {
    p: ({ children }) => (
      <p className="mb-2 leading-relaxed last:mb-0">
        {linkify(children, sources)}
      </p>
    ),
    // Demote heading hierarchy — chat answers shouldn't have document-scale titles.
    h1: ({ children }) => (
      <h3 className="font-ui mt-3 mb-1 text-[12px] uppercase tracking-[0.16em] text-gold-text">
        {linkify(children, sources)}
      </h3>
    ),
    h2: ({ children }) => (
      <h3 className="font-ui mt-3 mb-1 text-[11px] uppercase tracking-[0.14em] text-gold-text">
        {linkify(children, sources)}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-3 mb-1 text-[14px] font-semibold text-text-t3">
        {linkify(children, sources)}
      </h4>
    ),
    h4: ({ children }) => (
      <h4 className="mt-2 mb-1 text-[14px] font-semibold text-text-t3">
        {linkify(children, sources)}
      </h4>
    ),
    h5: ({ children }) => (
      <p className="mt-2 mb-1 text-[14px] font-semibold text-text-t3">
        {linkify(children, sources)}
      </p>
    ),
    h6: ({ children }) => (
      <p className="mt-2 mb-1 text-[14px] font-semibold text-text-t3">
        {linkify(children, sources)}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-2 list-disc space-y-0.5 pl-5 marker:text-gold-b3 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-0.5 pl-5 marker:text-gold-b3 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">{linkify(children, sources)}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-text-t3">
        {linkify(children, sources)}
      </strong>
    ),
    em: ({ children }) => <em className="italic">{linkify(children, sources)}</em>,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold-text underline decoration-gold-b3 hover:text-gold-bright"
      >
        {children}
      </a>
    ),
    code: ({ children, className }) => {
      const isBlock = (className ?? "").startsWith("language-");
      if (isBlock) {
        return (
          <code className={`${className} block`}>{children}</code>
        );
      }
      return (
        <code className="border border-gold-b1 bg-stone-s0 px-1 py-px font-mono text-[12px] text-text-t3">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-2 overflow-x-auto border border-gold-b1 bg-stone-s0 p-2 font-mono text-[12px] text-text-t2">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-2 border-l-2 border-gold-b2 pl-3 italic text-text-t0">
        {children}
      </blockquote>
    ),
    hr: () => (
      <div className="my-3">
        <Divider color="var(--color-gold-b1)" />
      </div>
    ),
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gold-b1 bg-stone-s1 px-2 py-1 text-left font-ui text-[10px] uppercase tracking-[0.1em] text-gold-text">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gold-b1 px-2 py-1 align-top text-text-t1">
        {linkify(children, sources)}
      </td>
    ),
  };

  return (
    <div className="text-[14px] text-text-t1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
