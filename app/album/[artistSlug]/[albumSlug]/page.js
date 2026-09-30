import AlbumDetailPage from "@/components/AlbumDetailPage";

export default async function AlbumPage({ params }) {
  const { artistSlug, albumSlug } = await params;
  if (!artistSlug || !albumSlug) {
    return <div>No artist or album slug provided</div>;
  }
  return (
    <AlbumDetailPage
      encodedArtist={artistSlug}
      encodedAlbum={albumSlug}
    />
  );
}
