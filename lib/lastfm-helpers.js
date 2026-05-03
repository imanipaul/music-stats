/** Last.fm API often returns a single object instead of an array — normalize to []. */
export function normalizeList(items) {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export function decodeSlug(encoded) {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}
