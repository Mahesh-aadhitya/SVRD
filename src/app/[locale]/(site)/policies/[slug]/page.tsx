import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { getTempleInfo } from "@/lib/data/temple-info";
import { POLICY_SLUGS, POLICY_UPDATED, policy, type PolicySlug } from "@/lib/policies";

type Params = Promise<{ locale: string; slug: string }>;

const isPolicy = (slug: string): slug is PolicySlug => (POLICY_SLUGS as readonly string[]).includes(slug);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return isPolicy(slug) ? { title: policy(slug, "", "").title } : {};
}

// Terms, privacy, refunds and delivery — in English (see lib/policies.ts).
export default async function PolicyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isPolicy(slug)) notFound();
  setRequestLocale(locale);
  const [tMeta, info] = await Promise.all([
    getTranslations({ locale: "en", namespace: "meta" }),
    getTempleInfo().catch(() => null),
  ]);
  const contact = [info?.phone, info?.email].filter(Boolean).join(", ");
  const { title, sections } = policy(slug, tMeta("siteTitle"), contact);

  return (
    <div lang="en" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={title} subtitle={`Last updated ${POLICY_UPDATED}`} />
      <div className="mt-8 space-y-6 rounded-3xl border border-gold/30 bg-white/80 p-6 shadow-sm sm:p-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-lg text-maroon">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-sm leading-relaxed text-ink/75">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
