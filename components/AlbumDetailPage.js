"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lfm } from "@/lib/lastfm";
import { getImg } from "@/lib/utils";
import { artistPath } from "@/lib/routes";
import { stripWikiHtml } from "@/lib/wiki";
import DetailLayout from "./DetailLayout";

function normalizeList(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export default function AlbumDetailPage({ encodedArtist, encodedAlbum }) {
  const artistName = (() => {
    try {
      return decodeURIComponent(encodedArtist);
    } catch {
      return encodedArtist;
    }
  })();
  const albumName = (() => {
    try {
      return decodeURIComponent(encodedAlbum);
    } catch {
      return encodedAlbum;
    }
  })();

  const [ready, setReady] = useState(false);
  const [creds, setCreds] = useState({ apiKey: "", username: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [album, setAlbum] = useState(null);

  useEffect(() => {
    setCreds({
      apiKey: localStorage.getItem("lfm_apikey") || "",
      username: localStorage.getItem("lfm_user") || "",
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!creds.apiKey || !artistName.trim() || !albumName.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      setAlbum(null);
      try {
        const userOpt =
          creds.username.trim().length > 0
            ? { username: creds.username.trim() }
            : {};
        const res = await lfm(
          "album.getInfo",
          {
            artist: artistName,
            album: albumName,
            autocorrect: 1,
            ...userOpt,
          },
          creds.apiKey,
        );

        if (cancelled) return;

        const al = res.album;
        if (!al) throw new Error("Album not found");
        setAlbum(al);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load album");
      }
      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [creds.apiKey, creds.username, artistName, albumName]);

  const wiki = album?.wiki?.content
    ? stripWikiHtml(album.wiki.content)
    : album?.wiki?.summary
      ? stripWikiHtml(album.wiki.summary)
      : "";

  const tracksRaw = album?.tracks?.track;
  const tracks = normalizeList(tracksRaw).sort((a, b) => {
    const an = parseInt(a["@attr"]?.rank || 0, 10);
    const bn = parseInt(b["@attr"]?.rank || 0, 10);
    return an - bn;
  });

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
          Add your Last.fm API key on the{" "}
          <Link href="/" className="text-[#c8a8f0] hover:underline">
            dashboard
          </Link>
          , then open this page again.
        </p>
      </DetailLayout>
    );
  }

  if (loading && !album && creds.apiKey) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Loading album…</p>
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

  if (!album) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Nothing to show.</p>
      </DetailLayout>
    );
  }

  const displayArtist =
    typeof album.artist === "string" ? album.artist : album.artist?.name;
  const cover =
    getImg(album.image, "large") ||
    getImg(album.image, "medium") ||
    getImg(album.image, "small");

  return (
    <DetailLayout>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="shrink-0">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-44 w-44 rounded-xl border border-white/[0.07] bg-[#1f1f26] object-cover"
            />
          ) : (
            <div className="h-44 w-44 rounded-xl border border-white/[0.07] bg-[#1f1f26]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#7b7a87]">
            Album
          </p>
          <h1 className="mt-1 font-sans text-2xl font-extrabold text-[#f0eff4]">
            {album.name}
          </h1>
          <div className="mt-2 font-sans text-[15px]">
            <Link
              href={artistPath(displayArtist || artistName)}
              className="text-[#c8a8f0] hover:underline"
            >
              {displayArtist || artistName}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-[11px] text-[#7b7a87]">
            {album.listeners && (
              <span>
                listeners:{" "}
                <span className="text-[#c8a8f0]">
                  {parseInt(album.listeners).toLocaleString()}
                </span>
              </span>
            )}
            {album.playcount && (
              <span>
                plays:{" "}
                <span className="text-[#c8a8f0]">
                  {parseInt(album.playcount).toLocaleString()}
                </span>
              </span>
            )}
            {album.userplaycount !== undefined &&
              creds.username.trim() !== "" && (
                <span>
                  your plays:{" "}
                  <span className="text-[#c8a8f0]">
                    {parseInt(album.userplaycount || 0).toLocaleString()}
                  </span>
                </span>
              )}
          </div>
        </div>
      </div>

      {wiki ? (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            About
          </h2>
          <p className="max-h-[320px] overflow-y-auto whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#c5c3d0]">
            {wiki}
          </p>
        </section>
      ) : null}

      {tracks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-wide text-[#7b7a87]">
            Track listing
          </h2>
          <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
            {tracks.map((tr, i) => (
              <div
                key={tr.name + i}
                className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 last:border-b-0"
              >
                <span className="w-8 shrink-0 font-mono text-[11px] text-[#504f5c]">
                  {tr["@attr"]?.rank || i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-[#f0eff4]">
                  {tr.name}
                </span>
                {tr.duration ? (
                  <span className="shrink-0 font-mono text-[10px] text-[#504f5c]">
                    {formatDuration(tr.duration)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </DetailLayout>
  );
}

function formatDuration(seconds) {
  const s = parseInt(seconds, 10);
  if (Number.isNaN(s) || s <= 0) return "";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
