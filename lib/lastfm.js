const API_BASE = "https://ws.audioscrobbler.com/2.0/";

export async function lfm(method, params, apiKey) {
  const p = new URLSearchParams({
    method,
    api_key: apiKey,
    format: "json",
    ...params,
  });
  const r = await fetch(`${API_BASE}?${p}`);
  const d = await r.json();
  if (d.error) throw new Error(d.message || `API error ${d.error}`);
  return d;
}

export function timeAgo(uts) {
  const diff = Math.floor(Date.now() / 1000) - parseInt(uts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
