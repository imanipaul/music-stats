const API_BASE = "https://ws.audioscrobbler.com/2.0/";

export async function fetchDataFromLastFm(method, params, apiKey) {
  const urlParams = new URLSearchParams({
    method,
    api_key: apiKey,
    format: "json",
    ...params,
  });
  const response = await fetch(`${API_BASE}?${urlParams}`);
  const payload = await response.json();
  if (payload.error)
    throw new Error(payload.message || `API error ${payload.error}`);
  return payload;
}

export function timeAgo(unixTimestampSeconds) {
  const secondsElapsed =
    Math.floor(Date.now() / 1000) - parseInt(unixTimestampSeconds);
  if (secondsElapsed < 60) return `${secondsElapsed}s ago`;
  if (secondsElapsed < 3600)
    return `${Math.floor(secondsElapsed / 60)}m ago`;
  if (secondsElapsed < 86400)
    return `${Math.floor(secondsElapsed / 3600)}h ago`;
  return `${Math.floor(secondsElapsed / 86400)}d ago`;
}
