import type { FolderTree } from "@/lib/folders";

// Category/subfolder picker for admin content forms. Submits "folderId";
// empty = uncategorized (still listed under "All" for devotees).
export default function CategorySelect({
  categories,
  defaultValue,
  name = "folderId",
}: {
  categories: FolderTree;
  defaultValue?: string | null;
  name?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        Category
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
      >
        <option value="">— No category —</option>
        {categories.map((category) => (
          <optgroup key={category.id} label={category.name}>
            <option value={category.id}>{category.name}</option>
            {category.subfolders.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {category.name} / {sub.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {categories.length === 0 ? (
        <p className="mt-1.5 text-xs text-ink/45">Add categories on this section&rsquo;s list page to organise items.</p>
      ) : null}
    </div>
  );
}
