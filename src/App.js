import { useState, useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { getImg, isPlaceholderLastFmImage } from "./utils.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const API_BASE = "https://ws.audioscrobbler.com/2.0/";

async function lfm(method, params, apiKey) {
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

function timeAgo(uts) {
  const diff = Math.floor(Date.now() / 1000) - parseInt(uts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ src, round, size = 40 }) {
  const [err, setErr] = useState(false);
  const style = {
    width: size,
    height: size,
    borderRadius: round ? "50%" : 6,
    background: "#1f1f26",
    flexShrink: 0,
    objectFit: "cover",
    display: "block",
  };
  if (!src || err) return <div style={style} />;
  return <img src={src} alt="" style={style} onError={() => setErr(true)} />;
}

function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: "#111114",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#7b7a87",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 6,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          color: "#f0eff4",
        }}
      >
        {value || "—"}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 10,
            color: "#7b7a87",
            marginTop: 3,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function RankItem({ rank, img: imgSrc, round, name, meta, plays, barPct }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 1.25rem",
        borderBottom: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#504f5c",
          width: 18,
          textAlign: "right",
          flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {rank}
      </span>
      <Avatar src={imgSrc} round={round} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#f0eff4",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        {meta && (
          <div
            style={{
              fontSize: 11,
              color: "#7b7a87",
              marginTop: 2,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {meta}
          </div>
        )}
      </div>
      {barPct !== undefined && (
        <div
          style={{
            width: 80,
            height: 3,
            background: "#1f1f26",
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: `${barPct}%`,
              height: "100%",
              background: "linear-gradient(90deg, #9b5de5, #c8a8f0)",
              borderRadius: 2,
            }}
          />
        </div>
      )}
      <span
        style={{
          fontSize: 12,
          color: "#c8a8f0",
          fontWeight: 500,
          whiteSpace: "nowrap",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {parseInt(plays).toLocaleString()}
      </span>
    </div>
  );
}

const PERIODS = [
  { label: "7 days", value: "7day" },
  { label: "1 month", value: "1month" },
  { label: "6 months", value: "6month" },
  { label: "1 year", value: "12month" },
  { label: "all time", value: "overall" },
];

/** Last.fm often leaves `user.gettoptracks` images empty or uses a generic star; `track.getInfo` usually has real `album.image`. */
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
        /* ignore per-track failures */
      }
      return t;
    }),
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("lfm_apikey") || "",
  );
  const [username, setUsername] = useState(
    () => localStorage.getItem("lfm_user") || "",
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
      const recent = Array.isArray(recentRes.recenttracks.track)
        ? recentRes.recenttracks.track
        : [recentRes.recenttracks.track];

      const tracksRaw = tracksRes.toptracks.track;
      const tracksList = Array.isArray(tracksRaw) ? tracksRaw : [tracksRaw];
      const tracks = await enrichTopTracksWithAlbumArt(
        tracksList,
        apiKey,
        username,
      );

      setData({
        info,
        artists: artistsRes.topartists.artist,
        artistsTotal: artistsRes.topartists["@attr"].total,
        tracks,
        tracksTotal: tracksRes.toptracks["@attr"].total,
        albums: albumsRes.topalbums.album,
        albumsTotal: albumsRes.topalbums["@attr"].total,
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

  function handlePeriod(val) {
    setPeriod(val);
  }

  useEffect(() => {
    if (data) loadData();
    // eslint-disable-next-line
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

  const s = { fontFamily: "'DM Mono', monospace" };

  return (
    <div
      style={{
        background: "#0a0a0b",
        minHeight: "100vh",
        color: "#f0eff4",
        ...s,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#9b5de5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                scrobble.stats
              </div>
              <div style={{ fontSize: 11, color: "#7b7a87" }}>
                powered by last.fm
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              background: "#111114",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "0.85rem 1.1rem",
            }}
          >
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={handleKey}
              placeholder="api key"
              type="password"
              style={{
                background: "#1f1f26",
                border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "7px 11px",
                color: "#f0eff4",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                width: 180,
                outline: "none",
              }}
            />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              placeholder="username"
              style={{
                background: "#1f1f26",
                border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: "7px 11px",
                color: "#f0eff4",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                width: 130,
                outline: "none",
              }}
            />
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                background: "#9b5de5",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                color: "white",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "loading..." : "load →"}
            </button>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div
            style={{
              background: "#111114",
              border: `0.5px solid ${status.type === "error" ? "rgba(248,113,113,0.2)" : status.type === "ok" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 10,
              padding: "10px 16px",
              marginBottom: "1.5rem",
              fontSize: 12,
              color:
                status.type === "error"
                  ? "#f87171"
                  : status.type === "ok"
                    ? "#4ade80"
                    : "#fbbf24",
            }}
          >
            {status.msg}
          </div>
        )}

        {/* Time tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: "2rem",
            background: "#111114",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriod(p.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: period === p.value ? "#c8a8f0" : "#7b7a87",
                background: period === p.value ? "#3d2060" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!data && !loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>
              ♫
            </div>
            <div style={{ fontSize: 13, color: "#7b7a87", lineHeight: 1.7 }}>
              enter your last.fm api key and username to load your listening
              stats
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                marginBottom: "2rem",
              }}
            >
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

            {/* Top Artists */}
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#7b7a87",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: "1rem",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                top artists
              </div>
              <div
                style={{
                  background: "#0d0d10",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
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
                      meta={`${parseInt(a.playcount).toLocaleString()} plays`}
                      plays={a.playcount}
                      barPct={Math.round((parseInt(a.playcount) / max) * 100)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Top Tracks + Albums */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7b7a87",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: "1rem",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  top tracks
                </div>
                <div
                  style={{
                    background: "#0d0d10",
                    border: "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {data.tracks.slice(0, 8).map((t, i) => (
                    <RankItem
                      key={t.name + t.artist.name}
                      rank={i + 1}
                      img={getImg(t.image, "small", t.name)}
                      name={t.name}
                      meta={t.artist.name}
                      plays={t.playcount}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#7b7a87",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: "1rem",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  top albums
                </div>
                <div
                  style={{
                    background: "#0d0d10",
                    border: "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {data.albums.slice(0, 8).map((a, i) => (
                    <RankItem
                      key={a.name + a.artist.name}
                      rank={i + 1}
                      img={getImg(a.image, "small")}
                      name={a.name}
                      meta={a.artist.name}
                      plays={a.playcount}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Trend chart */}
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#7b7a87",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: "1rem",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                listening trend
              </div>
              <div
                style={{
                  background: "#0d0d10",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "1.25rem",
                }}
              >
                <div style={{ height: 180 }}>
                  {trendData && <Bar data={trendData} options={chartOptions} />}
                </div>
              </div>
            </div>

            {/* Recent tracks */}
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#7b7a87",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: "1rem",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                recent tracks
              </div>
              <div
                style={{
                  background: "#0d0d10",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {data.recent.slice(0, 12).map((t, i) => {
                  const nowPlaying = t["@attr"]?.nowplaying;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 1.25rem",
                        borderBottom:
                          i < 11
                            ? "0.5px solid rgba(255,255,255,0.07)"
                            : "none",
                      }}
                    >
                      <Avatar src={getImg(t.image, "small")} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#f0eff4",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#7b7a87",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {t.artist["#text"]}
                        </div>
                      </div>
                      {nowPlaying ? (
                        <span
                          style={{
                            fontSize: 9,
                            background: "rgba(155,93,229,0.2)",
                            color: "#c8a8f0",
                            borderRadius: 4,
                            padding: "2px 6px",
                            whiteSpace: "nowrap",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          now playing
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#504f5c",
                            whiteSpace: "nowrap",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
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
