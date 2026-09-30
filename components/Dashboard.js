"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { getImg } from "@/lib/utils";
import { timeAgo } from "@/lib/lastfm";
import { artistPath, albumPath } from "@/lib/routes";
import {
  DASHBOARD_PERIODS,
  loadDashboardData,
  buildListeningTrendChartData,
  LISTENING_TREND_CHART_OPTIONS,
  dashboardStatusTone,
} from "@/lib/dashboard";
import Avatar from "./Avatar";
import DashboardSkeleton from "./DashboardSkeleton";
import ListeningTrendChart from "./ListeningTrendChart";
import PeriodSelector from "./PeriodSelector";
import RankItem from "./RankItem";
import StatCard from "./StatCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function Dashboard() {
  // Initial state must match the server render (empty). Reading localStorage in
  // useState fails for client components: the initializer runs on the server
  // where window is undefined, so saved credentials never hydrate.
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [period, setPeriod] = useState("7day");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);

  const loadDataWith = useCallback(
    async (lastFmApiKey, lastFmUsername, dashboardPeriod) => {
      if (!lastFmApiKey.trim() || !lastFmUsername.trim()) {
        setStatus({ msg: "enter both api key and username", type: "error" });
        return;
      }
      setLoading(true);
      setStatus({ msg: "loading your listening data...", type: "loading" });
      try {
        const { successMessage, ...dashboardPayload } = await loadDashboardData(
          lastFmApiKey,
          lastFmUsername,
          dashboardPeriod,
        );
        setData(dashboardPayload);
        setStatus({ msg: successMessage, type: "ok" });
      } catch (error) {
        setStatus({ msg: "error: " + error.message, type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let storedApiKey = "";
    let storedUsername = "";
    try {
      storedApiKey = localStorage.getItem("lfm_apikey") || "";
      storedUsername =
        localStorage.getItem("lfm_user") ||
        localStorage.getItem("lmf_user") ||
        "";
    } catch {
      /* private mode / blocked storage */
    }
    setApiKey(storedApiKey);
    setUsername(storedUsername);
    if (storedApiKey.trim() && storedUsername.trim()) {
      void loadDataWith(storedApiKey, storedUsername, period);
    }
    // Mount-only: do not add `period` — changing period is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDataWith]);

  useEffect(() => {
    if (apiKey) localStorage.setItem("lfm_apikey", apiKey);
  }, [apiKey]);
  useEffect(() => {
    if (username) localStorage.setItem("lfm_user", username);
  }, [username]);

  async function loadData() {
    await loadDataWith(apiKey, username, period);
  }

  function handleKeyDown(keyboardEvent) {
    if (keyboardEvent.key === "Enter") loadData();
  }

  useEffect(() => {
    if (!data) return;
    void loadDataWith(apiKey, username, period);
    // Only refetch when the stats window changes; initial load is handled by hydrate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const trendData = data
    ? buildListeningTrendChartData(data.recent ?? [])
    : null;

  const tone = dashboardStatusTone(status?.type);

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
              onChange={(changeEvent) => setApiKey(changeEvent.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="api key"
              type="password"
              className="w-[180px] rounded-lg border border-white/[0.07] bg-[#1f1f26] px-[11px] py-[7px] font-mono text-xs text-[#f0eff4] outline-none placeholder:text-[#504f5c]"
            />
            <input
              value={username}
              onChange={(changeEvent) => setUsername(changeEvent.target.value)}
              onKeyDown={handleKeyDown}
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
            className={`mb-6 rounded-[10px] border bg-[#111114] px-4 py-2.5 text-xs ${tone.border} ${tone.text}`}
          >
            {status.msg}
          </div>
        )}

        <PeriodSelector
          periods={DASHBOARD_PERIODS}
          value={period}
          onChange={setPeriod}
        />

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-4 text-[40px] opacity-30">♫</div>
            <div className="text-[13px] leading-relaxed text-[#7b7a87]">
              enter your last.fm api key and username to load your listening
              stats
            </div>
          </div>
        )}

        {loading && <DashboardSkeleton />}

        {data && !loading && (
          <>
            <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
              
              <StatCard
                label="artists"
                value={parseInt(data.artistsTotal).toLocaleString()}
                subtitle="unique"
              />
              <StatCard
                label="albums"
                value={parseInt(data.albumsTotal).toLocaleString()}
                subtitle="unique"
              />
              <StatCard
                label="tracks"
                value={parseInt(data.tracksTotal).toLocaleString()}
                subtitle="unique"
              />
            </div>

            <div className="mb-8">
              <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                top artists
              </div>
              <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                {data.artists.slice(0, 8).map((topArtist, rankIndex) => {
                  const playcounts = data.artists.map((artistEntry) =>
                    parseInt(artistEntry.playcount, 10),
                  );
                  const maxPlaycount =
                    playcounts.length > 0 ? Math.max(...playcounts) : 1;
                  return (
                    <RankItem
                      key={topArtist.name}
                      rank={rankIndex + 1}
                      img={getImg(topArtist.image, "medium")}
                      round
                      name={topArtist.name}
                      nameHref={artistPath(topArtist.name)}
                      meta={`${parseInt(topArtist.playcount).toLocaleString()} plays`}
                      plays={topArtist.playcount}
                      barPct={Math.round(
                        (parseInt(topArtist.playcount) / maxPlaycount) * 100,
                      )}
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
                  {data.tracks.slice(0, 8).map((topTrack, rankIndex) => {
                    const trackArtistName =
                      topTrack.artist?.name ?? topTrack.artist?.["#text"] ?? "";
                    return (
                      <RankItem
                        key={topTrack.name + trackArtistName}
                        rank={rankIndex + 1}
                        img={getImg(topTrack.image, "small", topTrack.name)}
                        name={topTrack.name}
                        meta={trackArtistName}
                        metaHref={
                          trackArtistName
                            ? artistPath(trackArtistName)
                            : undefined
                        }
                        plays={topTrack.playcount}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                  top albums
                </div>
                <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                  {data.albums.slice(0, 8).map((topAlbum, rankIndex) => (
                    <RankItem
                      key={topAlbum.name + topAlbum.artist.name}
                      rank={rankIndex + 1}
                      img={getImg(topAlbum.image, "small")}
                      name={topAlbum.name}
                      nameHref={albumPath(topAlbum.artist.name, topAlbum.name)}
                      meta={topAlbum.artist.name}
                      metaHref={artistPath(topAlbum.artist.name)}
                      plays={topAlbum.playcount}
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
                <ListeningTrendChart
                  data={trendData}
                  options={LISTENING_TREND_CHART_OPTIONS}
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-wide text-[#7b7a87]">
                recent tracks
              </div>
              <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
                {data.recent.slice(0, 12).map((recentTrack, rowIndex) => {
                  const nowPlaying = recentTrack["@attr"]?.nowplaying;
                  const artistName =
                    recentTrack.artist?.["#text"] ??
                    recentTrack.artist?.name ??
                    "";
                  return (
                    <div
                      key={`${recentTrack.name}-${artistName}-${rowIndex}`}
                      className={`flex items-center gap-2.5 px-5 py-[9px] ${
                        rowIndex < 11 ? "border-b border-white/[0.07]" : ""
                      }`}
                    >
                      <Avatar
                        src={getImg(recentTrack.image, "small")}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-[13px] font-medium text-[#f0eff4]">
                          {recentTrack.name}
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
                          {recentTrack.date
                            ? timeAgo(recentTrack.date.uts)
                            : ""}
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
