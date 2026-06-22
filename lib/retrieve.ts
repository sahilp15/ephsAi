import type { KnowledgeEntry } from "./knowledge";

/**
 * Knowledge retrieval seam.
 *
 * MVP strategy: DIRECT CONTEXT INJECTION. The entire knowledge base is small
 * enough to fit in the model's context window, so we inject everything and let
 * the model find the relevant parts. This stub simply returns all entries.
 *
 * TODO (scaling seam): if the knowledge base ever grows beyond ~400K tokens,
 * implement a cheap keyword/relevance pre-filter here (e.g. score entries by
 * query-term overlap against topic + body, return the top-N) BEFORE injection.
 * This is also the natural place to later swap in embeddings / a vector store
 * without touching the chat route — keep the signature stable.
 */
export interface Retriever {
  selectRelevant(query: string, entries: KnowledgeEntry[]): KnowledgeEntry[];
}

export const passthroughRetriever: Retriever = {
  selectRelevant(_query, entries) {
    // Currently returns ALL files. See TODO above for the keyword-filter upgrade.
    return entries;
  },
};

/** Convenience wrapper used by the chat route. */
export function selectRelevant(
  query: string,
  entries: KnowledgeEntry[],
): KnowledgeEntry[] {
  return passthroughRetriever.selectRelevant(query, entries);
}
