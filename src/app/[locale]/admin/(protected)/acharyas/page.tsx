import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Link } from "@/i18n/navigation";
import AcharyaPortrait from "@/components/acharya/AcharyaPortrait";
import { ACHARYAS, acharyaPath, tirunakshatramOf, type Acharya, type AcharyaUploads } from "@/lib/panchang/acharyas";
import { NAKSHATRA_NAMES } from "@/lib/panchang/names";
import { getAcharyaMedia } from "@/lib/data/acharya-media";
import AcharyaImageForm from "./AcharyaImageForm";

const GROUPS: [string, Acharya["kind"]][] = [
  ["The Alwars", "alwar"],
  ["The Acharyas", "acharya"],
  ["Recent Acharyas", "recent"],
  ["Nityasuris", "nityasuri"],
];

export default async function AdminAcharyasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content uploads={await getAcharyaMedia()} />;
}

function Content({ uploads }: { uploads: AcharyaUploads }) {
  const t = useTranslations("admin");
  return (
    <div>
      <AdminPageHeader title={t("nav.acharyas")} />
      <p className="mb-6 max-w-2xl text-sm text-ink/60">
        Pictures and recordings shown on the Panchangam on each tirunakshatram, on the Alwar &amp; Acharya pages and in the shared
        panchangam card. Many already have a freely licensed picture (from Wikimedia Commons) and a few have a recording — upload your
        own to replace them, or fill in the ones still showing the Tirunamam.
      </p>
      <div className="space-y-8">
        {GROUPS.map(([title, kind]) => (
          <section key={kind}>
            <h2 className="mb-3 font-display text-lg text-maroon">{title}</h2>
            <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/70">
              {ACHARYAS.filter((a) => a.kind === kind).map((a) => {
                const star = tirunakshatramOf(a);
                const upload = uploads.images[a.slug];
                return (
                  <li key={a.slug} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <AcharyaPortrait name={a.name.en} imageUrl={upload ?? a.picture?.src} size={44} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{a.name.en}</p>
                        <p className="text-xs text-ink/55">
                          {star ? `${star.month.en} · ${NAKSHATRA_NAMES[star.nakshatra].en}` : "Tirunakshatram not set"} ·{" "}
                          {upload ? "your picture" : a.picture ? "built-in picture" : "no picture yet"} ·{" "}
                          <Link href={acharyaPath(a.slug)} target="_blank" className="text-maroon underline-offset-2 hover:underline">
                            View page ↗
                          </Link>
                        </p>
                      </div>
                    </div>
                    <AcharyaImageForm slug={a.slug} imageUrl={upload ?? null} audioUrl={uploads.audio[a.slug] ?? null} bundledAudio={a.audio?.src ?? null} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
