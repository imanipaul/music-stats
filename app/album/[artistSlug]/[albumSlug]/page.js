import AlbumDetailPage from "@/components/AlbumDetailPage";

export default function AlbumPage({ params }) {
  return (
    <AlbumDetailPage
      encodedArtist={params.artistSlug}
      encodedAlbum={params.albumSlug}
    />
  );
}
