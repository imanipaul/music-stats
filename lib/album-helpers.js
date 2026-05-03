import { stripWikiHtml } from "@/lib/wiki";
import { normalizeList } from "@/lib/lastfm-helpers";

export function formatDurationSeconds(seconds) {
  const totalSeconds = parseInt(seconds, 10);
  if (Number.isNaN(totalSeconds) || totalSeconds <= 0) return "";
  const wholeMinutes = Math.floor(totalSeconds / 60);
  const remainderSeconds = totalSeconds % 60;
  return `${wholeMinutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

export function sortAlbumTracksByRank(tracksRaw) {
  return normalizeList(tracksRaw).sort((trackA, trackB) => {
    const rankA = parseInt(trackA["@attr"]?.rank || 0, 10);
    const rankB = parseInt(trackB["@attr"]?.rank || 0, 10);
    return rankA - rankB;
  });
}

export function getAlbumWikiText(album) {
  if (!album?.wiki) return "";
  if (album.wiki.content) return stripWikiHtml(album.wiki.content);
  if (album.wiki.summary) return stripWikiHtml(album.wiki.summary);
  return "";
}
