// Plain type shared between the server data-fetcher (src/lib/data/gallery.ts)
// and client components (GalleryGrid). Deliberately has no "server-only"
// imports so client bundles can import it directly.

export type GalleryItem = {
  id: string;
  type: "photo" | "video";
  folderId: string;
  image: string;
  youtubeId?: string;
};
