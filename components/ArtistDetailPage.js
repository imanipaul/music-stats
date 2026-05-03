"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lfm } from "@/lib/lastfm";
import { getImg } from "@/lib/utils";
import { artistPath, albumPath } from "@/lib/routes";
import { stripWikiHtml } from "@/lib/wiki";
import DetailLayout from "./DetailLayout";
import Avatar from "./Avatar";

function normalizeList(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export default function ArtistDetailPage({ encodedSlug }) {
  const artistName = (() => {
    try {
      return decodeURIComponent(encodedSlug);
    } catch {
      return encodedSlug;
    }
  })();

  const [ready, setReady] = useState(false);
  const [creds, setCreds] = useState({ apiKey: "", username: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    setCreds({
      apiKey: localStorage.getItem("lfm_apikey") || "",
      username: localStorage.getItem("lfm_user") || "",
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!creds.apiKey || !artistName.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      setArtist(null);
      setTopTracks([]);
      setTopAlbums([]);
      setSimilar([]);
      try {
        const userOpt =
          creds.username.trim().length > 0
            ? { username: creds.username.trim() }
            : {};
        const [infoRes, tracksRes, albumsRes, simRes] = await Promise.all([
          lfm(
            "artist.getInfo",
            {
              artist: artistName,
              autocorrect: 1,
              ...userOpt,
            },
            creds.apiKey,
          ),
          lfm(
            "artist.getTopTracks",
            { artist: artistName, limit: 15, autocorrect: 1 },
            creds.apiKey,
          ),
          lfm(
            "artist.getTopAlbums",
            { artist: artistName, limit: 8, autocorrect: 1 },
            creds.apiKey,
          ),
          lfm(
            "artist.getSimilar",
            { artist: artistName, limit: 12, autocorrect: 1 },
            creds.apiKey,
          ),
        ]);

        if (cancelled) return;

        const a = infoRes.artist;
        if (!a) throw new Error("Artist not found");

        const tracksRaw = tracksRes.toptracks?.track;
        const albumsRaw = albumsRes.topalbums?.album;
        const simRaw = simRes.similarartists?.artist;

        setArtist(a);
        setTopTracks(normalizeList(tracksRaw));
        setTopAlbums(normalizeList(albumsRaw));
        setSimilar(normalizeList(simRaw));
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load artist");
      }
      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [creds.apiKey, creds.username, artistName]);

  const bio = artist?.bio?.summary
    ? stripWikiHtml(artist.bio.summary)
    : "";
  const tags = normalizeList(artist?.tags?.tag).filter(Boolean);

  if (!ready) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Loading…</p>
      </DetailLayout>
    );
  }

  if (!creds.apiKey) {
    return (
      <DetailLayout>
        <p className="text-[13px] leading-relaxed text-[#7b7a87]">
          Add your Last.fm API key (and username for personalized stats) on the{" "}
          <Link href="/" className="text-[#c8a8f0] hover:underline">
            dashboard
          </Link>
          , then open this page again.
        </p>
      </DetailLayout>
    );
  }

  if (loading && !artist && creds.apiKey) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Loading artist…</p>
      </DetailLayout>
    );
  }

  if (err) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-red-400">{err}</p>
      </DetailLayout>
    );
  }

  if (!artist) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Nothing to show.</p>
      </DetailLayout>
    );
  }

  const imgL = getImg(artist.image, "large") || getImg(artist.image, "medium");

  return (
    <DetailLayout>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="shrink-0">
          {imgL ? (
            <img
              src={imgL}
              alt=""
              className="h-40 w-40 rounded-xl border border-white/[0.07] bg-[#1f1f26] object-cover"
            />
          ) : (
            <div className="h-40 w-40 rounded-xl border border-white/[0.07] bg-[#1f1f26]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-sans text-2xl font-extrabold text-[#f0eff4]">
            {artist.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] text-[#7b7a87]">
            {artist.stats?.listeners && (
              <span>
                listeners:{" "}
                <span className="text-[#c8a8f0]">
                  {parseInt(artist.stats.listeners).toLocaleString()}
                </span>
              </span>
            )}
            {artist.stats?.playcount && (
              <span>
                plays:{" "}
                <span className="text-[#c8a8f0]">
                  {parseInt(artist.stats.playcount).toLocaleString()}
                </span>
              </span>
            )}
            {artist.userplaycount !== undefined &&
              creds.username.trim() !== "" && (
                <span>
                  your plays:{" "}
                  <span className="text-[#c8a8f0]">
                    {parseInt(artist.userplaycount || 0).toLocaleString()}
                  </span>
                </span>
              )}
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={typeof t === "string" ? t : t.name}
                  className="rounded-md border border-white/[0.08] bg-[#111114] px-2 py-0.5 font-mono text-[10px] text-[#a09eaf]"
                >
                  {typeof t === "string" ? t : t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {bio ? (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            About
          </h2>
          <p className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#c5c3d0]">
            {bio}
          </p>
        </section>
      ) : null}

      {topTracks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            Popular tracks
          </h2>
          <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
            {topTracks.map((t, i) => (
              <div
                key={t.name + i}
                className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 last:border-b-0"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-[#504f5c]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-[#f0eff4]">
                  {t.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#c8a8f0]">
                  {parseInt(t.playcount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {topAlbums.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            Top albums
          </h2>
          <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
            {topAlbums.map((alb, i) => (
              <Link
                key={alb.name + i}
                href={albumPath(artist.name, alb.name)}
                className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 last:border-b-0 hover:bg-white/[0.03]"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-[#504f5c]">
                  {i + 1}
                </span>
                <Avatar src={getImg(alb.image, "small")} size={36} />
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-[#f0eff4]">
                  {alb.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#c8a8f0]">
                  {parseInt(alb.playcount).toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            Similar artists
          </h2>
          <div className="flex flex-wrap gap-2">
            {similar.map((s) => (
              <Link
                key={s.name}
                href={artistPath(s.name)}
                className="rounded-lg border border-white/[0.08] bg-[#111114] px-3 py-1.5 font-sans text-[12px] text-[#c8a8f0] hover:bg-[#1f1f26]"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </DetailLayout>
  );
}
