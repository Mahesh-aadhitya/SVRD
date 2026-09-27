// Plain type shared between the server data-fetcher (src/lib/data/songs.ts)
// and client components (SongList). Deliberately has no "server-only"
// imports so client bundles can import it directly.

export type Song = {
  id: string;
  title: { en: string; kn: string };
  folderId: string;
  duration: string;
  audioUrl: string | null;
};
