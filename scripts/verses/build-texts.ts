// Builds the verse texts for the verse of the day from public sources:
//   Bhagavad Gita     — github.com/gita/gita (Unlicense), all 701 verses
//   Vishnu Sahasranama — sanskritdocuments.org, the 108 nama shlokas
// The Devanagari is turned into Kannada script and IAST, and written to
// supabase/verses/{bg,vs}.json. Meanings live beside them in meanings/*.json
// and are loaded with `npm run verses:seed`.
//
//   npx tsx scripts/verses/build-texts.ts

import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import Sanscript from "@indic-transliteration/sanscript";

const OUT = path.resolve("supabase/verses");

type Text = { id: string; collection: "bg" | "vs"; source: { en: string; kn: string }; text_kn: string; roman: string };

// Kannada print writes a nasal before a consonant of its own class as ಂ.
const NASAL_CLUSTERS = /([ಙಞಣನಮ])್(?=[ಕಖಗಘಚಛಜಝಟಠಡಢತಥದಧಪಫಬಭ])/g;
function toKannada(line: string) {
  // Candrabindu (श्रीमाँल्लोक…) as ಂ, as Kannada print usually has it.
  return Sanscript.t(line.replace(/ँ/g, "ं"), "devanagari", "kannada").replace(NASAL_CLUSTERS, (m, nasal: string, offset: number, s: string) => {
    const next = s[offset + 2];
    const classOf = (c: string) => "ಙಕಖಗಘ|ಞಚಛಜಝ|ಣಟಠಡಢ|ನತಥದಧ|ಮಪಫಬಭ".split("|").findIndex((g) => g.includes(c));
    return classOf(nasal) === classOf(next) && s[offset - 1] !== "್" ? "ಂ" : m;
  });
}
const toRoman = (line: string) => Sanscript.t(line, "devanagari", "iast").replace(/ṃ/g, "ṁ").replace(/~/g, "m̐");

// Half-verses in Devanagari → the two scripts, one half per line.
function render(source: string[]) {
  const halves = source.map((h) => h.replace(/\u200D/g, "")); // stray joiners ("श‍ृङ्ग")
  const ends = halves.map((_, i) => (i === halves.length - 1 ? "॥" : "।"));
  return {
    text_kn: halves.map((h, i) => `${toKannada(h)} ${ends[i]}`).join("\n"),
    roman: halves.map((h, i) => `${toRoman(h)} ${ends[i] === "॥" ? "||" : "|"}`).join("\n"),
  };
}

// The Gita dataset sometimes puts the i-vowel sign before the consonant
// cluster it belongs after ("निश्िचत" for "निश्चित", "भक्ित" for "भक्ति").
const CONSONANT = "[\\u0915-\\u0939\\u0958-\\u095F]";
const MISPLACED_I = new RegExp(`्ि(${CONSONANT}(?:्${CONSONANT})*)`, "g");
// Typos in the source, corrected against the standard text.
// Typos in the source, found by comparing it verse by verse with a second
// edition (vedicscriptures/bhagavad-gita) and checked against the standard text.
const TYPOS: [string, string][] = [
  ["श्रृ", "शृ"],
  ["ृ\u093C", "ॄ"], // पितॄन्, भ्रातॄन्, पितॄणाम्
  ["श्चशुराः", "श्वशुराः"], // 1.34
  ["युद्धाछ्रेयो", "युद्धाच्छ्रेयो"], // 2.31
  ["अथ चैत्त्वम", "अथ चेत्त्वम"], // 2.33
  ["जुह्वति प्राण प्राणे", "जुह्वति प्राणं प्राणे"], // 4.29
  ["पश्यन् शृणवन्स्पृशञ्जिघ्रन्नश्नन्गच्छन्स्वपन् श्वसन्", "पश्यञ्शृण्वन्स्पृशञ्जिघ्रन्नश्नन्गच्छन्स्वपञ्श्वसन्"], // 5.8
  ["दुःखं सः योगी", "दुःखं स योगी"], // 6.32
  ["। एव त्रयी", "। एवं त्रयी"], // 9.21
  ["सुरसङ्घाः विशन्ति", "सुरसङ्घा विशन्ति"], // 11.21
  ["वाभिमुखाः द्रवन्ति", "वाभिमुखा द्रवन्ति"], // 11.28
  ["शक्यमहमेवंविधो", "शक्य अहमेवंविधो"], // 11.54
  ["ज्ञातुं दृष्टुं", "ज्ञातुं द्रष्टुं"], // 11.54
  ["परिमार्गितव्य यस्मिन्", "परिमार्गितव्यं यस्मिन्"], // 15.4
  ["सत्त्वसंशुद्धिः ज्ञानयोग", "सत्त्वसंशुद्धिर्ज्ञानयोग"], // 16.1
  ["असुरीं योनि", "आसुरीं योनि"], // 16.20
  ["तत्सदिति निर्देशो", "ॐ तत्सदिति निर्देशो"], // 17.23
  ["मोक्षकाङ्क्षि।", "मोक्षकाङ्क्षिभिः।"], // 17.25
];
const fixMatras = (text: string) =>
  TYPOS.reduce((t, [wrong, right]) => t.replaceAll(wrong, right), text)
    .replace(MISPLACED_I, "्$1ि")
    .replace(/([\u093E-\u094C\u0962\u0963])\u093C/g, "$1"); // stray nukta on a vowel sign

async function gita(): Promise<Text[]> {
  const res = await fetch("https://raw.githubusercontent.com/gita/gita/main/data/verse.json");
  const verses = (await res.json()) as { chapter_number: number; verse_number: number; text: string }[];
  return verses.map(({ chapter_number: ch, verse_number: v, text }) => {
    const body = fixMatras(text.replace(/\s+/g, " "))
      .replace(/।+\s*\d+\.\d+\s*।+/g, "")
      .replace(/^\s*(धृतराष्ट्र|सञ्जय|संजय|सञ्जयः|अर्जुन|श्री\s*भगवान्?)\s*उवाच\s*/u, "")
      .replace(/श्रीभगवानुवाच|श्री भगवानुवाच/g, "")
      .replace(/\s+/g, " ");
    const halves = body.split("।").map((h) => h.trim()).filter(Boolean);
    return {
      id: `bg-${ch}-${v}`,
      collection: "bg",
      source: { en: `Bhagavad Gita ${ch}.${v}`, kn: `ಭಗವದ್ಗೀತೆ ${ch}.${v}` },
      ...render(halves),
    };
  });
}

async function sahasranama(): Promise<Text[]> {
  const res = await fetch("https://sanskritdocuments.org/doc_vishhnu/vsahasranew.html");
  const page = (await res.text()).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
  const start = page.indexOf("ॐ विश्वं विष्णुर्वषट्कारो");
  const end = page.indexOf("उत्तरन्यासः");
  const out: Text[] = [];
  for (const m of page.slice(start, end).matchAll(/([^॥]+?)॥\s*([०-९]+)\s*॥/g)) {
    const n = Number(Sanscript.t(m[2], "devanagari", "iast"));
    const halves = m[1]
      .replace(/^[\s\S]*?\n(?=[^\n]+\n[^\n]+$)/, "") // drop stray lines like "… ॐ नम इति ।"
      .replace(/^ॐ\s*/, "")
      .replace(/\([^)]*\)/g, "") // variant readings
      .split("।")
      .map((h) => h.trim())
      .filter(Boolean);
    out.push({
      id: `vs-${n}`,
      collection: "vs",
      source: { en: `Sri Vishnu Sahasranama · Verse ${n}`, kn: `ಶ್ರೀ ವಿಷ್ಣು ಸಹಸ್ರನಾಮ · ಶ್ಲೋಕ ${n}` },
      ...render(halves),
    });
  }
  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const [bg, vs] = await Promise.all([gita(), sahasranama()]);
  writeFileSync(path.join(OUT, "bg.json"), JSON.stringify(bg, null, 1) + "\n");
  writeFileSync(path.join(OUT, "vs.json"), JSON.stringify(vs, null, 1) + "\n");
  console.log(`Gita ${bg.length}, Sahasranama ${vs.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
