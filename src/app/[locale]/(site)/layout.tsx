import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PageWatermark from "@/components/PageWatermark";
import SareeBorderDivider from "@/components/SareeBorderDivider";
import SiteAudio from "@/components/SiteAudio";
import WhatsNewPopup from "@/components/highlights/WhatsNewPopup";
import { getTempleInfo } from "@/lib/data/temple-info";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const templeInfo = await getTempleInfo();

  return (
    <>
      <SiteAudio />
      <PageWatermark />
      <Header />
      <SareeBorderDivider flipped />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <SareeBorderDivider />
      <Footer info={templeInfo} />
      <WhatsNewPopup />
      <BottomNav />
    </>
  );
}
