import type { FolderTree } from "@/lib/folders";

const selectClass =
  "w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold";

// Required folder picker for gallery and song items.
export default function FolderSelect({
  categories,
  value,
  onChange,
  id,
  className = selectClass,
  placeholder = "Select a folder…",
}: {
  categories: FolderTree;
  value: string;
  onChange: (id: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="" disabled>
        {placeholder}
      </option>
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
  );
}
