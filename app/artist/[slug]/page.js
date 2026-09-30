import ArtistDetailPage from "@/components/ArtistDetailPage";

export default async function ArtistPage({ params }) {
  const { slug } = await params;
  if (!slug) {
    return <div>No slug provided</div>;
  }
  return <ArtistDetailPage encodedSlug={slug} />;
}
