import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Strict, allow-listed Markdown renderer.
 *
 * Deliberately not a Markdown library and deliberately never
 * `dangerouslySetInnerHTML`. It parses a small, known subset into React
 * elements, so user-supplied text cannot inject markup no matter what it
 * contains. Anything it does not recognise renders as plain text.
 *
 * Supported: ## and ### headings, - bullets, 1. numbered lists, > quotes,
 * --- rules, `code`, **bold**, and paragraphs.
 */

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "rule" };

function parse(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbered: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushBullets = () => {
    if (bullets.length > 0) {
      blocks.push({ type: "bullets", items: bullets });
      bullets = [];
    }
  };
  const flushNumbered = () => {
    if (numbered.length > 0) {
      blocks.push({ type: "numbered", items: numbered });
      numbered = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushNumbered();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushAll();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushAll();
      blocks.push({ type: "rule" });
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      blocks.push({
        type: "heading",
        level: heading[1]!.length === 2 ? 2 : 3,
        text: heading[2] ?? "",
      });
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      flushNumbered();
      bullets.push(bullet[1] ?? "");
      continue;
    }

    const numberedItem = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numberedItem) {
      flushParagraph();
      flushBullets();
      numbered.push(numberedItem[1] ?? "");
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushAll();
      blocks.push({ type: "quote", text: quote[1] ?? "" });
      continue;
    }

    flushBullets();
    flushNumbered();
    paragraph.push(line.trim());
  }

  flushAll();
  return blocks;
}

/** Inline formatting: **bold** and `code`. Everything else stays literal. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${index}`} className="font-medium text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${index}`}
          className="rounded border border-line bg-surface px-1 py-0.5 font-mono text-[0.9em] text-faint"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = match.index + token.length;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownView({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = React.useMemo(() => parse(content), [content]);

  if (blocks.length === 0) {
    return <p className={cn("text-[13px] text-faint", className)}>Nothing written yet.</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={i} className="mt-6 text-[15px] font-medium text-ink first:mt-0">
                {renderInline(block.text, `h${i}`)}
              </h2>
            ) : (
              <h3 key={i} className="mt-5 text-[13.5px] font-medium text-ink first:mt-0">
                {renderInline(block.text, `h${i}`)}
              </h3>
            );
          case "bullets":
            return (
              <ul key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                    <span>{renderInline(item, `b${i}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "numbered":
            return (
              <ol key={i} className="space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-muted">
                    <span className="w-4 shrink-0 tabular text-faint">{j + 1}.</span>
                    <span>{renderInline(item, `n${i}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-accent-line pl-3.5 text-[13px] italic leading-relaxed text-muted"
              >
                {renderInline(block.text, `q${i}`)}
              </blockquote>
            );
          case "rule":
            return <hr key={i} className="border-line" />;
          default:
            return (
              <p key={i} className="text-[13px] leading-relaxed text-muted">
                {renderInline(block.text, `p${i}`)}
              </p>
            );
        }
      })}
    </div>
  );
}
