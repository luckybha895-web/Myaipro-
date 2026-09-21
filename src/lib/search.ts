export type SearchResult = {
  url: string;
  title: string;
  markdown: string;
};

export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export function formatContext(results: SearchResult[]): string {
  if (results.length === 0) return "";
  return (
    "\n\nWEB SEARCH CONTEXT:\n" +
    results
      .map((r) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.markdown.slice(0, 1000)}`)
      .join("\n---\n")
  );
}
