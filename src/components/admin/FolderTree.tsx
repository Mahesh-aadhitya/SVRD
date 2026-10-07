import type { FolderSection, FolderTree as FolderTreeType } from "@/lib/folders";
import FolderRow from "./FolderRow";

export default function FolderTree({
  section,
  tree,
  onDelete,
}: {
  section: FolderSection;
  tree: FolderTreeType;
  onDelete: (id: string) => () => Promise<void>;
}) {
  if (tree.length === 0) {
    return <p className="text-sm text-ink/50">No folders yet — add a category below.</p>;
  }
  const categories = tree.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-2">
      {tree.map((category) => (
        <div key={category.id}>
          <FolderRow
            section={section}
            folder={{ id: category.id, name: category.name, parentId: null }}
            categories={category.subfolders.length ? [] : categories}
            onDelete={onDelete(category.id)}
          />
          {category.subfolders.map((sub) => (
            <div key={sub.id} className="ml-6">
              <FolderRow
                section={section}
                folder={{ id: sub.id, name: sub.name, parentId: category.id }}
                categories={categories}
                onDelete={onDelete(sub.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
