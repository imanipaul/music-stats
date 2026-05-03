import { getImg, isPlaceholderLastFmImage } from "@/lib/utils";
import { fetchDataFromLastFm } from "@/lib/lastfm";
import { normalizeList } from "@/lib/lastfm-helpers";

export const DASHBOARD_PERIODS = [
  { label: "7 days", value: "7day" },
  { label: "1 month", value: "1month" },
  { label: "6 months", value: "6month" },
  { label: "1 year", value: "12month" },
  { label: "all time", value: "overall" },
];

function trackArtistName(track) {
  return track?.artist?.name ?? track?.artist?.["#text"] ?? "";
}

async function enrichTopTracksWithAlbumArt(tracks, apiKey, username) {
  const list = Array.isArray(tracks) ? tracks : [tracks];
  return Promise.all(
    list.map(async (track) => {
      const existing = getImg(track.image, "small");
      if (existing && !isPlaceholderLastFmImage(existing)) return track;
      const artistName = trackArtistName(track);
      if (!artistName || !track.name) return track;
      try {
        const trackInfoResponse = await fetchDataFromLastFm(
          "track.getInfo",
          {
            artist: artistName,
            track: track.name,
            username,
            autocorrect: 1,
          },
          apiKey,
        );
        const album = trackInfoResponse.track?.album;
        const artFromAlbum = album?.image ? getImg(album.image, "small") : "";
        if (artFromAlbum && !isPlaceholderLastFmImage(artFromAlbum)) {
          return { ...track, image: album.image };
        }
      } catch {
        /* ignore */
      }
      return track;
    }),
  );
}

async function enrichTopArtistsWithImages(artists, apiKey, username) {
  const list = Array.isArray(artists) ? artists : [artists];
  return Promise.all(
    list.map(async (artist) => {
      const existing = getImg(artist.image, "medium");
      if (existing && !isPlaceholderLastFmImage(existing)) return artist;
      try {
        const artistInfoResponse = await fetchDataFromLastFm(
          "artist.getInfo",
          {
            artist: artist.name,
            autocorrect: 1,
            ...(username.trim() ? { username } : {}),
          },
          apiKey,
        );
        const artistImages = artistInfoResponse.artist?.image;
        const imageUrl = artistImages ? getImg(artistImages, "medium") : "";
        if (imageUrl && !isPlaceholderLastFmImage(imageUrl)) {
          return { ...artist, image: artistImages };
        }
      } catch {
        /* ignore */
      }
      return artist;
    }),
  );
}

export async function loadDashboardData(apiKey, username, period) {
  const [
    topArtistsResponse,
    topTracksResponse,
    topAlbumsResponse,
    recentTracksResponse,
    userInfoResponse,
  ] = await Promise.all([
    fetchDataFromLastFm(
      "user.gettopartists",
      { user: username, period, limit: 10 },
      apiKey,
    ),
    fetchDataFromLastFm(
      "user.gettoptracks",
      { user: username, period, limit: 10 },
      apiKey,
    ),
    fetchDataFromLastFm(
      "user.gettopalbums",
      { user: username, period, limit: 10 },
      apiKey,
    ),
    fetchDataFromLastFm(
      "user.getrecenttracks",
      { user: username, limit: 200 },
      apiKey,
    ),
    fetchDataFromLastFm("user.getinfo", { user: username }, apiKey),
  ]);

  const userProfile = userInfoResponse.user;
  if (!userProfile) {
    throw new Error(
      "Last.fm did not return user info — check username and API key.",
    );
  }
  const recent = normalizeList(recentTracksResponse.recenttracks?.track);

  const tracksList = normalizeList(topTracksResponse.toptracks?.track);
  const tracks = await enrichTopTracksWithAlbumArt(
    tracksList,
    apiKey,
    username,
  );

  const artistsList = normalizeList(topArtistsResponse.topartists?.artist);
  const artists = await enrichTopArtistsWithImages(
    artistsList,
    apiKey,
    username,
  );

  const albums = normalizeList(topAlbumsResponse.topalbums?.album);

  return {
    info: userProfile,
    artists,
    artistsTotal: topArtistsResponse.topartists?.["@attr"]?.total ?? "0",
    tracks,
    tracksTotal: topTracksResponse.toptracks?.["@attr"]?.total ?? "0",
    albums,
    albumsTotal: topAlbumsResponse.topalbums?.["@attr"]?.total ?? "0",
    recent,
    successMessage: `loaded for ${userProfile.name} · ${parseInt(userProfile.playcount).toLocaleString()} total scrobbles`,
  };
}

/** Chart.js `data` for the listening trend bar chart from recent tracks. */
export function buildListeningTrendChartData(recent) {
  const buckets = {};
  const recentTracks = Array.isArray(recent) ? recent : [];
  recentTracks.forEach((recentTrack) => {
    if (!recentTrack.date) return;
    const trackDate = new Date(parseInt(recentTrack.date.uts) * 1000);
    const dayKey = `${trackDate.getFullYear()}-${String(trackDate.getMonth() + 1).padStart(2, "0")}-${String(trackDate.getDate()).padStart(2, "0")}`;
    buckets[dayKey] = (buckets[dayKey] || 0) + 1;
  });
  const sortedDayKeys = Object.keys(buckets).sort().slice(-14);
  return {
    labels: sortedDayKeys.map((isoDay) => {
      const labelDate = new Date(isoDay + "T12:00:00");
      return labelDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        data: sortedDayKeys.map((dayKey) => buckets[dayKey]),
        backgroundColor: "rgba(155,93,229,0.5)",
        borderColor: "#9b5de5",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
}

export const LISTENING_TREND_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1f1f26",
      titleColor: "#f0eff4",
      bodyColor: "#7b7a87",
      borderColor: "rgba(255,255,255,0.07)",
      borderWidth: 1,
      callbacks: {
        label: (chartContext) => `${chartContext.parsed.y} scrobbles`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "#7b7a87", font: { family: "DM Mono", size: 10 } },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "#7b7a87", font: { family: "DM Mono", size: 10 } },
    },
  },
};

export function dashboardStatusTone(type) {
  if (type === "error")
    return { border: "border-red-400/20", text: "text-red-400" };
  if (type === "ok")
    return { border: "border-green-400/20", text: "text-green-400" };
  return { border: "border-white/[0.07]", text: "text-amber-400" };
}
