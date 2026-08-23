"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

function InlineCode({ children }: { children?: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
}

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="group relative">
      <button
        onClick={copy}
        className="absolute -top-1 right-0 hidden items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 sm:inline-flex"
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-none prose-code:font-mono prose-a:text-primary">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const value = String(children).replace(/\n$/, "");
              return match ? (
                <CodeBlock language={match[1]} value={value} />
              ) : (
                <InlineCode {...props}>{children}</InlineCode>
              );
            },
            pre({ children }: any) {
              return <div className="not-prose">{children}</div>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});