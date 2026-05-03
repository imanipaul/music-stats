import ArtistDetailPage from "@/components/ArtistDetailPage";

export default function ArtistPage({ params }) {
  return <ArtistDetailPage encodedSlug={params.slug} />;
}
