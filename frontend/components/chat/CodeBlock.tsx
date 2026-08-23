"use client";

import { CodeBlock as AstryxCodeBlock } from "@astryxdesign/core/CodeBlock";

export function CodeBlock({ language, value }: { language: string; value: string }) {
  return <AstryxCodeBlock code={value} language={language || "text"} hasCopyButton hasLanguageLabel isWrapped width="100%" />;
}