import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

type SearchResult = {
  url: string;
  title: string;
  description: string;
  markdown: string;
};

let geminiClient: GoogleGenAI | null = null;
function getGemini(apiKey: string) {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = z
          .object({
            query: z.string().trim().min(2).max(500),
            limit: z.number().int().min(1).max(10).default(5),
            apiKey: z.string().optional(),
          })
          .safeParse(await request.json());

        if (!parsed.success) {
          return Response.json({ error: "Invalid search request" }, { status: 400 });
        }

        const { query, limit, apiKey: clientApiKey } = parsed.data;
        const geminiKey = clientApiKey || process.env["GEMINI_API_KEY"];
        const firecrawlKey = process.env["FIRECRAWL_API_KEY"];

        // 1. Try Firecrawl if configured
        if (firecrawlKey) {
          try {
            const res = await fetch("https://api.firecrawl.dev/v2/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${firecrawlKey}`,
              },
              body: JSON.stringify({
                query,
                limit,
                scrapeOptions: { formats: ["markdown"] },
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                return Response.json({ results: data.data });
              }
            }
          } catch (e) {
            console.warn("Firecrawl search error, falling back to Google Search Grounding:", e);
          }
        }

        // 2. Primary / Robust Live Search: Gemini Google Search Grounding
        if (geminiKey) {
          try {
            const ai = getGemini(geminiKey);
            const response = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: `Perform a comprehensive live web search for: "${query}". Provide the top factual information, key figures, and context.`,
              config: {
                tools: [{ googleSearch: {} }],
                systemInstruction:
                  "You are a real-time web search crawler. Provide accurate, up-to-the-minute web information. Always be objective and data-driven.",
              },
            });

            const groundingChunks =
              response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const summaryText = response.text || "";

            // Synthesize search results from Google Search Grounding chunks
            const results: SearchResult[] = [];
            const seenUrls = new Set<string>();

            for (const chunk of groundingChunks as Array<{
              web?: { uri?: string; title?: string };
            }>) {
              const uri = chunk.web?.uri;
              const title = chunk.web?.title || "Search Result";
              if (uri && !seenUrls.has(uri)) {
                seenUrls.add(uri);
                results.push({
                  url: uri,
                  title,
                  description: `Live search result from ${new URL(uri).hostname}`,
                  markdown: summaryText.slice(0, 800),
                });
                if (results.length >= limit) break;
              }
            }

            // If no distinct URLs were parsed but text exists, provide an overarching live intelligence result
            if (results.length === 0 && summaryText) {
              results.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                title: `Live Search: ${query}`,
                description: "Live intelligence retrieved via Google Search Grounding",
                markdown: summaryText,
              });
            }

            return Response.json({ results, provider: "google-search-grounding" });
          } catch (geminiError) {
            console.error("Gemini Search Grounding error:", geminiError);
            return Response.json(
              {
                error:
                  geminiError instanceof Error ? geminiError.message : "Search service unavailable",
                results: [],
              },
              { status: 502 },
            );
          }
        }

        return Response.json(
          {
            error:
              "No API key configured for live web search. Please provide GEMINI_API_KEY in Settings.",
            results: [],
          },
          { status: 401 },
        );
      },
    },
  },
});
