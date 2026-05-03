import { fetchDataFromLastFm } from "@/lib/lastfm";
import { normalizeList } from "@/lib/lastfm-helpers";

export async function fetchArtistDetailData({
  apiKey,
  username,
  artistName,
}) {
  const personalizationParams =
    username.trim().length > 0 ? { username: username.trim() } : {};
  const [
    artistInfoResponse,
    topTracksResponse,
    topAlbumsResponse,
    similarResponse,
  ] = await Promise.all([
    fetchDataFromLastFm(
      "artist.getInfo",
      {
        artist: artistName,
        autocorrect: 1,
        ...personalizationParams,
      },
      apiKey,
    ),
    fetchDataFromLastFm(
      "artist.getTopTracks",
      { artist: artistName, limit: 15, autocorrect: 1 },
      apiKey,
    ),
    fetchDataFromLastFm(
      "artist.getTopAlbums",
      { artist: artistName, limit: 8, autocorrect: 1 },
      apiKey,
    ),
    fetchDataFromLastFm(
      "artist.getSimilar",
      { artist: artistName, limit: 12, autocorrect: 1 },
      apiKey,
    ),
  ]);

  const artistRecord = artistInfoResponse.artist;
  if (!artistRecord) throw new Error("Artist not found");

  return {
    artist: artistRecord,
    topTracks: normalizeList(topTracksResponse.toptracks?.track),
    topAlbums: normalizeList(topAlbumsResponse.topalbums?.album),
    similar: normalizeList(similarResponse.similarartists?.artist),
  };
}
