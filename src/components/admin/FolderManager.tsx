import FolderForm from "@/components/admin/FolderForm";
import FolderTree from "@/components/admin/FolderTree";
import { createFolder, deleteFolder } from "@/lib/actions/folders";
import type { Locale } from "@/i18n/routing";
import type { FolderSection, FolderTree as FolderTreeType } from "@/lib/folders";

// Categories panel shown on every admin section list page.
export default function FolderManager({
  section,
  basePath,
  tree,
  locale,
}: {
  section: FolderSection;
  basePath: string;
  tree: FolderTreeType;
  locale: Locale;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Categories</h2>
      <div className="mb-4 rounded-2xl border border-ink/10 p-4">
        <FolderTree tree={tree} onDelete={(id) => deleteFolder.bind(null, section, basePath, id, locale)} />
      </div>
      <FolderForm categories={tree} action={createFolder.bind(null, section, basePath, locale)} />
    </section>
  );
}
