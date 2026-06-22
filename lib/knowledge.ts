import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Valid knowledge categories. */
export type KnowledgeCategory =
  | "academics"
  | "schedule"
  | "staff"
  | "clubs"
  | "logistics"
  | "support"
  | "college";

/** A single parsed knowledge-base entry. */
export interface KnowledgeEntry {
  topic: string;
  category: KnowledgeCategory | string;
  sourceUrl: string;
  lastUpdated: string;
  /** Markdown body (plain-language EPHS info). */
  body: string;
  /** Relative path, useful for debugging / future retrieval. */
  filePath: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

let cachedEntries: KnowledgeEntry[] | null = null;

/** Recursively collect every `*.md` file under /knowledge (skips README.md). */
function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdownFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      entry.name.toLowerCase() !== "readme.md"
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Read and parse every `knowledge/**​/*.md` file. Cached in memory after the
 * first call (the KB is static at runtime in this MVP).
 */
export function loadKnowledge(): KnowledgeEntry[] {
  if (cachedEntries) return cachedEntries;

  const files = walkMarkdownFiles(KNOWLEDGE_DIR);
  const entries: KnowledgeEntry[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    entries.push({
      topic: String(data.topic ?? path.basename(file, ".md")),
      category: String(data.category ?? "logistics"),
      sourceUrl: String(data.source_url ?? ""),
      lastUpdated: String(data.last_updated ?? ""),
      body: content.trim(),
      filePath: path.relative(process.cwd(), file),
    });
  }

  cachedEntries = entries.sort((a, b) => a.topic.localeCompare(b.topic));
  return cachedEntries;
}

/**
 * Assemble a single grounding-context string from the given entries. Each block
 * carries the topic + source_url so the model can cite the official page.
 */
export function buildKnowledgeContext(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) {
    return "(The EPHS Knowledge Base is currently empty.)";
  }
  return entries
    .map((e) => {
      const source = e.sourceUrl ? `Source: ${e.sourceUrl}` : "Source: (none provided)";
      return [
        `### ${e.topic}`,
        `Category: ${e.category}`,
        source,
        e.lastUpdated ? `Last updated: ${e.lastUpdated}` : "",
        "",
        e.body,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

/** Distinct, non-empty source URLs across entries (for the UI "Sources" row). */
export function collectSourceUrls(entries: KnowledgeEntry[]): string[] {
  return Array.from(
    new Set(entries.map((e) => e.sourceUrl).filter((u) => u.length > 0)),
  );
}
