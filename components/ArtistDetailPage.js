"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getImg } from "@/lib/utils";
import { artistPath, albumPath } from "@/lib/routes";
import { stripWikiHtml } from "@/lib/wiki";
import { decodeSlug, normalizeList } from "@/lib/lastfm-helpers";
import { fetchArtistDetailData } from "@/lib/artist-service";
import { useLastFmCredentials } from "@/hooks/useLastFmCredentials";
import DetailLayout from "./DetailLayout";
import Avatar from "./Avatar";

export default function ArtistDetailPage({ encodedSlug }) {
  const artistName = decodeSlug(encodedSlug);
  const { ready, apiKey, username } = useLastFmCredentials();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topAlbums, setTopAlbums] = useState([]);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!apiKey || !artistName.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setLoadError(null);
      setArtist(null);
      setTopTracks([]);
      setTopAlbums([]);
      setSimilar([]);
      try {
        const result = await fetchArtistDetailData({
          apiKey,
          username,
          artistName,
        });
        if (cancelled) return;
        setArtist(result.artist);
        setTopTracks(result.topTracks);
        setTopAlbums(result.topAlbums);
        setSimilar(result.similar);
      } catch (error) {
        if (!cancelled) setLoadError(error.message || "Failed to load artist");
      }
      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [apiKey, username, artistName]);

  const bio = artist?.bio?.content ? stripWikiHtml(artist.bio.content) : "";
  const tags = normalizeList(artist?.tags?.tag).filter(Boolean);

  if (!ready) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Loading…</p>
      </DetailLayout>
    );
  }

  if (!apiKey) {
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

  if (loading && !artist && apiKey) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-[#7b7a87]">Loading artist…</p>
      </DetailLayout>
    );
  }

  if (loadError) {
    return (
      <DetailLayout>
        <p className="text-[13px] text-red-400">{loadError}</p>
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

  const heroImageUrl =
    getImg(artist.image, "large") || getImg(artist.image, "medium");

  return (
    <DetailLayout>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="shrink-0">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
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
            {artist.userplaycount !== undefined && username.trim() !== "" && (
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
              {tags.map((tag) => (
                <span
                  key={typeof tag === "string" ? tag : tag.name}
                  className="rounded-md border border-white/[0.08] bg-[#111114] px-2 py-0.5 font-mono text-[10px] text-[#a09eaf]"
                >
                  {typeof tag === "string" ? tag : tag.name}
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
          <p className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#c5c3d0] max-h-[320px] overflow-y-auto">
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
            {topTracks.map((track, rankIndex) => (
              <div
                key={track.name + rankIndex}
                className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 last:border-b-0"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-[#504f5c]">
                  {rankIndex + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-[#f0eff4]">
                  {track.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#c8a8f0]">
                  {parseInt(track.playcount).toLocaleString()}
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
            {topAlbums.map((albumEntry, rankIndex) => (
              <Link
                key={albumEntry.name + rankIndex}
                href={albumPath(artist.name, albumEntry.name)}
                className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5 last:border-b-0 hover:bg-white/[0.03]"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-[#504f5c]">
                  {rankIndex + 1}
                </span>
                <Avatar src={getImg(albumEntry.image, "small")} size={36} />
                <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-[#f0eff4]">
                  {albumEntry.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#c8a8f0]">
                  {parseInt(albumEntry.playcount).toLocaleString()}
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
            {similar.map((similarArtist) => (
              <Link
                key={similarArtist.name}
                href={artistPath(similarArtist.name)}
                className="rounded-lg border border-white/[0.08] bg-[#111114] px-3 py-1.5 font-sans text-[12px] text-[#c8a8f0] hover:bg-[#1f1f26]"
              >
                {similarArtist.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </DetailLayout>
  );
}
