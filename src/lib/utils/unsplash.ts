const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function getImageUrl(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    return null;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    // Use small size for cards (400px wide)
    return photo.urls?.small || photo.urls?.regular || null;
  } catch {
    return null;
  }
}

export async function getImageUrls(
  queries: string[]
): Promise<(string | null)[]> {
  return Promise.all(queries.map((q) => getImageUrl(q)));
}
