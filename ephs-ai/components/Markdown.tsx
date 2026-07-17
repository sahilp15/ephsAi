import type { ReactNode } from "react";

/**
 * Minimal markdown renderer for assistant replies. Supports exactly what the
 * assistant is instructed to produce: paragraphs, bullet and numbered lists,
 * small headings, **bold**, *italic*, and `code`. Renders React nodes only
 * (no HTML injection).
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Tokenize bold, italic, and code spans.
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  const parts = text.split(pattern);
  parts.forEach((part, i) => {
    if (!part) return;
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={key} className="font-semibold text-ep-charcoal">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-ep-bg px-1 py-0.5 font-mono text-[0.85em] text-ep-red-dark"
        >
          {part.slice(1, -1)}
        </code>,
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "h"; text: string };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let current: Block | null = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (trimmed === "") {
      flush();
      continue;
    }
    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    const heading = /^#{1,4}\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push({ type: "h", text: heading[1] ?? "" });
    } else if (bullet) {
      if (current?.type !== "ul") {
        flush();
        current = { type: "ul", items: [] };
      }
      current.items.push(bullet[1] ?? "");
    } else if (numbered) {
      if (current?.type !== "ol") {
        flush();
        current = { type: "ol", items: [] };
      }
      current.items.push(numbered[1] ?? "");
    } else {
      if (current?.type !== "p") {
        flush();
        current = { type: "p", lines: [] };
      }
      current.lines.push(trimmed);
    }
  }
  flush();
  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-ep-ink">
      {blocks.map((block, bi) => {
        if (block.type === "h") {
          return (
            <p
              key={bi}
              className="pt-1 font-display text-base font-bold uppercase tracking-wide text-ep-charcoal"
            >
              {renderInline(block.text, `h${bi}`)}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={bi} className="space-y-1.5 pl-1">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-[0.52em] h-1.5 w-2.5 shrink-0 skew-x-[-28deg] bg-ep-red"
                  />
                  <span>{renderInline(item, `u${bi}-${ii}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={bi} className="space-y-1.5 pl-1">
              {block.items.map((item, ii) => (
                <li key={ii} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs font-semibold text-ep-red">
                    {ii + 1}.
                  </span>
                  <span>{renderInline(item, `o${bi}-${ii}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={bi}>{renderInline(block.lines.join(" "), `p${bi}`)}</p>;
      })}
    </div>
  );
}
