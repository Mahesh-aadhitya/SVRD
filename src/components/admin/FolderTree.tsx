import type { FolderTree as FolderTreeType } from "@/lib/folders";

export default function FolderTree({
  tree,
  onDelete,
}: {
  tree: FolderTreeType;
  onDelete: (id: string) => () => Promise<void>;
}) {
  if (tree.length === 0) {
    return <p className="text-sm text-ink/50">No folders yet — add a category below.</p>;
  }

  return (
    <div className="space-y-2">
      {tree.map((category) => (
        <div key={category.id}>
          <Row name={category.name} onDelete={onDelete(category.id)} />
          {category.subfolders.map((sub) => (
            <div key={sub.id} className="ml-6">
              <Row name={sub.name} onDelete={onDelete(sub.id)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Row({ name, onDelete }: { name: string; onDelete: () => Promise<void> }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-ink/80">{name}</span>
      <form action={onDelete}>
        <button type="submit" className="text-xs text-red-600 hover:underline">
          Delete
        </button>
      </form>
    </div>
  );
}
