import { fetchDataFromLastFm } from "@/lib/lastfm";

export async function fetchAlbumDetailData({
  apiKey,
  username,
  artistName,
  albumName,
}) {
  const personalizationParams =
    username.trim().length > 0 ? { username: username.trim() } : {};
  const albumInfoResponse = await fetchDataFromLastFm(
    "album.getInfo",
    {
      artist: artistName,
      album: albumName,
      autocorrect: 1,
      ...personalizationParams,
    },
    apiKey,
  );

  const albumRecord = albumInfoResponse.album;
  if (!albumRecord) throw new Error("Album not found");
  return albumRecord;
}
