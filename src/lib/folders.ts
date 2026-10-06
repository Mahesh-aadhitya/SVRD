// Plain types + pure helpers for the generic content_folders hierarchy,
// shared between server data-fetchers and client components. Deliberately
// has no "server-only" imports so client bundles can import it directly.

export type FolderSection = "gallery" | "songs" | "poojas" | "events" | "sevas" | "live";

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

// Folder ids an item may belong to for the selected category/subfolder
// filter: a subfolder matches only itself; a category matches itself plus
// all its subfolders. Returns null for "All" (no filtering).
export function selectedFolderIds(
  tree: FolderTree,
  categoryId: string | null | undefined,
  subfolderId: string | null | undefined,
): string[] | null {
  const category = tree.find((c) => c.id === categoryId);
  if (!category) return null;
  if (subfolderId && category.subfolders.some((s) => s.id === subfolderId)) return [subfolderId];
  return [category.id, ...category.subfolders.map((s) => s.id)];
}

export function filterByFolder<T extends { folderId: string | null }>(items: T[], folderIds: string[] | null) {
  return folderIds ? items.filter((item) => item.folderId !== null && folderIds.includes(item.folderId)) : items;
}

// "Festivals / Brahmotsavam" style label for admin tables.
export function folderPath(folders: Folder[], id: string | null) {
  const folder = folders.find((f) => f.id === id);
  if (!folder) return null;
  const parent = folders.find((f) => f.id === folder.parentId);
  return parent ? `${parent.name} / ${folder.name}` : folder.name;
}
