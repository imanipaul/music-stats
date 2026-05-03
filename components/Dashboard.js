"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { getImg, isPlaceholderLastFmImage } from "@/lib/utils";
import { lfm, timeAgo } from "@/lib/lastfm";
import { artistPath, albumPath } from "@/lib/routes";
import Avatar from "./Avatar";
import RankItem from "./RankItem";
import StatCard from "./StatCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const PERIODS = [
  { label: "7 days", value: "7day" },
  { label: "1 month", value: "1month" },
  { label: "6 months", value: "6month" },
  { label: "1 year", value: "12month" },
  { label: "all time", value: "overall" },
];

async function enrichTopTracksWithAlbumArt(tracks, apiKey, username) {
  const list = Array.isArray(tracks) ? tracks : [tracks];
  return Promise.all(
    list.map(async (t) => {
      const existing = getImg(t.image, "small");
      if (existing && !isPlaceholderLastFmImage(existing)) return t;
      try {
        const res = await lfm(
          "track.getInfo",
          {
            artist: t.artist.name,
            track: t.name,
            username,
            autocorrect: 1,
          },
          apiKey,
        );
        const album = res.track?.album;
        const fromAlbum = album?.image ? getImg(album.image, "small") : "";
        if (fromAlbum && !isPlaceholderLastFmImage(fromAlbum)) {
          return { ...t, image: album.image };
        }
      } catch {
        /* ignore */
      }
      return t;
    }),
  );
}

async function enrichTopArtistsWithImages(artists, apiKey, username) {
  const list = Array.isArray(artists) ? artists : [artists];
  return Promise.all(
    list.map(async (a) => {
      const existing = getImg(a.image, "medium");
      if (existing && !isPlaceholderLastFmImage(existing)) return a;
      try {
        const res = await lfm(
          "artist.getInfo",
          {
            artist: a.name,
            autocorrect: 1,
            ...(username.trim() ? { username } : {}),
          },
          apiKey,
        );
        const img = res.artist?.image;
        const url = img ? getImg(img, "medium") : "";
        if (url && !isPlaceholderLastFmImage(url)) {
          return { ...a, image: img };
        }
      } catch {
        /* ignore */
      }
      return a;
    }),
  );
}

export default function Dashboard() {
  const [apiKey, setApiKey] = useState(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("lfm_apikey")) ||
      "",
  );
  const [username, setUsername] = useState(
    () =>
      (typeof window !== "undefined" && localStorage.getItem("lfm_user")) || "",
  );
  const [period, setPeriod] = useState("7day");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (apiKey) localStorage.setItem("lfm_apikey", apiKey);
  }, [apiKey]);
  useEffect(() => {
    if (username) localStorage.setItem("lfm_user", username);
  }, [username]);

  async function loadData() {
    if (!apiKey.trim() || !username.trim()) {
      setStatus({ msg: "enter both api key and username", type: "error" });
      return;
    }
    setLoading(true);
    setStatus({ msg: "loading your listening data...", type: "loading" });
    try {
      const [artistsRes, tracksRes, albumsRes, recentRes, infoRes] =
        await Promise.all([
          lfm(
            "user.gettopartists",
            { user: username, period, limit: 10 },
            apiKey,
          ),
          lfm(
            "user.gettoptracks",
            { user: username, period, limit: 10 },
            apiKey,
          ),
          lfm(
            "user.gettopalbums",
            { user: username, period, limit: 10 },
            apiKey,
          ),
          lfm("user.getrecenttracks", { user: username, limit: 200 }, apiKey),
          lfm("user.getinfo", { user: username }, apiKey),
        ]);

      const info = infoRes.user;
      const recentRaw = recentRes.recenttracks?.track;
      const recent = recentRaw
        ? Array.isArray(recentRaw)
          ? recentRaw
          : [recentRaw]
        : [];

      const tracksRaw = tracksRes.toptracks?.track;
      const tracksList = tracksRaw
        ? Array.isArray(tracksRaw)
          ? tracksRaw
          : [tracksRaw]
        : [];
      const tracks = await enrichTopTracksWithAlbumArt(
        tracksList,
        apiKey,
        username,
      );

      const artistsRaw = artistsRes.topartists?.artist;
      const artistsList = artistsRaw
        ? Array.isArray(artistsRaw)
          ? artistsRaw
          : [artistsRaw]
        : [];
      const artists = await enrichTopArtistsWithImages(
        artistsList,
        apiKey,
        username,
      );

      const albumsRaw = albumsRes.topalbums?.album;
      const albums = albumsRaw
        ? Array.isArray(albumsRaw)
          ? albumsRaw
          : [albumsRaw]
        : [];

      setData({
        info,
        artists,
        artistsTotal: artistsRes.topartists?.["@attr"]?.total ?? "0",
        tracks,
        tracksTotal: tracksRes.toptracks?.["@attr"]?.total ?? "0",
        albums,
        albumsTotal: albumsRes.topalbums?.["@attr"]?.total ?? "0",
        recent,
      });
      setStatus({
        msg: `loaded for ${info.name} · ${parseInt(info.playcount).toLocaleString()} total scrobbles`,
        type: "ok",
      });
    } catch (e) {
      setStatus({ msg: "error: " + e.message, type: "error" });
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") loadData();
  }

  useEffect(() => {
    if (data) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const trendData = (() => {
    if (!data) return null;
    const buckets = {};
    data.recent.forEach((t) => {
      if (!t.date) return;
      const d = new Date(parseInt(t.date.uts) * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const sorted = Object.keys(buckets).sort().slice(-14);
    return {
      labels: sorted.map((d) => {
        const dt = new Date(d + "T12:00:00");
        return dt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          data: sorted.map((k) => buckets[k]),
          backgroundColor: "rgba(155,93,229,0.5)",
          borderColor: "#9b5de5",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  })();

  const chartOptions = {
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
        callbacks: { label: (ctx) => `${ctx.parsed.y} scrobbles` },
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

  const statusBorder =
    status?.type === "error"
      ? "border-red-400/20"
      : status?.type === "ok"
        ? "border-green-400/20"
        : "border-white/[0.07]";
  const statusText =
    status?.type === "error"
      ? "text-red-400"
      : status?.type === "ok"
        ? "text-green-400"
        : "text-amber-400";

  return (
    <div className="min-h-screen bg-[#0a0a0b] font-mono text-[#f0eff4]">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b5de5]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <div className="font-sans text-lg font-bold">scrobble.stats</div>
              <div className="text-[11px] text-[#7b7a87]">
                powered by last.fm
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-white/[0.12] bg-[#111114] px-[1.1rem] py-[0.85rem]">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={handleKey}
              placeholder="api key"
              type="password"
              className="w-[180px] rounded-lg border border-white/[0.07] bg-[#1f1f26] px-[11px] py-[7px] font-mono text-xs text-[#f0eff4] outline-none placeholder:text-[#504f5c]"
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder="username"
              className="w-[130px] rounded-lg border border-white/[0.07] bg-[#1f1f26] px-[11px] py-[7px] font-mono text-xs text-[#f0eff4] outline-none placeholder:text-[#504f5c]"
            />
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="rounded-lg border-none bg-[#9b5de5] px-3.5 py-[7px] font-mono text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "loading..." : "load →"}
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-[10px] border bg-[#111114] px-4 py-2.5 text-xs ${statusBorder} ${statusText}`}
          >
            {status.msg}
          </div>
        )}

        <div className="mb-8 flex w-fit gap-1 rounded-[10px] border border-white/[0.07] bg-[#111114] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`cursor-pointer rounded-[7px] border-none px-3.5 py-1.5 font-mono text-[11px] ${
                period === p.value
                  ? "bg-[#3d2060] text-[#c8a8f0]"
                  : "bg-transparent text-[#7b7a87]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-4 text-[40px] opacity-30">♫</div>
            <div className="text-[13px] leading-relaxed text-[#7b7a87]">
              enter your last.fm api key and username to load your listening
              stats
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
              <StatCard
                label="scrobbles"
                value={parseInt(data.info.playcount).toLocaleString()}
                sub={`since ${new Date(parseInt(data.info.registered.unixtime) * 1000).getFullYear()}`}
              />
              <StatCard
                label="artists"
                value={parseInt(data.artistsTotal).toLocaleString()}
                sub="unique"
              />
              <StatCard
                label="albums"
                value={parseInt(data.albumsTotal).toLocaleString()}
                sub="unique"
              />
              <StatCard
                label="tracks"
                value={parseInt(data.tracksTotal).toLocaleString()}
                sub="unique"
              />
            </div>

            <div className="mb-8">
              <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                top artists
              </div>
              <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                {data.artists.slice(0, 8).map((a, i) => {
                  const max = Math.max(
                    ...data.artists.map((x) => parseInt(x.playcount)),
                  );
                  return (
                    <RankItem
                      key={a.name}
                      rank={i + 1}
                      img={getImg(a.image, "medium")}
                      round
                      name={a.name}
                      nameHref={artistPath(a.name)}
                      meta={`${parseInt(a.playcount).toLocaleString()} plays`}
                      plays={a.playcount}
                      barPct={Math.round((parseInt(a.playcount) / max) * 100)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                  top tracks
                </div>
                <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                  {data.tracks.slice(0, 8).map((t, i) => (
                    <RankItem
                      key={t.name + t.artist.name}
                      rank={i + 1}
                      img={getImg(t.image, "small", t.name)}
                      name={t.name}
                      meta={t.artist.name}
                      metaHref={artistPath(t.artist.name)}
                      plays={t.playcount}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                  top albums
                </div>
                <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                  {data.albums.slice(0, 8).map((a, i) => (
                    <RankItem
                      key={a.name + a.artist.name}
                      rank={i + 1}
                      img={getImg(a.image, "small")}
                      name={a.name}
                      nameHref={albumPath(a.artist.name, a.name)}
                      meta={a.artist.name}
                      metaHref={artistPath(a.artist.name)}
                      plays={a.playcount}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                listening trend
              </div>
              <div className="rounded-[14px] border border-white/[0.07] bg-[#0d0d10] p-5">
                <div className="h-[180px]">
                  {trendData && <Bar data={trendData} options={chartOptions} />}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                recent tracks
              </div>
              <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                {data.recent.slice(0, 12).map((t, i) => {
                  const nowPlaying = t["@attr"]?.nowplaying;
                  const artistName = t.artist["#text"];
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-5 py-[9px] ${
                        i < 11 ? "border-b border-white/[0.07]" : ""
                      }`}
                    >
                      <Avatar src={getImg(t.image, "small")} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-[13px] font-medium text-[#f0eff4]">
                          {t.name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-[#7b7a87]">
                          <Link
                            href={artistPath(artistName)}
                            className="hover:text-[#c8a8f0] hover:underline"
                          >
                            {artistName}
                          </Link>
                        </div>
                      </div>
                      {nowPlaying ? (
                        <span className="whitespace-nowrap rounded bg-[#9b5de5]/20 px-1.5 py-0.5 font-mono text-[9px] text-[#c8a8f0]">
                          now playing
                        </span>
                      ) : (
                        <span className="whitespace-nowrap font-mono text-[10px] text-[#504f5c]">
                          {t.date ? timeAgo(t.date.uts) : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
