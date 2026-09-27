import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { gallery } from "@/lib/placeholder-data";

export default async function AdminGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader
        title={t("nav.gallery")}
        action={
          <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">
            + {t("actions.add")}
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-white/10">
            <div className="relative aspect-square w-full">
              <Image src={item.image} alt="" fill className="object-cover" />
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-cream/60">{item.album}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-gold-light">
                {item.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
