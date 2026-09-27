// Plain types + pure helpers for the generic content_folders hierarchy,
// shared between server data-fetchers and client components. Deliberately
// has no "server-only" imports so client bundles can import it directly.

export type FolderSection = "gallery" | "songs";

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

// Top-level folders are categories; a folder with a parentId is a subfolder
// nested under a category (only one level of nesting is used by the admin
// UI today, but the schema itself allows arbitrary depth).
export function buildFolderTree(folders: Folder[]) {
  const categories = folders.filter((f) => f.parentId === null);
  return categories.map((category) => ({
    ...category,
    subfolders: folders.filter((f) => f.parentId === category.id),
  }));
}

export type FolderTree = ReturnType<typeof buildFolderTree>;
