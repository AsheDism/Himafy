const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Category slug → fallback image search keywords
const CATEGORY_FALLBACKS: Record<string, string> = {
  work: "office workspace",
  hobbies: "hobby leisure activity",
  romance: "couple date",
  housework: "home interior cozy",
  food: "delicious food restaurant",
  goals: "motivation achievement",
  personality: "mindfulness meditation",
  lifestyle: "lifestyle wellness",
};

// Track rate limit state to avoid wasting requests
let rateLimitedUntil = 0;

async function searchUnsplash(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  // Skip if we know we're rate limited
  if (Date.now() < rateLimitedUntil) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.warn(`[Unsplash] ${res.status} for "${query}" (remaining=${res.headers.get("x-ratelimit-remaining")})`);
      if (res.status === 403 || res.status === 429) {
        rateLimitedUntil = Date.now() + 5 * 60 * 1000;
        console.warn("[Unsplash] Rate limited — pausing for 5 minutes");
      }
      return null;
    }

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    return photo.urls?.small || photo.urls?.regular || null;
  } catch {
    return null;
  }
}

export async function getImageUrl(
  query: string,
  categorySlug?: string
): Promise<string | null> {
  // 1. Try the specific query (e.g. place name)
  const result = await searchUnsplash(query);
  if (result) return result;

  // 2. Fallback: try with category-based generic keywords
  if (categorySlug) {
    const fallbackQuery = CATEGORY_FALLBACKS[categorySlug];
    if (fallbackQuery) {
      const fallbackResult = await searchUnsplash(fallbackQuery);
      if (fallbackResult) return fallbackResult;
    }
  }

  // 3. Last resort: search with shorter keywords
  if (query) {
    const genericQuery = query.split(" ").slice(0, 2).join(" ");
    if (genericQuery !== query) {
      return searchUnsplash(genericQuery);
    }
  }

  return null;
}

export async function getImageUrls(
  queries: string[],
  categorySlug?: string
): Promise<(string | null)[]> {
  return Promise.all(queries.map((q) => getImageUrl(q, categorySlug)));
}
