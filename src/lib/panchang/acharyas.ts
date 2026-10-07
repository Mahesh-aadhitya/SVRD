// The twelve Alwars and the Srivaishnava Acharyas whose tirunakshatrams
// the panchangam marks (see TIRUNAKSHATRAMS in ./names): who they were,
// their life as the tradition tells it, their works, and one composition
// by or about them — shown as the verse of the day on their tirunakshatram.
// Pictures are added by the temple (acharya_images); the rest lives here.
import { TIRUNAKSHATRAMS, type Named } from "./names";
import { VERSES, type Verse } from "./verses";
import { TIRUPPAVAI } from "./dhanurmasa";
import type { Observance } from "./rules";

/** Where a bundled picture or recording comes from (all freely licensed). */
export type MediaCredit = { src: string; author: string; license: string; sourceUrl: string; title?: Named };

export type Acharya = {
  slug: string;
  kind: "alwar" | "acharya" | "nityasuri" | "recent";
  /** Index into TIRUNAKSHATRAMS; absent while it isn't known. */
  tirunakshatram?: number;
  name: Named;
  /** Other names they are known by. */
  alsoKnownAs?: Named;
  birthplace?: Named;
  /** The Lord's weapon or ornament they are held to be an amsam of. */
  amsam?: Named;
  /** Traditional period, e.g. "1017 – 1137 CE (traditional)". */
  period?: Named;
  /** One line for cards and the share text. */
  summary: Named;
  /** The life, a paragraph per entry. */
  life: Named[];
  works: Named[];
  composition?: Verse;
  /** A freely licensed picture shipped with the site (a temple upload replaces it). */
  picture?: MediaCredit;
  /** A freely licensed recording of (or close to) the composition. */
  audio?: MediaCredit;
};

const n = (en: string, kn: string): Named => ({ en, kn });

const PICTURE_CREDITS: Record<string, Omit<MediaCredit, "src">> = {
  "poigai-alwar": { author: "Chronikhiles", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Poigai_Alvar_-_Sri_Appan_Venkatachalapati_Temple,_Cheranmahadevi.jpg" },
  "bhoothathalwar": { author: "Sri PB Annangarachariar", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:BhoothAlvar_cropped.jpg" },
  "peyalwar": { author: "Sri PB Annangarachariar", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Pey_Alvar_PBA.jpg" },
  "tirumazhisai-alwar": { author: "Sri PB Annangarachariar", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Thirumazhsai_Alvar_cropped.jpg" },
  "nammalwar": { author: "Unknown artist", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Nammalvar.PNG" },
  "madhurakavi-alwar": { author: "Sri PB Annangarachariar Swami", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Madurakavi_Alvar_PBA.jpg" },
  "kulasekhara-alwar": { author: "P. Shungoonny Menon", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Kulasekhara_Alwar.png" },
  "periyalwar": { author: "Ssriram mt", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Periazhwar.jpg" },
  "andal": { author: "Unknown artist", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Andal-painting.jpg" },
  "thondaradippodi-alwar": { author: "Ssriram mt", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Thondaradipodi_Azhwar.jpg" },
  "tiruppanalwar": { author: "Chronikhiles", license: "CC0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Tiruppan_Alvar_Sculpture.jpg" },
  "tirumangai-alwar": { author: "Chronikhiles", license: "CC0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Tirumangai_Alvar.jpg" },
  "alavandar": { author: "Komandur Elayavalli", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Aalavandar.jpg" },
  "periya-nambi": { author: "Aparajitha Manivannan", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Periya-nambi.jpg" },
  "ramanuja": { author: "Swarooppn", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ramanuja-moolavar-today.jpg" },
  "embar": { author: "Swarooppn", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Embar_swamy.jpg" },
  "pillai-lokacharya": { author: "Debanjon", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Swami_Pillai_Lokacharya.JPG" },
  "vedanta-desikar": { author: "N. Desikacharya", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Srimad_Vedanta_Desika_Swami.jpg" },
  "manavala-mamunigal": { author: "Ssriram mt", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Manavala_mamunigal_02.jpg" },
  "chakrathalwar": { author: "Krishna Iyerr", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Chakrapani_perumal_kumbakonam.png" },
  "garudalwar": { author: "Neek-Theri", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:Garuda_in_Veerasana_Mudra.jpg" },
};

const verse = (id: string) => VERSES.find((v) => v.id === id)!;
const sloka = (id: string, source: Named, kn: string, roman: string, meaning: Named): Verse => ({ id, source, kn, roman, meaning });
const pasuram = (id: string, source: Named, tamil: string, kn: string, roman: string, meaning: Named): Verse => ({
  id,
  source,
  kn,
  roman,
  tamil,
  meaning,
});

// Tamil solar months by the Sun's sidereal rashi (Mesha = Chittirai).
export const TAMIL_MONTHS: Named[] = [
  n("Chittirai", "ಚಿತ್ತಿರೈ"),
  n("Vaikasi", "ವೈಕಾಸಿ"),
  n("Aani", "ಆನಿ"),
  n("Aadi", "ಆಡಿ"),
  n("Avani", "ಆವಣಿ"),
  n("Purattasi", "ಪುರಟ್ಟಾಸಿ"),
  n("Aippasi", "ಐಪ್ಪಸಿ"),
  n("Karthigai", "ಕಾರ್ತಿಗೈ"),
  n("Margazhi", "ಮಾರ್ಗಳಿ"),
  n("Thai", "ತೈ"),
  n("Masi", "ಮಾಸಿ"),
  n("Panguni", "ಪಂಗುನಿ"),
];

const andalTiruppavai1: Verse = {
  id: "tn-andal",
  source: n("Tiruppavai 1 · Sri Andal", "ತಿರುಪ್ಪಾವೈ 1 · ಶ್ರೀ ಆಂಡಾಳ್"),
  tamil: TIRUPPAVAI[0].tamil,
  kn: TIRUPPAVAI[0].kn,
  roman: TIRUPPAVAI[0].roman,
  meaning: TIRUPPAVAI[0].gist,
};

export const ACHARYAS: Acharya[] = [
  // ── The Alwars ──────────────────────────────────────────────────────────
  {
    slug: "poigai-alwar",
    kind: "alwar",
    tirunakshatram: 6,
    name: n("Poigai Alwar", "ಪೊಯ್ಗೈ ಆಳ್ವಾರ್"),
    alsoKnownAs: n("Saro Yogi, Kasara Yogi", "ಸರೋಯೋಗಿ, ಕಾಸಾರಯೋಗಿ"),
    birthplace: n("A lotus pond at Tiruvekka (Yathoktakari temple), Kanchipuram", "ತಿರುವೆಕ್ಕಾ (ಯಥೋಕ್ತಕಾರಿ ದೇವಸ್ಥಾನ) ಕೊಳದ ಕಮಲ, ಕಾಂಚೀಪುರಂ"),
    amsam: n("Panchajanya, the Lord's conch", "ಪಾಂಚಜನ್ಯ ಶಂಖ"),
    summary: n(
      "The first of the Alwars, born in a lotus at Kanchi, who lit the first lamp of the Divya Prabandham.",
      "ಕಾಂಚಿಯ ಕೊಳದ ಕಮಲದಲ್ಲಿ ಅವತರಿಸಿದ ಮೊದಲ ಆಳ್ವಾರ್ — ದಿವ್ಯ ಪ್ರಬಂಧದ ಮೊದಲ ದೀಪವನ್ನು ಬೆಳಗಿದವರು.",
    ),
    life: [
      n(
        "Poigai Alwar is the first of the three Mudhal (first) Alwars. Tradition holds that he appeared in a golden lotus in the temple pond of Tiruvekka at Kanchipuram, the town of our own Lord Varadaraja, and grew up devoted wholly to Narayana, wandering from shrine to shrine.",
        "ಪೊಯ್ಗೈ ಆಳ್ವಾರರು ಮೂವರು ಮುದಲ್ (ಮೊದಲ) ಆಳ್ವಾರರಲ್ಲಿ ಮೊದಲಿಗರು. ನಮ್ಮ ಶ್ರೀ ವರದರಾಜನ ಊರಾದ ಕಾಂಚೀಪುರದ ತಿರುವೆಕ್ಕಾ ದೇವಾಲಯದ ಕೊಳದಲ್ಲಿ ಚಿನ್ನದ ಕಮಲದಲ್ಲಿ ಅವತರಿಸಿದರೆಂದು ಸಂಪ್ರದಾಯ ಹೇಳುತ್ತದೆ. ನಾರಾಯಣನಲ್ಲೇ ಮನಸ್ಸಿಟ್ಟು ಕ್ಷೇತ್ರದಿಂದ ಕ್ಷೇತ್ರಕ್ಕೆ ಸಂಚರಿಸಿದರು.",
      ),
      n(
        "On a stormy night at Tirukkovalur he sheltered in a narrow passage where one could lie down. Bhoothathalwar arrived, and the two sat; then Peyalwar came, and the three stood. They felt a fourth pressing among them — the Lord Himself. Poigai Alwar then sang the first verse of the Mudhal Tiruvandhadhi, lighting a lamp with the earth as its bowl, the ocean as its ghee and the sun as its flame.",
        "ತಿರುಕ್ಕೋವಲೂರಿನಲ್ಲಿ ಬಿರುಮಳೆಯ ರಾತ್ರಿ ಒಬ್ಬರು ಮಲಗುವಷ್ಟು ಇಕ್ಕಟ್ಟಾದ ಜಗುಲಿಯಲ್ಲಿ ಅವರು ಆಶ್ರಯ ಪಡೆದರು. ಭೂತತ್ತಾಳ್ವಾರ್ ಬಂದಾಗ ಇಬ್ಬರೂ ಕುಳಿತರು; ಪೇಯಾಳ್ವಾರ್ ಬಂದಾಗ ಮೂವರೂ ನಿಂತರು. ಅವರ ನಡುವೆ ನಾಲ್ಕನೆಯವನೊಬ್ಬ ನುಗ್ಗಿದಂತಾಯಿತು — ಸಾಕ್ಷಾತ್ ಭಗವಂತ. ಆಗ ಪೊಯ್ಗೈ ಆಳ್ವಾರ್ ಭೂಮಿಯನ್ನೇ ಹಣತೆಯಾಗಿ, ಸಮುದ್ರವನ್ನೇ ತುಪ್ಪವಾಗಿ, ಸೂರ್ಯನನ್ನೇ ಜ್ಯೋತಿಯಾಗಿಸಿ ಮುದಲ್ ತಿರುವಂದಾದಿಯ ಮೊದಲ ಪಾಶುರವನ್ನು ಹಾಡಿದರು.",
      ),
    ],
    works: [n("Mudhal Tiruvandhadhi (100 verses)", "ಮುದಲ್ ತಿರುವಂದಾದಿ (100 ಪಾಶುರಗಳು)")],
    composition: verse("dp-poigai"),
  },
  {
    slug: "bhoothathalwar",
    kind: "alwar",
    tirunakshatram: 7,
    name: n("Bhoothathalwar", "ಭೂತತ್ತಾಳ್ವಾರ್"),
    alsoKnownAs: n("Bhuta Yogi", "ಭೂತಯೋಗಿ"),
    birthplace: n("A madhavi flower at Tirukkadalmallai (Mamallapuram)", "ತಿರುಕ್ಕಡಲ್ಮಲ್ಲೈ (ಮಾಮಲ್ಲಪುರಂ) ಮಾಧವೀ ಹೂವು"),
    amsam: n("Kaumodaki, the Lord's mace", "ಕೌಮೋದಕೀ ಗದೆ"),
    summary: n(
      "The second of the first Alwars, who lit a lamp of love with longing as its ghee.",
      "ಮೊದಲ ಆಳ್ವಾರರಲ್ಲಿ ಎರಡನೆಯವರು — ಪ್ರೀತಿಯನ್ನೇ ಹಣತೆಯಾಗಿ, ಹಂಬಲವನ್ನೇ ತುಪ್ಪವಾಗಿಸಿ ದೀಪ ಬೆಳಗಿದವರು.",
    ),
    life: [
      n(
        "Bhoothathalwar was born, the tradition says, in a madhavi flower at Mamallapuram by the sea, the day after Poigai Alwar. His name means one who has grasped the true nature of things (bhuta), for he lived absorbed in the Lord.",
        "ಪೊಯ್ಗೈ ಆಳ್ವಾರರ ಮರುದಿನ ಸಮುದ್ರತೀರದ ಮಾಮಲ್ಲಪುರದಲ್ಲಿ ಮಾಧವೀ ಹೂವಿನಲ್ಲಿ ಭೂತತ್ತಾಳ್ವಾರ್ ಅವತರಿಸಿದರೆಂದು ಸಂಪ್ರದಾಯ. ವಸ್ತುಗಳ ನಿಜಸ್ವರೂಪವನ್ನು (ಭೂತ) ಅರಿತವರು ಎಂಬುದು ಅವರ ಹೆಸರಿನ ಅರ್ಥ — ಸದಾ ಭಗವಂತನಲ್ಲೇ ಮಗ್ನರಾಗಿದ್ದರು.",
      ),
      n(
        "In the dark passage at Tirukkovalur, answering Poigai Alwar's lamp of the world, he lit a lamp within: love as the bowl, longing as the ghee, a melting heart as the wick — and sang the Irandam Tiruvandhadhi.",
        "ತಿರುಕ್ಕೋವಲೂರಿನ ಕತ್ತಲ ಜಗುಲಿಯಲ್ಲಿ ಪೊಯ್ಗೈ ಆಳ್ವಾರರ ಲೋಕದೀಪಕ್ಕೆ ಉತ್ತರವಾಗಿ ಅವರು ಒಳಗಿನ ದೀಪ ಬೆಳಗಿದರು: ಪ್ರೀತಿಯೇ ಹಣತೆ, ಹಂಬಲವೇ ತುಪ್ಪ, ಕರಗುವ ಮನಸ್ಸೇ ಬತ್ತಿ — ಹೀಗೆ ಇರಂಡಾಮ್ ತಿರುವಂದಾದಿಯನ್ನು ಹಾಡಿದರು.",
      ),
    ],
    works: [n("Irandam Tiruvandhadhi (100 verses)", "ಇರಂಡಾಮ್ ತಿರುವಂದಾದಿ (100 ಪಾಶುರಗಳು)")],
    composition: verse("dp-bhoothath"),
  },
  {
    slug: "peyalwar",
    kind: "alwar",
    tirunakshatram: 8,
    name: n("Peyalwar", "ಪೇಯಾಳ್ವಾರ್"),
    alsoKnownAs: n("Mahadyogi", "ಮಹದ್ಯೋಗಿ"),
    birthplace: n("A red lily in a well at Tirumayilai (Mylapore)", "ತಿರುಮಯಿಲೈ (ಮೈಲಾಪುರ) ಬಾವಿಯ ಕೆಂಪು ನೈದಿಲೆ"),
    amsam: n("Nandaka, the Lord's sword", "ನಂದಕ ಖಡ್ಗ"),
    summary: n(
      "The third of the first Alwars, so lost in the Lord that people called him 'the possessed one'.",
      "ಮೊದಲ ಆಳ್ವಾರರಲ್ಲಿ ಮೂರನೆಯವರು — ಭಗವಂತನಲ್ಲಿ ಎಷ್ಟು ಮುಳುಗಿದ್ದರೆಂದರೆ ಜನ ಅವರನ್ನು 'ಪೇಯ್' (ಆವೇಶಗೊಂಡವರು) ಎಂದರು.",
    ),
    life: [
      n(
        "Peyalwar appeared in a red lily in a well at Mylapore. His love for the Lord was so overwhelming — weeping, laughing, singing and dancing — that people thought him possessed, and the name Pey stuck as a title of honour.",
        "ಪೇಯಾಳ್ವಾರ್ ಮೈಲಾಪುರದ ಬಾವಿಯಲ್ಲಿ ಕೆಂಪು ನೈದಿಲೆಯಲ್ಲಿ ಅವತರಿಸಿದರು. ಭಗವಂತನ ಮೇಲಿನ ಪ್ರೇಮದಲ್ಲಿ ಅಳುತ್ತಾ, ನಗುತ್ತಾ, ಹಾಡುತ್ತಾ, ಕುಣಿಯುತ್ತಾ ಇದ್ದ ಅವರನ್ನು ಜನ ಆವೇಶಗೊಂಡವರೆಂದು ತಿಳಿದರು; 'ಪೇಯ್' ಎಂಬ ಹೆಸರೇ ಗೌರವದ ಬಿರುದಾಯಿತು.",
      ),
      n(
        "By the light of the two lamps lit at Tirukkovalur he saw the Lord in full — His golden form, the sun-bright hue, the discus and the conch — and burst out, 'I have seen Sri today!', the opening of the Moondram Tiruvandhadhi. He later guided Tirumazhisai Alwar to Narayana.",
        "ತಿರುಕ್ಕೋವಲೂರಿನಲ್ಲಿ ಬೆಳಗಿದ ಎರಡು ದೀಪಗಳ ಬೆಳಕಿನಲ್ಲಿ ಅವರು ಭಗವಂತನನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಕಂಡರು — ಸ್ವರ್ಣರೂಪ, ಸೂರ್ಯಕಾಂತಿ, ಚಕ್ರ, ಶಂಖ — 'ಇಂದು ಶ್ರೀಯನ್ನು ಕಂಡೆ!' ಎಂದು ಮೂನ್ರಾಮ್ ತಿರುವಂದಾದಿಯನ್ನು ಆರಂಭಿಸಿದರು. ಮುಂದೆ ತಿರುಮಳಿಶೈ ಆಳ್ವಾರರನ್ನು ನಾರಾಯಣನೆಡೆಗೆ ಕರೆತಂದವರು ಇವರೇ.",
      ),
    ],
    works: [n("Moondram Tiruvandhadhi (100 verses)", "ಮೂನ್ರಾಮ್ ತಿರುವಂದಾದಿ (100 ಪಾಶುರಗಳು)")],
    composition: verse("dp-pey"),
  },
  {
    slug: "tirumazhisai-alwar",
    kind: "alwar",
    tirunakshatram: 13,
    name: n("Tirumazhisai Alwar", "ತಿರುಮಳಿಶೈ ಆಳ್ವಾರ್"),
    alsoKnownAs: n("Bhaktisara", "ಭಕ್ತಿಸಾರ"),
    birthplace: n("Tirumazhisai, near Chennai", "ತಿರುಮಳಿಶೈ, ಚೆನ್ನೈ ಸಮೀಪ"),
    amsam: n("Sudarshana, the Lord's discus", "ಸುದರ್ಶನ ಚಕ್ರ"),
    summary: n(
      "The seeker who tried every path before Peyalwar led him to Narayana — at whose word the Lord of Tiruvekka rolled up His bed and left.",
      "ಎಲ್ಲ ಮಾರ್ಗಗಳನ್ನೂ ಹುಡುಕಿ ಕೊನೆಗೆ ಪೇಯಾಳ್ವಾರರ ಮೂಲಕ ನಾರಾಯಣನನ್ನು ಸೇರಿದವರು — ಅವರ ಮಾತಿಗೆ ತಿರುವೆಕ್ಕಾದ ಪೆರುಮಾಳ್ ತನ್ನ ಹಾಸಿಗೆಯನ್ನೇ ಸುತ್ತಿಕೊಂಡು ಹೊರಟನು.",
    ),
    life: [
      n(
        "Born to the sage Bhargava and left in a bamboo thicket, he was raised by a woodcutter at Tirumazhisai. A restless seeker, he studied the Shaiva, Jaina and Bauddha schools before Peyalwar showed him the Lord, and he became Bhaktisara, 'the essence of devotion'.",
        "ಭಾರ್ಗವ ಮುನಿಗೆ ಜನಿಸಿ ಬಿದಿರುಮೆಳೆಯಲ್ಲಿ ಬಿಡಲ್ಪಟ್ಟ ಮಗುವನ್ನು ತಿರುಮಳಿಶೈಯ ಒಬ್ಬ ಮರಕಡಿಯುವವನು ಸಾಕಿದನು. ಸತ್ಯಾನ್ವೇಷಿಯಾದ ಅವರು ಶೈವ, ಜೈನ, ಬೌದ್ಧ ಮತಗಳನ್ನು ಅಭ್ಯಸಿಸಿ, ಕೊನೆಗೆ ಪೇಯಾಳ್ವಾರರಿಂದ ಭಗವಂತನನ್ನು ಅರಿತು 'ಭಕ್ತಿಸಾರ'ರಾದರು.",
      ),
      n(
        "At Kanchi, when the Pallava king banished his disciple Kanikannan, the Alwar left too and told the Lord of Tiruvekka to roll up His serpent bed and follow. The Lord did, and returned only when they did — so He is called Sonna Vannam Seidha Perumal, 'the Lord who did as He was told'. The Alwar spent his last years at Kumbakonam, where Lord Aravamudan is said to have half-risen to greet him.",
        "ಕಾಂಚಿಯಲ್ಲಿ ಪಲ್ಲವ ರಾಜನು ಅವರ ಶಿಷ್ಯ ಕಣಿಕಣ್ಣನನ್ನು ಗಡೀಪಾರು ಮಾಡಿದಾಗ, ಆಳ್ವಾರರೂ ಹೊರಟು, ತಿರುವೆಕ್ಕಾದ ಪೆರುಮಾಳ್‌ಗೆ ಆದಿಶೇಷನ ಹಾಸಿಗೆ ಸುತ್ತಿಕೊಂಡು ಹಿಂಬಾಲಿಸುವಂತೆ ಹೇಳಿದರು. ಭಗವಂತ ಹಾಗೆಯೇ ಮಾಡಿ, ಅವರು ಮರಳಿದಾಗಲೇ ಮರಳಿದನು — ಆದ್ದರಿಂದ ಅವನು 'ಸೊನ್ನವಣ್ಣಂ ಸೆಯ್ದ ಪೆರುಮಾಳ್' (ಹೇಳಿದಂತೆ ಮಾಡಿದ ಸ್ವಾಮಿ). ಕೊನೆಯ ದಿನಗಳನ್ನು ಕುಂಭಕೋಣದಲ್ಲಿ ಕಳೆದರು; ಅಲ್ಲಿ ಆರಾವಮುದನ್ ಅವರನ್ನು ಸ್ವಾಗತಿಸಲು ಅರ್ಧ ಎದ್ದನೆಂದು ಪ್ರತೀತಿ.",
      ),
    ],
    works: [
      n("Tiruchanda Viruttam (120 verses)", "ತಿರುಚ್ಚಂದ ವಿರುತ್ತಂ (120 ಪಾಶುರಗಳು)"),
      n("Naanmugan Tiruvandhadhi (96 verses)", "ನಾನ್ಮುಗನ್ ತಿರುವಂದಾದಿ (96 ಪಾಶುರಗಳು)"),
    ],
    composition: pasuram(
      "tn-tirumazhisai",
      n("Naanmugan Tiruvandhadhi 1 · Tirumazhisai Alwar", "ನಾನ್ಮುಗನ್ ತಿರುವಂದಾದಿ 1 · ತಿರುಮಳಿಶೈ ಆಳ್ವಾರ್"),
      "நான்முகனை நாராயணன் படைத்தான் நான்முகனும்\nதான்முகமாய்ச் சங்கரனைத் தான்படைத்தான் — யான்முகமாய்\nஅந்தாதி மேலிட்டு அறிவித்தேன் ஆழ்பொருளைச்\nசிந்தாமல் கொள்மினீர் தேர்ந்து",
      "ನಾನ್ಮುಗನೈ ನಾರಾಯಣನ್ ಪಡೈತ್ತಾನ್ ನಾನ್ಮುಗನುಂ\nತಾನ್ಮುಗಮಾಯ್ಚ್ ಚಂಗರನೈತ್ ತಾನ್ಪಡೈತ್ತಾನ್ — ಯಾನ್ಮುಗಮಾಯ್\nಅಂದಾದಿ ಮೇಲಿಟ್ಟು ಅರಿವಿತ್ತೇನ್ ಆಳ್ಪೊರುಳೈಚ್\nಚಿಂದಾಮಲ್ ಕೊಳ್ಮಿನೀರ್ ತೇರ್ಂದು",
      "nāṉmugaṉai nārāyaṇaṉ paḍaittāṉ nāṉmugaṉum\ntāṉmugamāyc caṅgaraṉait tāṉpaḍaittāṉ — yāṉmugamāy\nandādi mēliṭṭu aṟivittēṉ āḻporuḷaic\ncindāmal koḷmiṉīr tērndu",
      n(
        "Narayana created the four-faced Brahma, and Brahma in turn created Shankara. In this antadi I have made known this deep truth — take it in with discernment, letting none of it slip.",
        "ನಾರಾಯಣನು ಚತುರ್ಮುಖ ಬ್ರಹ್ಮನನ್ನು ಸೃಷ್ಟಿಸಿದನು; ಬ್ರಹ್ಮನು ಶಂಕರನನ್ನು ಸೃಷ್ಟಿಸಿದನು. ಈ ಅಂದಾದಿಯಲ್ಲಿ ಆ ಆಳವಾದ ತತ್ತ್ವವನ್ನು ತಿಳಿಸಿದ್ದೇನೆ — ಒಂದೂ ಚೆಲ್ಲದಂತೆ ವಿವೇಚಿಸಿ ಸ್ವೀಕರಿಸಿರಿ.",
      ),
    ),
  },
  {
    slug: "nammalwar",
    kind: "alwar",
    tirunakshatram: 2,
    name: n("Nammalwar", "ನಮ್ಮಾಳ್ವಾರ್"),
    alsoKnownAs: n("Satakopan, Maran, Parankusan", "ಶಠಕೋಪನ್, ಮಾರನ್, ಪರಾಂಕುಶನ್"),
    birthplace: n("Tirukkurugur (Alwarthirunagari), on the Tamraparni", "ತಿರುಕ್ಕುರುಗೂರ್ (ಆಳ್ವಾರ್ ತಿರುನಗರಿ), ತಾಮ್ರಪರ್ಣಿ ತೀರ"),
    amsam: n("Vishvaksena, commander of the Lord's hosts", "ವಿಷ್ವಕ್ಸೇನ"),
    summary: n(
      "'Our own Alwar', foremost of them all, whose Tiruvaimozhi is honoured as the Tamil Veda.",
      "'ನಮ್ಮ ಆಳ್ವಾರ್' — ಆಳ್ವಾರರಲ್ಲಿ ಅಗ್ರಗಣ್ಯರು; ಅವರ ತಿರುವಾಯ್ಮೊಳಿ ದ್ರಾವಿಡ ವೇದವೆಂದು ಪೂಜಿತ.",
    ),
    life: [
      n(
        "Born to Kariyar and Udaiyanangai at Tirukkurugur, the child neither cried nor took milk. His parents laid him before the Lord, and he crawled to the hollow of the great tamarind tree by the temple, where he sat in silent yoga for sixteen years. The tree is worshipped to this day as Tiruppuliyalwar.",
        "ತಿರುಕ್ಕುರುಗೂರಿನಲ್ಲಿ ಕಾರಿಯಾರ್ ಮತ್ತು ಉಡೈಯನಂಗೈ ದಂಪತಿಗೆ ಜನಿಸಿದ ಮಗು ಅಳಲಿಲ್ಲ, ಹಾಲು ಕುಡಿಯಲಿಲ್ಲ. ತಂದೆ-ತಾಯಿ ಅವನನ್ನು ಭಗವಂತನ ಸನ್ನಿಧಿಯಲ್ಲಿಟ್ಟಾಗ, ಮಗು ದೇವಾಲಯದ ಹುಣಸೆ ಮರದ ಪೊಟರೆಗೆ ತೆವಳಿ ಹೋಗಿ ಹದಿನಾರು ವರ್ಷ ಮೌನಯೋಗದಲ್ಲಿ ಕುಳಿತಿತು. ಆ ಮರ ಇಂದಿಗೂ 'ತಿರುಪ್ಪುಳಿಯಾಳ್ವಾರ್' ಎಂದು ಪೂಜಿತವಾಗಿದೆ.",
      ),
      n(
        "Madhurakavi, following a light in the southern sky, found him and asked: 'If the small is born in the dead, what will it eat and where will it stay?' The Alwar spoke for the first time: 'That it will eat, and there it will stay.' Then poured forth Tiruvaimozhi and three other works, which Madhurakavi wrote down. Centuries later Nammalwar appeared to Nathamuni and gave him all four thousand verses of the Alwars.",
        "ದಕ್ಷಿಣ ಆಕಾಶದ ಜ್ಯೋತಿಯನ್ನು ಹಿಂಬಾಲಿಸಿ ಬಂದ ಮಧುರಕವಿಗಳು ಕೇಳಿದರು: 'ಜಡದಲ್ಲಿ ಸೂಕ್ಷ್ಮವು ಹುಟ್ಟಿದರೆ ಅದು ಏನನ್ನು ತಿನ್ನುತ್ತದೆ, ಎಲ್ಲಿ ಇರುತ್ತದೆ?' ಆಳ್ವಾರ್ ಮೊದಲ ಬಾರಿ ಮಾತನಾಡಿದರು: 'ಅದನ್ನೇ ತಿನ್ನುತ್ತದೆ, ಅಲ್ಲೇ ಇರುತ್ತದೆ.' ಆಮೇಲೆ ತಿರುವಾಯ್ಮೊಳಿ ಮತ್ತು ಇತರ ಮೂರು ಕೃತಿಗಳು ಹರಿದುಬಂದವು; ಮಧುರಕವಿಗಳು ಅವನ್ನು ಬರೆದಿಟ್ಟರು. ಶತಮಾನಗಳ ನಂತರ ನಮ್ಮಾಳ್ವಾರ್ ನಾಥಮುನಿಗಳಿಗೆ ಪ್ರತ್ಯಕ್ಷರಾಗಿ ಆಳ್ವಾರರ ನಾಲ್ಕು ಸಾವಿರ ಪಾಶುರಗಳನ್ನು ಅನುಗ್ರಹಿಸಿದರು.",
      ),
    ],
    works: [
      n("Tiruvaimozhi (1,102 verses)", "ತಿರುವಾಯ್ಮೊಳಿ (1,102 ಪಾಶುರಗಳು)"),
      n("Tiruviruttam (100)", "ತಿರುವಿರುತ್ತಂ (100)"),
      n("Tiruvasiriyam (7)", "ತಿರುವಾಸಿರಿಯಂ (7)"),
      n("Periya Tiruvandhadhi (87)", "ಪೆರಿಯ ತಿರುವಂದಾದಿ (87)"),
    ],
    composition: pasuram(
      "tn-nammalwar",
      n("Tiruvaimozhi 1.1.1 · Nammalwar", "ತಿರುವಾಯ್ಮೊಳಿ 1.1.1 · ನಮ್ಮಾಳ್ವಾರ್"),
      "உயர்வற உயர்நலம் உடையவன் யவனவன்\nமயர்வற மதிநலம் அருளினன் யவனவன்\nஅயர்வறும் அமரர்கள் அதிபதி யவனவன்\nதுயரறு சுடரடி தொழுதெழு என் மனனே",
      "ಉಯರ್ವರ ಉಯರ್ನಲಂ ಉಡೈಯವನ್ ಯವನವನ್\nಮಯರ್ವರ ಮದಿನಲಂ ಅರುಳಿನನ್ ಯವನವನ್\nಅಯರ್ವರುಂ ಅಮರರ್ಗಳ್ ಅದಿಪದಿ ಯವನವನ್\nತುಯರರು ಸುಡರಡಿ ತೊಳುದೆಳು ಎನ್ ಮನನೇ",
      "uyarvaṟa uyarnalam uḍaiyavaṉ yavaṉavaṉ\nmayarvaṟa madinalam aruḷiṉaṉ yavaṉavaṉ\nayarvaṟum amarargaḷ adipadi yavaṉavaṉ\nduyaraṟu suḍaraḍi toḻudeḻu eṉ maṉaṉē",
      n(
        "He who has the highest good, with none higher; He who dispelled my ignorance and graciously gave me knowledge and devotion; He who is Lord of the never-wearying immortals — worship His radiant feet that end all sorrow, and rise, O my mind!",
        "ತನಗಿಂತ ಮೇಲಿಲ್ಲದ ಪರಮ ಕಲ್ಯಾಣಗುಣಗಳುಳ್ಳವನು ಯಾರೋ; ಅಜ್ಞಾನವನ್ನು ಕಳೆದು ಜ್ಞಾನ-ಭಕ್ತಿಯನ್ನು ಅನುಗ್ರಹಿಸಿದವನು ಯಾರೋ; ಆಯಾಸವಿಲ್ಲದ ನಿತ್ಯಸೂರಿಗಳ ಒಡೆಯನು ಯಾರೋ — ದುಃಖವನ್ನು ನೀಗುವ ಅವನ ಪ್ರಕಾಶಮಾನ ಪಾದಗಳನ್ನು ವಂದಿಸಿ ಉದ್ಧಾರವಾಗು, ಓ ಮನವೇ!",
      ),
    ),
  },
  {
    slug: "madhurakavi-alwar",
    kind: "alwar",
    tirunakshatram: 1,
    name: n("Madhurakavi Alwar", "ಮಧುರಕವಿ ಆಳ್ವಾರ್"),
    birthplace: n("Tirukkolur, near Alwarthirunagari", "ತಿರುಕ್ಕೋಳೂರ್, ಆಳ್ವಾರ್ ತಿರುನಗರಿ ಸಮೀಪ"),
    summary: n(
      "The disciple who sang not of the Lord but of his acharya Nammalwar — the model of devotion to one's guru.",
      "ಭಗವಂತನನ್ನಲ್ಲ, ತಮ್ಮ ಆಚಾರ್ಯ ನಮ್ಮಾಳ್ವಾರರನ್ನೇ ಹಾಡಿದ ಶಿಷ್ಯ — ಗುರುಭಕ್ತಿಯ ಆದರ್ಶ.",
    ),
    life: [
      n(
        "A learned scholar from Tirukkolur, Madhurakavi was on pilgrimage in the north when he saw a brilliant light in the southern sky. He followed it for many days, all the way back to Tirukkurugur, where it led him to the young Nammalwar sitting in silence beneath the tamarind tree.",
        "ತಿರುಕ್ಕೋಳೂರಿನ ಪಂಡಿತರಾದ ಮಧುರಕವಿಗಳು ಉತ್ತರ ಭಾರತದಲ್ಲಿ ಯಾತ್ರೆಯಲ್ಲಿದ್ದಾಗ ದಕ್ಷಿಣ ಆಕಾಶದಲ್ಲಿ ಪ್ರಖರ ಜ್ಯೋತಿಯನ್ನು ಕಂಡರು. ಹಲವು ದಿನ ಅದನ್ನು ಹಿಂಬಾಲಿಸಿ ತಿರುಕ್ಕುರುಗೂರಿಗೆ ಬಂದಾಗ, ಅದು ಹುಣಸೆ ಮರದಡಿ ಮೌನವಾಗಿ ಕುಳಿತಿದ್ದ ಬಾಲ ನಮ್ಮಾಳ್ವಾರರೆಡೆಗೆ ಕರೆದೊಯ್ಯಿತು.",
      ),
      n(
        "Accepting the Alwar as his acharya, he served him for life and wrote down every verse he sang. His own eleven verses, Kanninun Siruthambu, praise only his guru — and it was by reciting them twelve thousand times that Nathamuni later received the whole Divya Prabandham.",
        "ಆಳ್ವಾರರನ್ನು ಆಚಾರ್ಯರಾಗಿ ಸ್ವೀಕರಿಸಿ ಜೀವನಪರ್ಯಂತ ಸೇವಿಸಿದರು; ಅವರು ಹಾಡಿದ ಪ್ರತಿಯೊಂದು ಪಾಶುರವನ್ನೂ ಬರೆದಿಟ್ಟರು. ಅವರ ಸ್ವಂತ ಹನ್ನೊಂದು ಪಾಶುರಗಳಾದ 'ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು' ಗುರುವನ್ನೇ ಸ್ತುತಿಸುತ್ತವೆ — ಮುಂದೆ ನಾಥಮುನಿಗಳು ಅವನ್ನು ಹನ್ನೆರಡು ಸಾವಿರ ಬಾರಿ ಜಪಿಸಿಯೇ ಸಮಗ್ರ ದಿವ್ಯ ಪ್ರಬಂಧವನ್ನು ಪಡೆದರು.",
      ),
    ],
    works: [n("Kanninun Siruthambu (11 verses)", "ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು (11 ಪಾಶುರಗಳು)")],
    composition: pasuram(
      "tn-madhurakavi",
      n("Kanninun Siruthambu 1 · Madhurakavi Alwar", "ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು 1 · ಮಧುರಕವಿ ಆಳ್ವಾರ್"),
      "கண்ணி நுண்சிறுத் தாம்பினால் கட்டுண்ணப்\nபண்ணிய பெருமாயன் என் அப்பனில்\nநண்ணித் தென்குருகூர் நம்பி என்றக்கால்\nஅண்ணிக்கும் அமுதூறும் என் நாவுக்கே",
      "ಕಣ್ಣಿ ನುಣ್ಚಿರುತ್ ತಾಂಬಿನಾಲ್ ಕಟ್ಟುಣ್ಣಪ್\nಪಣ್ಣಿಯ ಪೆರುಮಾಯನ್ ಎನ್ ಅಪ್ಪನಿಲ್\nನಣ್ಣಿತ್ ತೆನ್ಗುರುಗೂರ್ ನಂಬಿ ಎನ್ರಕ್ಕಾಲ್\nಅಣ್ಣಿಕ್ಕುಂ ಅಮುದೂರುಂ ಎನ್ ನಾವುಕ್ಕೇ",
      "kaṇṇi nuṇciṟut tāmbiṉāl kaṭṭuṇṇap\npaṇṇiya perumāyaṉ eṉ appaṉil\nnaṇṇit teṉgurugūr nambi eṉṟakkāl\naṇṇikkum amudūṟum eṉ nāvukkē",
      n(
        "Sweeter than the great wondrous Lord, my father, who let Himself be bound with a thin knotted cord — when I draw near and say 'Nambi of southern Kurugur', nectar wells up on my tongue.",
        "ತೆಳುವಾದ ಗಂಟುಹಗ್ಗದಿಂದ ಕಟ್ಟಿಸಿಕೊಂಡ ಮಹಾಮಾಯಾವಿ, ನನ್ನಪ್ಪನಾದ ಭಗವಂತನಿಗಿಂತಲೂ — 'ದಕ್ಷಿಣ ಕುರುಗೂರಿನ ನಂಬಿ' ಎಂದು ಹೇಳಿದರೆ ಸಾಕು, ನನ್ನ ನಾಲಿಗೆಯಲ್ಲಿ ಅಮೃತ ಸವಿ ಉಕ್ಕುತ್ತದೆ.",
      ),
    ),
  },
  {
    slug: "kulasekhara-alwar",
    kind: "alwar",
    tirunakshatram: 14,
    name: n("Kulasekhara Alwar", "ಕುಲಶೇಖರ ಆಳ್ವಾರ್"),
    alsoKnownAs: n("Kulasekhara Perumal", "ಕುಲಶೇಖರ ಪೆರುಮಾಳ್"),
    birthplace: n("Tiruvanchikkalam (Kollinagar), in the Chera kingdom of Kerala", "ತಿರುವಂಜಿಕ್ಕಳಂ (ಕೊಲ್ಲಿನಗರ), ಕೇರಳದ ಚೇರ ರಾಜ್ಯ"),
    amsam: n("Kaustubha, the jewel on the Lord's chest", "ಕೌಸ್ತುಭ ಮಣಿ"),
    summary: n(
      "The Chera king who gave up his throne for Sri Rama and Srirangam, and asked only to be a step before the Lord of Tirumala.",
      "ಶ್ರೀರಾಮ ಮತ್ತು ಶ್ರೀರಂಗಕ್ಕಾಗಿ ಸಿಂಹಾಸನ ತ್ಯಜಿಸಿದ ಚೇರ ರಾಜ — ತಿರುಮಲೆಯ ಸ್ವಾಮಿಯ ಮುಂದೆ ಒಂದು ಮೆಟ್ಟಿಲಾಗುವುದನ್ನೇ ಬೇಡಿದವರು.",
    ),
    life: [
      n(
        "Kulasekhara ruled the Chera land but lived for Sri Rama. Listening to the Ramayana, he once heard of Rama facing fourteen thousand demons alone and ordered his army to march to Rama's aid. His ministers, jealous of the devotees he honoured, accused them of stealing a royal jewel; the king thrust his hand into a pot holding a cobra to swear their innocence, and drew it out unharmed.",
        "ಕುಲಶೇಖರರು ಚೇರ ನಾಡನ್ನು ಆಳಿದರೂ ಶ್ರೀರಾಮನಿಗಾಗಿಯೇ ಬದುಕಿದರು. ಒಮ್ಮೆ ರಾಮಾಯಣ ಕೇಳುತ್ತಿರುವಾಗ ರಾಮನು ಒಬ್ಬನೇ ಹದಿನಾಲ್ಕು ಸಾವಿರ ರಾಕ್ಷಸರನ್ನು ಎದುರಿಸಿದ ಪ್ರಸಂಗ ಕೇಳಿ, ರಾಮನ ಸಹಾಯಕ್ಕೆ ಸೈನ್ಯ ಹೊರಡಲು ಆಜ್ಞಾಪಿಸಿದರು. ಅವರು ಗೌರವಿಸುತ್ತಿದ್ದ ಭಕ್ತರ ಮೇಲೆ ಅಸೂಯೆಗೊಂಡ ಮಂತ್ರಿಗಳು ರತ್ನಹಾರ ಕದ್ದ ಆರೋಪ ಹೊರಿಸಿದಾಗ, ರಾಜನು ನಾಗರಹಾವಿದ್ದ ಕೊಡದಲ್ಲಿ ಕೈಯಿಟ್ಟು ಅವರ ನಿರಪರಾಧಿತ್ವವನ್ನು ಸಾಬೀತುಪಡಿಸಿ, ಏನೂ ಆಗದೆ ಕೈ ಹೊರತೆಗೆದರು.",
      ),
      n(
        "He renounced the kingdom and spent his life in the Lord's shrines, chiefly Srirangam. In Perumal Tirumozhi he longs to be anything at Tirumala — a fish in its pond, a tree on its hill, and at last a step at the sanctum door to see the Lord's coral lips. That threshold is called Kulasekharan Padi to this day. He also composed the Sanskrit Mukunda Mala.",
        "ರಾಜ್ಯವನ್ನು ತ್ಯಜಿಸಿ ಭಗವಂತನ ಕ್ಷೇತ್ರಗಳಲ್ಲಿ, ಮುಖ್ಯವಾಗಿ ಶ್ರೀರಂಗದಲ್ಲಿ, ಜೀವನ ಕಳೆದರು. ಪೆರುಮಾಳ್ ತಿರುಮೊಳಿಯಲ್ಲಿ ತಿರುಮಲೆಯಲ್ಲಿ ಏನಾದರೂ ಆಗಬೇಕೆಂದು ಹಂಬಲಿಸುತ್ತಾರೆ — ಕೊಳದ ಮೀನು, ಬೆಟ್ಟದ ಮರ, ಕೊನೆಗೆ ಸ್ವಾಮಿಯ ಹವಳದ ತುಟಿಗಳನ್ನು ಕಾಣಲು ಗರ್ಭಗುಡಿಯ ಬಾಗಿಲ ಮೆಟ್ಟಿಲು. ಆ ಹೊಸ್ತಿಲು ಇಂದಿಗೂ 'ಕುಲಶೇಖರನ್ ಪಡಿ'. ಸಂಸ್ಕೃತದಲ್ಲಿ 'ಮುಕುಂದಮಾಲಾ' ಸ್ತೋತ್ರವನ್ನೂ ರಚಿಸಿದರು.",
      ),
    ],
    works: [
      n("Perumal Tirumozhi (105 verses)", "ಪೆರುಮಾಳ್ ತಿರುಮೊಳಿ (105 ಪಾಶುರಗಳು)"),
      n("Mukunda Mala (Sanskrit)", "ಮುಕುಂದಮಾಲಾ (ಸಂಸ್ಕೃತ)"),
    ],
    composition: verse("dp-kulasekhara"),
  },
  {
    slug: "periyalwar",
    kind: "alwar",
    tirunakshatram: 3,
    name: n("Periyalwar", "ಪೆರಿಯಾಳ್ವಾರ್"),
    alsoKnownAs: n("Vishnuchittar, Bhattarpiran", "ವಿಷ್ಣುಚಿತ್ತರ್, ಭಟ್ಟರ್‌ಪಿರಾನ್"),
    birthplace: n("Srivilliputhur", "ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರ್"),
    amsam: n("Garuda", "ಗರುಡ"),
    summary: n(
      "Sri Andal's father, who sang a blessing of long life over the Lord Himself — the Tiruppallandu.",
      "ಶ್ರೀ ಆಂಡಾಳರ ತಂದೆ — ಭಗವಂತನಿಗೇ ದೃಷ್ಟಿ ತಾಗದಿರಲೆಂದು 'ತಿರುಪ್ಪಲ್ಲಾಂಡು' ಮಂಗಳಾಶಾಸನ ಹಾಡಿದವರು.",
    ),
    life: [
      n(
        "Vishnuchittar kept a flower garden at Srivilliputhur and made garlands every day for Lord Vatapatrashayi. Called to the Pandya king's court at Madurai, where a purse of gold hung for whoever could prove the Supreme, he showed from the Vedas that Narayana alone is supreme — and the purse bent down to him of itself.",
        "ವಿಷ್ಣುಚಿತ್ತರು ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರಿನಲ್ಲಿ ಹೂದೋಟ ಬೆಳೆಸಿ ಪ್ರತಿದಿನ ವಟಪತ್ರಶಾಯಿಗೆ ಹೂಮಾಲೆ ಕಟ್ಟುತ್ತಿದ್ದರು. ಪರತತ್ತ್ವವನ್ನು ಸಾಧಿಸಿದವರಿಗೆ ಚಿನ್ನದ ಚೀಲ ತೂಗುಹಾಕಿದ್ದ ಮಧುರೆಯ ಪಾಂಡ್ಯ ರಾಜನ ಸಭೆಗೆ ಕರೆಯಲ್ಪಟ್ಟು, ನಾರಾಯಣನೇ ಪರದೈವವೆಂದು ವೇದಗಳಿಂದ ಸ್ಥಾಪಿಸಿದರು — ಚೀಲ ತಾನಾಗಿಯೇ ಅವರೆಡೆಗೆ ಬಾಗಿತು.",
      ),
      n(
        "As the king took him round the city on an elephant, the Lord appeared in the sky on Garuda. Fearing the evil eye might fall on Him, the Alwar sang Pallandu — 'Many years, many years!' — which opens every recital of the Divya Prabandham. In his garden he later found a baby girl beneath a tulasi plant: Sri Andal.",
        "ರಾಜನು ಅವರನ್ನು ಆನೆಯ ಮೇಲೆ ನಗರ ಪ್ರದಕ್ಷಿಣೆ ಮಾಡಿಸುತ್ತಿದ್ದಾಗ ಭಗವಂತನು ಗರುಡನ ಮೇಲೆ ಆಕಾಶದಲ್ಲಿ ಪ್ರತ್ಯಕ್ಷನಾದನು. ಅವನಿಗೆ ದೃಷ್ಟಿ ತಾಗೀತೆಂದು ಆತಂಕಗೊಂಡ ಆಳ್ವಾರ್ 'ಪಲ್ಲಾಂಡು ಪಲ್ಲಾಂಡು' ಎಂದು ಹಾಡಿದರು — ದಿವ್ಯ ಪ್ರಬಂಧದ ಪ್ರತಿ ಪಾರಾಯಣವೂ ಇದರಿಂದಲೇ ಆರಂಭ. ಮುಂದೆ ತಮ್ಮ ತೋಟದ ತುಳಸಿಗಿಡದಡಿ ಒಂದು ಹೆಣ್ಣು ಮಗುವನ್ನು ಕಂಡರು: ಶ್ರೀ ಆಂಡಾಳ್.",
      ),
    ],
    works: [
      n("Tiruppallandu (12 verses)", "ತಿರುಪ್ಪಲ್ಲಾಂಡು (12 ಪಾಶುರಗಳು)"),
      n("Periyalwar Tirumozhi (461 verses), on Krishna's childhood", "ಪೆರಿಯಾಳ್ವಾರ್ ತಿರುಮೊಳಿ (461), ಕೃಷ್ಣನ ಬಾಲಲೀಲೆ"),
    ],
    composition: pasuram(
      "tn-periyalwar",
      n("Tiruppallandu 1 · Periyalwar", "ತಿರುಪ್ಪಲ್ಲಾಂಡು 1 · ಪೆರಿಯಾಳ್ವಾರ್"),
      "பல்லாண்டு பல்லாண்டு பல்லாயிரத் தாண்டு\nபலகோடி நூறாயிரம்\nமல்லாண்ட திண்தோள் மணிவண்ணா உன்\nசேவடி செவ்வி திருக்காப்பு",
      "ಪಲ್ಲಾಂಡು ಪಲ್ಲಾಂಡು ಪಲ್ಲಾಯಿರತ್ ತಾಂಡು\nಪಲಕೋಡಿ ನೂರಾಯಿರಂ\nಮಲ್ಲಾಂಡ ತಿಣ್ಡೋಳ್ ಮಣಿವಣ್ಣಾ ಉನ್\nಸೇವಡಿ ಸೆವ್ವಿ ತಿರುಕ್ಕಾಪ್ಪು",
      "pallāṇḍu pallāṇḍu pallāyirat tāṇḍu\npalakōḍi nūṟāyiram\nmallāṇḍa tiṇḍōḷ maṇivaṇṇā uṉ\nsēvaḍi sevvi tirukkāppu",
      n(
        "Many years, many years, many thousands of years, many crores of hundred-thousands of years — O sapphire-hued Lord whose strong shoulders vanquished the wrestlers, may Your beautiful red feet be ever safe!",
        "ಹಲವು ವರ್ಷ, ಹಲವು ವರ್ಷ, ಸಾವಿರಾರು ವರ್ಷ, ಕೋಟಿ ಕೋಟಿ ಲಕ್ಷ ವರ್ಷ — ಮಲ್ಲರನ್ನು ಗೆದ್ದ ದೃಢ ಭುಜಗಳ ನೀಲಮಣಿವರ್ಣನೇ, ನಿನ್ನ ಸುಂದರ ಕೆಂಪು ಪಾದಗಳಿಗೆ ಸದಾ ರಕ್ಷೆಯಿರಲಿ!",
      ),
    ),
  },
  {
    slug: "andal",
    kind: "alwar",
    tirunakshatram: 4,
    name: n("Sri Andal (Goda Devi)", "ಶ್ರೀ ಆಂಡಾಳ್ (ಗೋದಾದೇವಿ)"),
    alsoKnownAs: n("Kodhai, Soodikodutha Sudarkodi", "ಕೋದೈ, ಸೂಡಿಕ್ಕೊಡುತ್ತ ಸುಡರ್ಕೊಡಿ"),
    birthplace: n("Under a tulasi plant in Periyalwar's garden, Srivilliputhur", "ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರಿನಲ್ಲಿ ಪೆರಿಯಾಳ್ವಾರರ ತೋಟದ ತುಳಸಿಗಿಡದಡಿ"),
    amsam: n("Bhudevi", "ಭೂದೇವಿ"),
    summary: n(
      "The only woman among the Alwars, who wore the Lord's garland before offering it, sang the Tiruppavai, and wed Sri Ranganatha.",
      "ಆಳ್ವಾರರಲ್ಲಿ ಏಕೈಕ ಸ್ತ್ರೀ — ಭಗವಂತನ ಮಾಲೆಯನ್ನು ತಾನು ಧರಿಸಿ ಅರ್ಪಿಸಿದವಳು, ತಿರುಪ್ಪಾವೈ ಹಾಡಿದವಳು, ಶ್ರೀ ರಂಗನಾಥನನ್ನು ವರಿಸಿದವಳು.",
    ),
    life: [
      n(
        "Periyalwar found her as a baby beneath the tulasi in his garden and named her Kodhai. She grew up hearing of Krishna and resolved to marry none but the Lord. Secretly she would wear the garland meant for Him, look at herself in the well, and put it back. When her father found out and made a fresh garland, the Lord would not accept it: He wanted only the one she had worn. So she is 'the radiant one who gave after wearing'.",
        "ಪೆರಿಯಾಳ್ವಾರರು ತಮ್ಮ ತೋಟದ ತುಳಸಿಯಡಿ ಮಗುವನ್ನು ಕಂಡು 'ಕೋದೈ' ಎಂದು ಹೆಸರಿಟ್ಟರು. ಕೃಷ್ಣನ ಕಥೆ ಕೇಳುತ್ತಾ ಬೆಳೆದ ಅವಳು ಭಗವಂತನನ್ನಲ್ಲದೆ ಬೇರೆ ಯಾರನ್ನೂ ಮದುವೆಯಾಗುವುದಿಲ್ಲವೆಂದು ನಿಶ್ಚಯಿಸಿದಳು. ಸ್ವಾಮಿಗಾಗಿ ಕಟ್ಟಿದ ಮಾಲೆಯನ್ನು ಗುಟ್ಟಾಗಿ ಧರಿಸಿ, ಬಾವಿಯ ನೀರಿನಲ್ಲಿ ನೋಡಿಕೊಂಡು ಮರಳಿ ಇಡುತ್ತಿದ್ದಳು. ತಂದೆ ಇದನ್ನು ಕಂಡು ಹೊಸ ಮಾಲೆ ಕಟ್ಟಿದಾಗ, ಸ್ವಾಮಿ ಅದನ್ನು ಸ್ವೀಕರಿಸದೆ ಅವಳು ಧರಿಸಿದ ಮಾಲೆಯನ್ನೇ ಬಯಸಿದನು. ಆದ್ದರಿಂದಲೇ ಅವಳು 'ಸೂಡಿಕ್ಕೊಡುತ್ತ ಸುಡರ್ಕೊಡಿ'.",
      ),
      n(
        "Imagining herself a cowherd girl of Vrindavan, she sang the thirty verses of the Tiruppavai, sung every Margazhi before dawn, and the Nachiyar Tirumozhi, including her dream of her wedding. At the Lord's command she was brought as a bride to Srirangam, where she merged into Sri Ranganatha.",
        "ತಾನು ವೃಂದಾವನದ ಗೋಪಿಕೆಯೆಂದು ಭಾವಿಸಿ ಮೂವತ್ತು ಪಾಶುರಗಳ ತಿರುಪ್ಪಾವೈ ಹಾಡಿದಳು — ಪ್ರತಿ ಮಾರ್ಗಳಿಯಲ್ಲಿ ಉಷಃಕಾಲದಲ್ಲಿ ಹಾಡಲಾಗುತ್ತದೆ; ತನ್ನ ವಿವಾಹದ ಕನಸನ್ನು ವರ್ಣಿಸುವ ನಾಚ್ಚಿಯಾರ್ ತಿರುಮೊಳಿಯನ್ನೂ ಹಾಡಿದಳು. ಸ್ವಾಮಿಯ ಆಜ್ಞೆಯಂತೆ ವಧುವಾಗಿ ಶ್ರೀರಂಗಕ್ಕೆ ಕರೆತರಲ್ಪಟ್ಟು ಶ್ರೀ ರಂಗನಾಥನಲ್ಲಿ ಐಕ್ಯಳಾದಳು.",
      ),
    ],
    works: [
      n("Tiruppavai (30 verses)", "ತಿರುಪ್ಪಾವೈ (30 ಪಾಶುರಗಳು)"),
      n("Nachiyar Tirumozhi (143 verses)", "ನಾಚ್ಚಿಯಾರ್ ತಿರುಮೊಳಿ (143 ಪಾಶುರಗಳು)"),
    ],
    composition: andalTiruppavai1,
  },
  {
    slug: "thondaradippodi-alwar",
    kind: "alwar",
    tirunakshatram: 12,
    name: n("Thondaradippodi Alwar", "ತೊಂಡರಡಿಪ್ಪೊಡಿ ಆಳ್ವಾರ್"),
    alsoKnownAs: n("Vipranarayana", "ವಿಪ್ರನಾರಾಯಣ"),
    birthplace: n("Tirumandangudi, near Kumbakonam", "ತಿರುಮಂಡಂಗುಡಿ, ಕುಂಭಕೋಣ ಸಮೀಪ"),
    amsam: n("Vanamala, the Lord's garland", "ವನಮಾಲೆ"),
    summary: n(
      "The garland-maker of Srirangam who fell, was lifted by the Lord, and became 'the dust at the feet of devotees'. He wakes the Lord each morning with Tiruppalliyezhuchi.",
      "ಶ್ರೀರಂಗದ ಹೂಮಾಲೆ ಸೇವಕ — ಜಾರಿ ಬಿದ್ದು ಭಗವಂತನಿಂದ ಎತ್ತಲ್ಪಟ್ಟು 'ಭಕ್ತರ ಪಾದಧೂಳಿ'ಯಾದವರು; ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ತಿರುಪ್ಪಳ್ಳಿಯೆಳುಚ್ಚಿಯಿಂದ ಸ್ವಾಮಿಯನ್ನು ಎಬ್ಬಿಸುವವರು.",
    ),
    life: [
      n(
        "Vipranarayana tended a flower garden at Srirangam and made garlands for Sri Ranganatha. He fell under the spell of a dancer, Devadevi, and lost all he had. The Lord, taking pity, sent her a golden vessel from the temple in his name; when it was missed, Vipranarayana was arrested for theft, until the Lord revealed the truth to the king in a dream.",
        "ವಿಪ್ರನಾರಾಯಣರು ಶ್ರೀರಂಗದಲ್ಲಿ ಹೂದೋಟ ಬೆಳೆಸಿ ಶ್ರೀ ರಂಗನಾಥನಿಗೆ ಮಾಲೆ ಕಟ್ಟುತ್ತಿದ್ದರು. ದೇವದೇವಿ ಎಂಬ ನರ್ತಕಿಯ ಮೋಹಕ್ಕೆ ಸಿಲುಕಿ ಸರ್ವಸ್ವವನ್ನೂ ಕಳೆದುಕೊಂಡರು. ಕರುಣೆಗೊಂಡ ಭಗವಂತನು ದೇವಾಲಯದ ಚಿನ್ನದ ಪಾತ್ರೆಯನ್ನು ಅವರ ಹೆಸರಿನಲ್ಲಿ ಅವಳಿಗೆ ಕಳುಹಿಸಿದನು; ಪಾತ್ರೆ ಕಾಣೆಯಾದಾಗ ವಿಪ್ರನಾರಾಯಣರು ಕಳ್ಳತನದ ಆರೋಪದಲ್ಲಿ ಬಂಧಿತರಾದರು — ಕೊನೆಗೆ ಭಗವಂತನೇ ರಾಜನ ಕನಸಿನಲ್ಲಿ ಸತ್ಯವನ್ನು ತಿಳಿಸಿದನು.",
      ),
      n(
        "Shaken by the Lord's grace, he gave himself to the service of devotees and took the name Thondaradippodi, 'dust at the feet of the Lord's servants'. His Tirumalai sings of Srirangam's Lord, and his ten verses of Tiruppalliyezhuchi are sung to wake the Lord in temples every morning.",
        "ಭಗವಂತನ ಕೃಪೆಯಿಂದ ಮನಪರಿವರ್ತನೆಗೊಂಡು ಭಕ್ತಸೇವೆಗೆ ತಮ್ಮನ್ನು ಅರ್ಪಿಸಿಕೊಂಡು 'ತೊಂಡರಡಿಪ್ಪೊಡಿ' — ಭಗವದ್ದಾಸರ ಪಾದಧೂಳಿ — ಎಂಬ ಹೆಸರು ಪಡೆದರು. ಅವರ ತಿರುಮಾಲೈ ಶ್ರೀರಂಗನಾಥನನ್ನು ಹಾಡುತ್ತದೆ; ಹತ್ತು ಪಾಶುರಗಳ ತಿರುಪ್ಪಳ್ಳಿಯೆಳುಚ್ಚಿ ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ದೇವಾಲಯಗಳಲ್ಲಿ ಸ್ವಾಮಿಯನ್ನು ಎಬ್ಬಿಸಲು ಹಾಡಲಾಗುತ್ತದೆ.",
      ),
    ],
    works: [
      n("Tirumalai (45 verses)", "ತಿರುಮಾಲೈ (45 ಪಾಶುರಗಳು)"),
      n("Tiruppalliyezhuchi (10 verses)", "ತಿರುಪ್ಪಳ್ಳಿಯೆಳುಚ್ಚಿ (10 ಪಾಶುರಗಳು)"),
    ],
    composition: verse("dp-pacchaimamalai"),
  },
  {
    slug: "tiruppanalwar",
    kind: "alwar",
    tirunakshatram: 11,
    name: n("Tiruppanalwar", "ತಿರುಪ್ಪಾಣಾಳ್ವಾರ್"),
    alsoKnownAs: n("Munivahana, Yogivahana", "ಮುನಿವಾಹನ, ಯೋಗಿವಾಹನ"),
    birthplace: n("Uraiyur, near Srirangam", "ಉರೈಯೂರ್, ಶ್ರೀರಂಗ ಸಮೀಪ"),
    amsam: n("Srivatsa, the mark on the Lord's chest", "ಶ್ರೀವತ್ಸ"),
    summary: n(
      "The bard who sang from across the Kaveri, and whom the Lord had carried into His sanctum on a priest's shoulders.",
      "ಕಾವೇರಿಯ ಆಚೆ ದಡದಿಂದಲೇ ಹಾಡುತ್ತಿದ್ದ ಗಾಯಕ — ಭಗವಂತನೇ ಅರ್ಚಕರ ಹೆಗಲ ಮೇಲೆ ಅವರನ್ನು ಗರ್ಭಗುಡಿಗೆ ಕರೆಸಿಕೊಂಡನು.",
    ),
    life: [
      n(
        "Raised in a family of panar, wandering minstrels, at Uraiyur, he would not set foot on the island of Srirangam, thinking himself unworthy, and sang to the Lord from the far bank of the Kaveri. One day the priest Lokasaranga Muni, coming for water, found him lost in song in the way and threw a stone that cut his forehead.",
        "ಉರೈಯೂರಿನ ಪಾಣರ್ (ಅಲೆಮಾರಿ ಗಾಯಕರ) ಕುಟುಂಬದಲ್ಲಿ ಬೆಳೆದ ಅವರು, ತಾವು ಅನರ್ಹರೆಂದು ಭಾವಿಸಿ ಶ್ರೀರಂಗ ದ್ವೀಪಕ್ಕೆ ಕಾಲಿಡದೆ, ಕಾವೇರಿಯ ಆಚೆ ದಡದಿಂದಲೇ ಸ್ವಾಮಿಯನ್ನು ಹಾಡುತ್ತಿದ್ದರು. ಒಂದು ದಿನ ನೀರು ತರಲು ಬಂದ ಅರ್ಚಕ ಲೋಕಸಾರಂಗ ಮುನಿಗಳು ದಾರಿಯಲ್ಲಿ ಹಾಡಿನಲ್ಲಿ ಮುಳುಗಿದ್ದ ಅವರ ಮೇಲೆ ಕಲ್ಲೆಸೆದರು; ಅವರ ಹಣೆಗೆ ಗಾಯವಾಯಿತು.",
      ),
      n(
        "That day the priest found the Lord's own forehead bleeding, and was told to carry the Alwar into the temple on his shoulders. Seeing Sri Ranganatha from His feet to His crown, the Alwar sang the ten verses of Amalanadhipiran, and merged into the Lord.",
        "ಅಂದು ಅರ್ಚಕರು ಸ್ವಾಮಿಯ ಹಣೆಯಿಂದಲೇ ರಕ್ತ ಸುರಿಯುತ್ತಿರುವುದನ್ನು ಕಂಡರು; ಆಳ್ವಾರರನ್ನು ಹೆಗಲ ಮೇಲೆ ಹೊತ್ತು ದೇವಾಲಯಕ್ಕೆ ಕರೆತರಬೇಕೆಂದು ಆಜ್ಞೆಯಾಯಿತು. ಶ್ರೀ ರಂಗನಾಥನನ್ನು ಪಾದದಿಂದ ಕಿರೀಟದವರೆಗೆ ಕಂಡು ಆಳ್ವಾರ್ ಹತ್ತು ಪಾಶುರಗಳ 'ಅಮಲನಾದಿಪಿರಾನ್' ಹಾಡಿ ಸ್ವಾಮಿಯಲ್ಲಿ ಐಕ್ಯರಾದರು.",
      ),
    ],
    works: [n("Amalanadhipiran (10 verses)", "ಅಮಲನಾದಿಪಿರಾನ್ (10 ಪಾಶುರಗಳು)")],
    composition: pasuram(
      "tn-tiruppan",
      n("Amalanadhipiran 1 · Tiruppanalwar", "ಅಮಲನಾದಿಪಿರಾನ್ 1 · ತಿರುಪ್ಪಾಣಾಳ್ವಾರ್"),
      "அமலன் ஆதிபிரான் அடியார்க்கு என்னை ஆட்படுத்த\nவிமலன் விண்ணவர் கோன் விரையார் பொழில் வேங்கடவன்\nநிமலன் நின்மலன் நீதி வானவன் நீள்மதில் அரங்கத்து அம்மான் திருக்\nகமல பாதம் வந்து என் கண்ணின் உள்ளன ஒக்கின்றதே",
      "ಅಮಲನ್ ಆದಿಪಿರಾನ್ ಅಡಿಯಾರ್ಕ್ಕು ಎನ್ನೈ ಆಟ್ಪಡುತ್ತ\nವಿಮಲನ್ ವಿಣ್ಣವರ್ ಕೋನ್ ವಿರೈಯಾರ್ ಪೊಳಿಲ್ ವೇಂಗಡವನ್\nನಿಮಲನ್ ನಿನ್ಮಲನ್ ನೀದಿ ವಾನವನ್ ನೀಳ್ಮದಿಲ್ ಅರಂಗತ್ತು ಅಮ್ಮಾನ್ ತಿರುಕ್\nಕಮಲ ಪಾದಂ ವಂದು ಎನ್ ಕಣ್ಣಿನ್ ಉಳ್ಳನ ಒಕ್ಕಿನ್ರದೇ",
      "amalaṉ ādipirāṉ aḍiyārkku eṉṉai āṭpaḍutta\nvimalaṉ viṇṇavar kōṉ viraiyār poḻil vēṅgaḍavaṉ\nnimalaṉ niṉmalaṉ nīdi vāṉavaṉ nīḷmadil araṅgattu ammāṉ tiruk\nkamala pādam vandu eṉ kaṇṇiṉ uḷḷaṉa okkiṉṟadē",
      n(
        "The Pure One, the First Lord, the Spotless One who made me a servant of His devotees, King of the celestials, Lord of Venkatam amid fragrant groves, the Lord of long-walled Srirangam — His holy lotus feet seem to have come and entered my eyes.",
        "ನಿರ್ಮಲನು, ಆದಿದೇವನು, ತನ್ನ ಭಕ್ತರಿಗೆ ನನ್ನನ್ನು ದಾಸನನ್ನಾಗಿಸಿದ ವಿಮಲನು, ದೇವತೆಗಳ ಒಡೆಯನು, ಸುಗಂಧ ತೋಪುಗಳ ವೇಂಕಟಾಚಲವಾಸಿ, ಎತ್ತರದ ಕೋಟೆಗಳ ಶ್ರೀರಂಗದ ಸ್ವಾಮಿ — ಅವನ ಪವಿತ್ರ ಪಾದಕಮಲಗಳು ಬಂದು ನನ್ನ ಕಣ್ಣೊಳಗೆ ಸೇರಿದಂತಿವೆ.",
      ),
    ),
  },
  {
    slug: "tirumangai-alwar",
    kind: "alwar",
    tirunakshatram: 10,
    name: n("Tirumangai Alwar", "ತಿರುಮಂಗೈ ಆಳ್ವಾರ್"),
    alsoKnownAs: n("Parakalan, Kaliyan, Neelan", "ಪರಕಾಲನ್, ಕಲಿಯನ್, ನೀಲನ್"),
    birthplace: n("Tirukkuraiyalur, near Sirkazhi", "ತಿರುಕ್ಕುರೈಯಲೂರ್, ಸೀರ್ಕಾಳಿ ಸಮೀಪ"),
    amsam: n("Sharnga, the Lord's bow", "ಶಾರ್ಙ್ಗ ಧನುಸ್ಸು"),
    summary: n(
      "The chieftain-turned-highwayman whom the Lord Himself waylaid and initiated, and who sang of more Divya Desams than any other Alwar.",
      "ಸಾಮಂತನಾಗಿ, ನಂತರ ದಾರಿಗಳ್ಳನಾಗಿ, ಭಗವಂತನಿಂದಲೇ ತಡೆದು ಉಪದೇಶ ಪಡೆದವರು — ಎಲ್ಲ ಆಳ್ವಾರರಿಗಿಂತ ಹೆಚ್ಚು ದಿವ್ಯದೇಶಗಳನ್ನು ಹಾಡಿದವರು.",
    ),
    life: [
      n(
        "Neelan was a warrior chieftain of Tirumangai under the Chola king. He wished to marry Kumudavalli, who asked that he first feed a thousand and eight Srivaishnavas every day. When his treasury ran dry he took to waylaying travellers to keep the vow. One night he robbed a wedding party at Tiruvali-Tirunagari, but could not prise a ring from the bridegroom's toe — the bridegroom was the Lord, who whispered the eight-syllable mantra into his ear.",
        "ನೀಲನ್ ಚೋಳ ರಾಜನಡಿ ತಿರುಮಂಗೈ ಪ್ರದೇಶದ ಯೋಧ ಸಾಮಂತ. ಕುಮುದವಲ್ಲಿಯನ್ನು ಮದುವೆಯಾಗಬಯಸಿದಾಗ, ಪ್ರತಿದಿನ ಸಾವಿರದ ಎಂಟು ಶ್ರೀವೈಷ್ಣವರಿಗೆ ಅನ್ನದಾನ ಮಾಡಬೇಕೆಂದು ಅವಳು ಕೇಳಿದಳು. ಖಜಾನೆ ಬರಿದಾದಾಗ ವ್ರತ ಮುಂದುವರಿಸಲು ದಾರಿಹೋಕರನ್ನು ದೋಚತೊಡಗಿದರು. ಒಂದು ರಾತ್ರಿ ತಿರುವಾಲಿ-ತಿರುನಗರಿಯಲ್ಲಿ ಮದುವೆ ದಿಬ್ಬಣವನ್ನು ದೋಚಿದರು, ಆದರೆ ವರನ ಕಾಲುಂಗುರವನ್ನು ಬಿಚ್ಚಲಾಗಲಿಲ್ಲ — ಆ ವರನೇ ಭಗವಂತ; ಅವನು ಅವರ ಕಿವಿಯಲ್ಲಿ ಅಷ್ಟಾಕ್ಷರ ಮಂತ್ರವನ್ನು ಉಪದೇಶಿಸಿದನು.",
      ),
      n(
        "Transformed, he burst out 'I have found the name — Narayana!' and travelled to shrine after shrine, singing of eighty-six Divya Desams. He served Srirangam too, building its walls and halls. His six works are honoured as the six Angas of Nammalwar's Tamil Veda.",
        "ಪರಿವರ್ತನೆಗೊಂಡ ಅವರು 'ನಾರಾಯಣ ಎಂಬ ನಾಮವನ್ನು ಕಂಡುಕೊಂಡೆ!' ಎಂದು ಹಾಡಿ, ಕ್ಷೇತ್ರದಿಂದ ಕ್ಷೇತ್ರಕ್ಕೆ ಸಂಚರಿಸಿ ಎಂಬತ್ತಾರು ದಿವ್ಯದೇಶಗಳನ್ನು ಹಾಡಿದರು. ಶ್ರೀರಂಗದ ಕೋಟೆ-ಮಂಟಪಗಳನ್ನು ಕಟ್ಟಿಸಿ ಸೇವೆ ಸಲ್ಲಿಸಿದರು. ಅವರ ಆರು ಕೃತಿಗಳು ನಮ್ಮಾಳ್ವಾರರ ದ್ರಾವಿಡ ವೇದಕ್ಕೆ ಆರು ಅಂಗಗಳೆಂದು ಪೂಜಿತ.",
      ),
    ],
    works: [
      n("Periya Tirumozhi (1,084 verses)", "ಪೆರಿಯ ತಿರುಮೊಳಿ (1,084 ಪಾಶುರಗಳು)"),
      n("Tirukkurunthandakam (20) and Tirunedunthandakam (30)", "ತಿರುಕ್ಕುರುಂದಾಂಡಕಂ (20), ತಿರುನೆಡುಂದಾಂಡಕಂ (30)"),
      n("Tiruvezhukkootrirukkai, Siriya and Periya Tirumadal", "ತಿರುವೆಳುಕ್ಕೂಟ್ರಿರುಕ್ಕೈ, ಸಿರಿಯ ಮತ್ತು ಪೆರಿಯ ತಿರುಮಡಲ್"),
    ],
    composition: verse("dp-narayana"),
  },

  // ── The Acharyas ────────────────────────────────────────────────────────
  {
    slug: "nathamuni",
    kind: "acharya",
    tirunakshatram: 17,
    name: n("Sriman Nathamuni", "ಶ್ರೀಮನ್ನಾಥಮುನಿಗಳು"),
    alsoKnownAs: n("Ranganathamuni", "ರಂಗನಾಥಮುನಿ"),
    birthplace: n("Kattumannarkoil (Veeranarayanapuram)", "ಕಾಟ್ಟುಮನ್ನಾರ್‌ಕೋಯಿಲ್ (ವೀರನಾರಾಯಣಪುರ)"),
    period: n("9th–10th century CE", "ಕ್ರಿ.ಶ. 9–10ನೇ ಶತಮಾನ"),
    summary: n(
      "The first of the Acharyas, who recovered the lost four thousand verses of the Alwars and set them to music.",
      "ಮೊದಲ ಆಚಾರ್ಯರು — ಕಳೆದುಹೋಗಿದ್ದ ಆಳ್ವಾರರ ನಾಲ್ಕು ಸಾವಿರ ಪಾಶುರಗಳನ್ನು ಮರಳಿ ಪಡೆದು ಸಂಗೀತಕ್ಕೆ ಅಳವಡಿಸಿದವರು.",
    ),
    life: [
      n(
        "One day at Kattumannarkoil, Nathamuni heard pilgrims from Kumbakonam sing ten verses beginning 'Aravamudhe', which ended by calling them 'ten of the thousand sung by Satakopan of Kurugur'. No one knew the rest. He went to Tirukkurugur and, as Madhurakavi's descendants advised, recited Kanninun Siruthambu twelve thousand times in yoga.",
        "ಒಂದು ದಿನ ಕಾಟ್ಟುಮನ್ನಾರ್‌ಕೋಯಿಲ್‌ನಲ್ಲಿ ಕುಂಭಕೋಣದಿಂದ ಬಂದ ಯಾತ್ರಿಕರು 'ಆರಾವಮುದೇ' ಎಂದು ಆರಂಭವಾಗುವ ಹತ್ತು ಪಾಶುರಗಳನ್ನು ಹಾಡುವುದನ್ನು ನಾಥಮುನಿಗಳು ಕೇಳಿದರು; ಅವು 'ಕುರುಗೂರಿನ ಶಠಕೋಪನ್ ಹಾಡಿದ ಸಾವಿರದಲ್ಲಿ ಈ ಹತ್ತು' ಎಂದು ಮುಗಿಯುತ್ತಿದ್ದವು. ಉಳಿದವು ಯಾರಿಗೂ ತಿಳಿದಿರಲಿಲ್ಲ. ಅವರು ತಿರುಕ್ಕುರುಗೂರಿಗೆ ಹೋಗಿ, ಮಧುರಕವಿಗಳ ವಂಶಸ್ಥರ ಸಲಹೆಯಂತೆ ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬನ್ನು ಯೋಗದಲ್ಲಿ ಹನ್ನೆರಡು ಸಾವಿರ ಬಾರಿ ಜಪಿಸಿದರು.",
      ),
      n(
        "Nammalwar appeared to him and gave him not only the thousand but all four thousand verses of the Alwars, with their meaning. Nathamuni arranged them as the Nalayira Divya Prabandham, set them to music, and taught them to his nephews, beginning the Araiyar tradition of singing them before the Lord. He was the grandfather of Alavandar.",
        "ನಮ್ಮಾಳ್ವಾರರು ಪ್ರತ್ಯಕ್ಷರಾಗಿ ಆ ಸಾವಿರವಷ್ಟೇ ಅಲ್ಲ, ಆಳ್ವಾರರ ನಾಲ್ಕು ಸಾವಿರ ಪಾಶುರಗಳನ್ನೂ ಅರ್ಥಸಹಿತ ಅನುಗ್ರಹಿಸಿದರು. ನಾಥಮುನಿಗಳು ಅವನ್ನು 'ನಾಲಾಯಿರ ದಿವ್ಯ ಪ್ರಬಂಧ'ವಾಗಿ ಸಂಕಲಿಸಿ, ಸಂಗೀತಕ್ಕೆ ಅಳವಡಿಸಿ, ತಮ್ಮ ಸೋದರಳಿಯರಿಗೆ ಕಲಿಸಿದರು — ಭಗವಂತನ ಮುಂದೆ ಅವನ್ನು ಹಾಡುವ ಅರೈಯರ್ ಸಂಪ್ರದಾಯ ಹೀಗೆ ಆರಂಭವಾಯಿತು. ಆಳವಂದಾರರ ಅಜ್ಜ ಇವರೇ.",
      ),
    ],
    works: [n("Nyaya Tattva and Yoga Rahasya (known only through later quotations)", "ನ್ಯಾಯತತ್ತ್ವ, ಯೋಗರಹಸ್ಯ (ನಂತರದ ಉಲ್ಲೇಖಗಳಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯ)")],
    composition: sloka(
      "tn-nathamuni",
      n("Stotra Ratnam 1 · Alavandar, in praise of Nathamuni", "ಸ್ತೋತ್ರರತ್ನ 1 · ನಾಥಮುನಿಗಳ ಸ್ತುತಿ (ಆಳವಂದಾರ್)"),
      "ನಮೋಽಚಿಂತ್ಯಾದ್ಭುತಾಕ್ಲಿಷ್ಟಜ್ಞಾನವೈರಾಗ್ಯರಾಶಯೇ ।\nನಾಥಾಯ ಮುನಯೇಽಗಾಧಭಗವದ್ಭಕ್ತಿಸಿಂಧವೇ ॥",
      "namo 'cintyādbhutākliṣṭajñānavairāgyarāśaye |\nnāthāya munaye 'gādhabhagavadbhaktisindhave ||",
      n(
        "Salutations to Nathamuni — a treasury of knowledge and detachment, unthinkable, wondrous and effortless — an unfathomable ocean of devotion to the Lord.",
        "ಅಚಿಂತ್ಯವೂ ಅದ್ಭುತವೂ ಸಹಜವೂ ಆದ ಜ್ಞಾನ-ವೈರಾಗ್ಯಗಳ ನಿಧಿಯಾದ, ಅಗಾಧ ಭಗವದ್ಭಕ್ತಿಯ ಸಾಗರವಾದ ನಾಥಮುನಿಗಳಿಗೆ ನಮಸ್ಕಾರ.",
      ),
    ),
  },
  {
    slug: "alavandar",
    kind: "acharya",
    tirunakshatram: 18,
    name: n("Alavandar (Yamunacharya)", "ಆಳವಂದಾರ್ (ಯಾಮುನಾಚಾರ್ಯ)"),
    birthplace: n("Kattumannarkoil", "ಕಾಟ್ಟುಮನ್ನಾರ್‌ಕೋಯಿಲ್"),
    period: n("10th–11th century CE", "ಕ್ರಿ.ಶ. 10–11ನೇ ಶತಮಾನ"),
    summary: n(
      "Nathamuni's grandson, the boy-scholar who won half a kingdom, gave it up for Srirangam, and chose Ramanuja as his successor.",
      "ನಾಥಮುನಿಗಳ ಮೊಮ್ಮಗ — ಅರ್ಧ ರಾಜ್ಯ ಗೆದ್ದು, ಶ್ರೀರಂಗಕ್ಕಾಗಿ ಅದನ್ನು ತ್ಯಜಿಸಿ, ರಾಮಾನುಜರನ್ನು ಉತ್ತರಾಧಿಕಾರಿಯಾಗಿ ಆರಿಸಿದ ಬಾಲಪಂಡಿತ.",
    ),
    life: [
      n(
        "Yamuna was a boy of twelve when he defeated the Chola court scholar Akki Alvan in debate. The delighted queen called him 'Alavandar' — the one who came to rule us — and the king gave him half the kingdom. Manakkal Nambi, a disciple in Nathamuni's line, won his attention by sending him the greens he loved, and then led him to Srirangam. Seeing Sri Ranganatha, Alavandar gave up his kingdom.",
        "ಹನ್ನೆರಡು ವರ್ಷದ ಬಾಲಕ ಯಾಮುನರು ಚೋಳ ಆಸ್ಥಾನ ಪಂಡಿತ ಅಕ್ಕಿಯಾಳ್ವಾನನ್ನು ವಾದದಲ್ಲಿ ಸೋಲಿಸಿದರು. ಸಂತೋಷಗೊಂಡ ರಾಣಿ ಅವರನ್ನು 'ಆಳವಂದಾರ್' — ನಮ್ಮನ್ನು ಆಳಲು ಬಂದವರು — ಎಂದು ಕರೆದಳು; ರಾಜನು ಅರ್ಧ ರಾಜ್ಯ ನೀಡಿದನು. ನಾಥಮುನಿಗಳ ಪರಂಪರೆಯ ಮಣಕ್ಕಾಲ್ ನಂಬಿಗಳು ಅವರಿಗೆ ಇಷ್ಟವಾದ ಸೊಪ್ಪನ್ನು ಕಳುಹಿಸುತ್ತಾ ಅವರ ಗಮನ ಸೆಳೆದು, ಶ್ರೀರಂಗಕ್ಕೆ ಕರೆದೊಯ್ದರು. ಶ್ರೀ ರಂಗನಾಥನನ್ನು ಕಂಡ ಆಳವಂದಾರ್ ರಾಜ್ಯವನ್ನು ತ್ಯಜಿಸಿದರು.",
      ),
      n(
        "As head of the Srirangam community he wrote the works that laid the ground for Vishishtadvaita. At Kanchi, before Lord Varadaraja, he saw the young Ramanuja and prayed that he would lead the tradition. When Ramanuja reached Srirangam, Alavandar had passed away; three fingers of his hand stayed folded — three unfulfilled wishes, which unfolded as Ramanuja vowed to fulfil them.",
        "ಶ್ರೀರಂಗದ ಸಮುದಾಯದ ನಾಯಕರಾಗಿ ವಿಶಿಷ್ಟಾದ್ವೈತಕ್ಕೆ ತಳಹದಿ ಹಾಕಿದ ಕೃತಿಗಳನ್ನು ರಚಿಸಿದರು. ಕಾಂಚಿಯಲ್ಲಿ ಶ್ರೀ ವರದರಾಜನ ಸನ್ನಿಧಿಯಲ್ಲಿ ಯುವಕ ರಾಮಾನುಜರನ್ನು ಕಂಡು ಅವರು ಸಂಪ್ರದಾಯವನ್ನು ಮುನ್ನಡೆಸಲೆಂದು ಪ್ರಾರ್ಥಿಸಿದರು. ರಾಮಾನುಜರು ಶ್ರೀರಂಗ ತಲುಪುವಷ್ಟರಲ್ಲಿ ಆಳವಂದಾರ್ ಪರಮಪದಿಸಿದ್ದರು; ಅವರ ಕೈಯ ಮೂರು ಬೆರಳುಗಳು ಮಡಚಿಯೇ ಇದ್ದವು — ಮೂರು ಈಡೇರದ ಆಸೆಗಳು. ರಾಮಾನುಜರು ಅವನ್ನು ಈಡೇರಿಸುವುದಾಗಿ ಪ್ರತಿಜ್ಞೆ ಮಾಡುತ್ತಿದ್ದಂತೆ ಬೆರಳುಗಳು ಬಿಚ್ಚಿಕೊಂಡವು.",
      ),
    ],
    works: [
      n("Stotra Ratnam and Chatusloki", "ಸ್ತೋತ್ರರತ್ನ, ಚತುಃಶ್ಲೋಕೀ"),
      n("Siddhi Trayam and Agama Pramanyam", "ಸಿದ್ಧಿತ್ರಯ, ಆಗಮಪ್ರಾಮಾಣ್ಯ"),
      n("Gitartha Sangraham", "ಗೀತಾರ್ಥಸಂಗ್ರಹ"),
    ],
    composition: sloka(
      "tn-alavandar",
      n("Stotra Ratnam 22 · Alavandar", "ಸ್ತೋತ್ರರತ್ನ 22 · ಆಳವಂದಾರ್"),
      "ನ ಧರ್ಮನಿಷ್ಠೋಽಸ್ಮಿ ನ ಚಾತ್ಮವೇದೀ\nನ ಭಕ್ತಿಮಾಂಸ್ತ್ವಚ್ಚರಣಾರವಿಂದೇ ।\nಅಕಿಂಚನೋಽನನ್ಯಗತಿಃ ಶರಣ್ಯ\nತ್ವತ್ಪಾದಮೂಲಂ ಶರಣಂ ಪ್ರಪದ್ಯೇ ॥",
      "na dharmaniṣṭho 'smi na cātmavedī\nna bhaktimāṁs tvaccaraṇāravinde |\nakiñcano 'nanyagatiḥ śaraṇya\ntvatpādamūlaṁ śaraṇaṁ prapadye ||",
      n(
        "I am not steadfast in dharma, nor a knower of the self, nor have I devotion at Your lotus feet. With nothing of my own and no other way, O Refuge of all, I take refuge at the root of Your feet.",
        "ನಾನು ಧರ್ಮನಿಷ್ಠನಲ್ಲ, ಆತ್ಮಜ್ಞಾನಿಯಲ್ಲ, ನಿನ್ನ ಪಾದಕಮಲಗಳಲ್ಲಿ ಭಕ್ತಿಯುಳ್ಳವನೂ ಅಲ್ಲ. ಏನೂ ಇಲ್ಲದ, ಬೇರೆ ಗತಿಯಿಲ್ಲದ ನಾನು, ಓ ಶರಣ್ಯನೇ, ನಿನ್ನ ಪಾದಮೂಲವನ್ನೇ ಶರಣು ಹೊಂದುತ್ತೇನೆ.",
      ),
    ),
  },
  {
    slug: "periya-nambi",
    kind: "acharya",
    tirunakshatram: 20,
    name: n("Periya Nambi (Mahapurna)", "ಪೆರಿಯ ನಂಬಿ (ಮಹಾಪೂರ್ಣ)"),
    birthplace: n("Srirangam", "ಶ್ರೀರಂಗ"),
    summary: n(
      "Alavandar's disciple who initiated Ramanuja at Madhurantakam, and gave his eyes and his life for him.",
      "ಮಧುರಾಂತಕದಲ್ಲಿ ರಾಮಾನುಜರಿಗೆ ಪಂಚಸಂಸ್ಕಾರ ಮಾಡಿದ ಆಳವಂದಾರರ ಶಿಷ್ಯ — ಅವರಿಗಾಗಿ ತಮ್ಮ ಕಣ್ಣು, ಪ್ರಾಣವನ್ನೇ ಅರ್ಪಿಸಿದವರು.",
    ),
    life: [
      n(
        "A foremost disciple of Alavandar, Periya Nambi set out from Srirangam to bring Ramanuja to lead the community, as Lord Varadaraja had advised through Tirukkachi Nambi. Ramanuja had set out to meet him too, and the two met at Madhurantakam, where — not wanting to wait a moment — Periya Nambi performed Ramanuja's pancha samskara under the temple's magizha tree.",
        "ಆಳವಂದಾರರ ಪ್ರಮುಖ ಶಿಷ್ಯರಾದ ಪೆರಿಯ ನಂಬಿಗಳು, ತಿರುಕ್ಕಚ್ಚಿ ನಂಬಿಗಳ ಮೂಲಕ ಶ್ರೀ ವರದರಾಜನು ಸೂಚಿಸಿದಂತೆ, ರಾಮಾನುಜರನ್ನು ಸಮುದಾಯದ ನಾಯಕತ್ವಕ್ಕೆ ಕರೆತರಲು ಶ್ರೀರಂಗದಿಂದ ಹೊರಟರು. ರಾಮಾನುಜರೂ ಅವರನ್ನು ಭೇಟಿಯಾಗಲು ಹೊರಟಿದ್ದರು; ಇಬ್ಬರೂ ಮಧುರಾಂತಕದಲ್ಲಿ ಸಂಧಿಸಿದರು. ಒಂದು ಕ್ಷಣವೂ ತಡ ಮಾಡಬಾರದೆಂದು ಪೆರಿಯ ನಂಬಿಗಳು ಅಲ್ಲಿಯೇ ದೇವಾಲಯದ ಬಕುಳ ವೃಕ್ಷದಡಿ ರಾಮಾನುಜರಿಗೆ ಪಂಚಸಂಸ್ಕಾರ ಮಾಡಿದರು.",
      ),
      n(
        "Years later, when the Chola king summoned Ramanuja to sign that Shiva alone is supreme, the aged Periya Nambi went to the court with Kurathalwan, who went disguised as Ramanuja. Both refused to sign and were blinded. Periya Nambi died on the way back to Srirangam, his head in his daughter Attuzhai's lap.",
        "ವರ್ಷಗಳ ನಂತರ ಚೋಳ ರಾಜನು 'ಶಿವನೇ ಪರದೈವ' ಎಂದು ಸಹಿ ಹಾಕಲು ರಾಮಾನುಜರನ್ನು ಕರೆಸಿದಾಗ, ವೃದ್ಧ ಪೆರಿಯ ನಂಬಿಗಳು ರಾಮಾನುಜರ ವೇಷದಲ್ಲಿದ್ದ ಕೂರತ್ತಾಳ್ವಾನರೊಂದಿಗೆ ಆಸ್ಥಾನಕ್ಕೆ ಹೋದರು. ಇಬ್ಬರೂ ಸಹಿ ಹಾಕಲು ನಿರಾಕರಿಸಿ ಕಣ್ಣು ಕಳೆದುಕೊಂಡರು. ಶ್ರೀರಂಗಕ್ಕೆ ಮರಳುವ ದಾರಿಯಲ್ಲಿ, ಮಗಳು ಅತ್ತುಳಾಯ್ ಮಡಿಲಲ್ಲಿ ತಲೆಯಿಟ್ಟು ಪೆರಿಯ ನಂಬಿಗಳು ಪರಮಪದಿಸಿದರು.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-periya-nambi",
      n("Tanian of Periya Nambi", "ಪೆರಿಯ ನಂಬಿಗಳ ತನಿಯನ್"),
      "ಕಮಲಾಪತಿಕಲ್ಯಾಣಗುಣಾಮೃತನಿಷೇವಯಾ ।\nಪೂರ್ಣಕಾಮಾಯ ಸತತಂ ಪೂರ್ಣಾಯ ಮಹತೇ ನಮಃ ॥",
      "kamalāpatikalyāṇaguṇāmṛtaniṣevayā |\npūrṇakāmāya satataṁ pūrṇāya mahate namaḥ ||",
      n(
        "Salutations to the great Purna (Periya Nambi), ever fulfilled by drinking the nectar of the auspicious qualities of Lakshmi's Lord.",
        "ಲಕ್ಷ್ಮೀಪತಿಯ ಕಲ್ಯಾಣಗುಣಗಳೆಂಬ ಅಮೃತವನ್ನು ಸೇವಿಸಿ ಸದಾ ಪರಿಪೂರ್ಣರಾದ ಮಹಾಪೂರ್ಣರಿಗೆ (ಪೆರಿಯ ನಂಬಿಗಳಿಗೆ) ನಮಸ್ಕಾರ.",
      ),
    ),
  },
  {
    slug: "tirukkachi-nambi",
    kind: "acharya",
    tirunakshatram: 23,
    name: n("Tirukkachi Nambi (Kanchipurna)", "ತಿರುಕ್ಕಚ್ಚಿ ನಂಬಿ (ಕಾಂಚೀಪೂರ್ಣ)"),
    birthplace: n("Poovirundavalli (Poonamallee), near Chennai", "ಪೂವಿರುಂದವಲ್ಲಿ (ಪೂಂದಮಲ್ಲಿ), ಚೆನ್ನೈ ಸಮೀಪ"),
    summary: n(
      "Lord Varadaraja's fan-bearer at Kanchi, to whom the Lord spoke, and who brought Ramanuja the Lord's six answers.",
      "ಕಾಂಚಿಯಲ್ಲಿ ಶ್ರೀ ವರದರಾಜನಿಗೆ ಬೀಸಣಿಗೆ ಸೇವೆ ಮಾಡುತ್ತಿದ್ದವರು — ಸ್ವಾಮಿ ಅವರೊಂದಿಗೆ ಮಾತನಾಡುತ್ತಿದ್ದ; ರಾಮಾನುಜರಿಗೆ ಸ್ವಾಮಿಯ ಆರು ಉತ್ತರಗಳನ್ನು ತಂದವರು.",
    ),
    life: [
      n(
        "Tirukkachi Nambi, a disciple of Alavandar, served Lord Varadaraja at Kanchipuram by fanning Him (alavattam kainkaryam) — and it is said the Lord would speak with him as a friend. The young Ramanuja revered him as his guide, and once begged to eat his leftovers; Nambi, out of humility, quietly avoided it.",
        "ಆಳವಂದಾರರ ಶಿಷ್ಯರಾದ ತಿರುಕ್ಕಚ್ಚಿ ನಂಬಿಗಳು ಕಾಂಚೀಪುರದಲ್ಲಿ ಶ್ರೀ ವರದರಾಜನಿಗೆ ಬೀಸಣಿಗೆ ಸೇವೆ (ಆಲವಟ್ಟ ಕೈಂಕರ್ಯ) ಮಾಡುತ್ತಿದ್ದರು; ಸ್ವಾಮಿ ಅವರೊಂದಿಗೆ ಸ್ನೇಹಿತನಂತೆ ಮಾತನಾಡುತ್ತಿದ್ದನೆಂದು ಪ್ರತೀತಿ. ಯುವಕ ರಾಮಾನುಜರು ಅವರನ್ನು ಮಾರ್ಗದರ್ಶಕರೆಂದು ಗೌರವಿಸಿ, ಒಮ್ಮೆ ಅವರ ಉಚ್ಛಿಷ್ಟ ಪ್ರಸಾದವನ್ನು ಬೇಡಿದರು; ವಿನಯದಿಂದ ನಂಬಿಗಳು ಅದನ್ನು ಮೌನವಾಗಿ ತಪ್ಪಿಸಿದರು.",
      ),
      n(
        "When Ramanuja had doubts, Nambi put them to the Lord and brought back six answers: I am the Supreme; the soul is distinct from Me; surrender (prapatti) is the way; a devotee need not fear for the last thought; liberation follows this life; take Periya Nambi as your acharya. His Devaraja Ashtakam praises our Lord Varadaraja.",
        "ರಾಮಾನುಜರಿಗೆ ಸಂದೇಹಗಳಾದಾಗ ನಂಬಿಗಳು ಸ್ವಾಮಿಯನ್ನೇ ಕೇಳಿ ಆರು ಉತ್ತರಗಳನ್ನು ತಂದರು: ನಾನೇ ಪರತತ್ತ್ವ; ಜೀವ ನನ್ನಿಂದ ಭಿನ್ನ; ಪ್ರಪತ್ತಿಯೇ ಉಪಾಯ; ಭಕ್ತನಿಗೆ ಅಂತಿಮ ಸ್ಮರಣೆಯ ಚಿಂತೆ ಬೇಡ; ಈ ದೇಹಾಂತ್ಯದಲ್ಲೇ ಮೋಕ್ಷ; ಪೆರಿಯ ನಂಬಿಗಳನ್ನು ಆಚಾರ್ಯರಾಗಿ ಸ್ವೀಕರಿಸು. ಅವರ 'ದೇವರಾಜಾಷ್ಟಕ' ನಮ್ಮ ಶ್ರೀ ವರದರಾಜನನ್ನೇ ಸ್ತುತಿಸುತ್ತದೆ.",
      ),
    ],
    works: [n("Devaraja Ashtakam", "ದೇವರಾಜಾಷ್ಟಕ")],
    composition: sloka(
      "tn-tirukkachi-nambi",
      n("Devaraja Ashtakam 1 · Tirukkachi Nambi", "ದೇವರಾಜಾಷ್ಟಕ 1 · ತಿರುಕ್ಕಚ್ಚಿ ನಂಬಿ"),
      "ನಮಸ್ತೇ ಹಸ್ತಿಶೈಲೇಶ ಶ್ರೀಮನ್ನಂಬುಜಲೋಚನ ।\nಶರಣಂ ತ್ವಾಂ ಪ್ರಪನ್ನೋಽಸ್ಮಿ ಪ್ರಣತಾರ್ತಿಹರಾಚ್ಯುತ ॥",
      "namaste hastiśaileśa śrīmann ambujalocana |\nśaraṇaṁ tvāṁ prapanno 'smi praṇatārtiharācyuta ||",
      n(
        "Salutations to You, Lord of Hastigiri, glorious lotus-eyed One! I have taken refuge in You, O Achyuta, who takes away the sorrows of those who bow to You.",
        "ಹಸ್ತಿಗಿರಿಯ ಒಡೆಯನೇ, ಶ್ರೀಮಂತನೇ, ಕಮಲನಯನನೇ, ನಿನಗೆ ನಮಸ್ಕಾರ! ನಮಿಸುವವರ ದುಃಖವನ್ನು ಹರಿಸುವ ಅಚ್ಯುತನೇ, ನಿನ್ನನ್ನೇ ಶರಣು ಹೊಂದಿದ್ದೇನೆ.",
      ),
    ),
  },
  {
    slug: "ramanuja",
    kind: "acharya",
    tirunakshatram: 0,
    name: n("Sri Ramanujacharya", "ಶ್ರೀ ರಾಮಾನುಜಾಚಾರ್ಯ"),
    alsoKnownAs: n("Udaiyavar, Yatiraja, Emperumanar, Bhashyakarar", "ಉಡೈಯವರ್, ಯತಿರಾಜ, ಎಂಪೆರುಮಾನಾರ್, ಭಾಷ್ಯಕಾರರ್"),
    birthplace: n("Sriperumbudur", "ಶ್ರೀಪೆರುಂಬುದೂರ್"),
    period: n("1017 – 1137 CE (traditional)", "ಕ್ರಿ.ಶ. 1017 – 1137 (ಸಾಂಪ್ರದಾಯಿಕ)"),
    summary: n(
      "The great teacher of Vishishtadvaita, who took his vows before Lord Varadaraja at Kanchi and spent twelve years at Melkote in Karnataka.",
      "ವಿಶಿಷ್ಟಾದ್ವೈತದ ಮಹಾನ್ ಆಚಾರ್ಯ — ಕಾಂಚಿಯ ಶ್ರೀ ವರದರಾಜನ ಸನ್ನಿಧಿಯಲ್ಲಿ ಸನ್ಯಾಸ ಸ್ವೀಕರಿಸಿ, ಕರ್ನಾಟಕದ ಮೇಲುಕೋಟೆಯಲ್ಲಿ ಹನ್ನೆರಡು ವರ್ಷ ನೆಲೆಸಿದವರು.",
    ),
    life: [
      n(
        "Born at Sriperumbudur to Asuri Keshava Somayaji and Kanthimathi, Ramanuja studied Vedanta at Kanchi under Yadavaprakasha, but questioned his teacher's readings. On a pilgrimage his teacher's party plotted to kill him; warned by his cousin Govinda (later Embar), he fled into the Vindhya forest, where a hunter couple — Lord Varadaraja and Perundevi Thayar — led him back to Kanchi overnight. He then carried water daily for the Lord from the well where they had stopped, and in time took sannyasa before Lord Varadaraja, who named him Yatiraja.",
        "ಶ್ರೀಪೆರುಂಬುದೂರಿನಲ್ಲಿ ಆಸೂರಿ ಕೇಶವ ಸೋಮಯಾಜಿ ಮತ್ತು ಕಾಂತಿಮತಿ ದಂಪತಿಗೆ ಜನಿಸಿದ ರಾಮಾನುಜರು ಕಾಂಚಿಯಲ್ಲಿ ಯಾದವಪ್ರಕಾಶರ ಬಳಿ ವೇದಾಂತ ಕಲಿತರು, ಆದರೆ ಗುರುವಿನ ವ್ಯಾಖ್ಯಾನಗಳನ್ನು ಪ್ರಶ್ನಿಸಿದರು. ಯಾತ್ರೆಯಲ್ಲಿ ಗುರುವಿನ ತಂಡ ಅವರನ್ನು ಕೊಲ್ಲಲು ಸಂಚು ಹೂಡಿತು; ಸೋದರಸಂಬಂಧಿ ಗೋವಿಂದರ (ಮುಂದೆ ಎಂಬಾರ್) ಎಚ್ಚರಿಕೆಯಿಂದ ವಿಂಧ್ಯಾರಣ್ಯಕ್ಕೆ ಓಡಿದರು; ಅಲ್ಲಿ ಬೇಡ ದಂಪತಿ — ಶ್ರೀ ವರದರಾಜ ಮತ್ತು ಪೆರುಂದೇವಿ ತಾಯಾರ್ — ಒಂದೇ ರಾತ್ರಿಯಲ್ಲಿ ಅವರನ್ನು ಕಾಂಚಿಗೆ ಮರಳಿಸಿದರು. ಅಂದಿನಿಂದ ಅವರು ತಂಗಿದ್ದ ಬಾವಿಯಿಂದ ಪ್ರತಿದಿನ ಸ್ವಾಮಿಗೆ ತೀರ್ಥ ತಂದರು; ಮುಂದೆ ಶ್ರೀ ವರದರಾಜನ ಸನ್ನಿಧಿಯಲ್ಲಿ ಸನ್ಯಾಸ ಸ್ವೀಕರಿಸಿದಾಗ ಸ್ವಾಮಿಯೇ ಅವರಿಗೆ 'ಯತಿರಾಜ' ಎಂದು ಹೆಸರಿಟ್ಟನು.",
      ),
      n(
        "Called to Srirangam, he led the community after Alavandar. Tirukkoshtiyur Nambi taught him the secret meaning of the eight-syllable mantra after eighteen visits; Ramanuja climbed the temple tower and gave it to all, ready to suffer so that many might be saved. He wrote the Sri Bhashya on the Brahma Sutras, fulfilling Alavandar's wish. Fleeing Chola persecution, he lived twelve years at Tirunarayanapura (Melkote) in Karnataka, where the Hoysala king Vishnuvardhana became his follower and he brought back the utsava image Selvapillai. He lived, the tradition says, for a hundred and twenty years.",
        "ಶ್ರೀರಂಗಕ್ಕೆ ಕರೆಯಲ್ಪಟ್ಟು ಆಳವಂದಾರರ ನಂತರ ಸಮುದಾಯವನ್ನು ಮುನ್ನಡೆಸಿದರು. ಹದಿನೆಂಟು ಬಾರಿ ಭೇಟಿಯ ನಂತರ ತಿರುಕ್ಕೋಷ್ಟಿಯೂರ್ ನಂಬಿಗಳು ಅಷ್ಟಾಕ್ಷರದ ರಹಸ್ಯಾರ್ಥವನ್ನು ಉಪದೇಶಿಸಿದರು; ರಾಮಾನುಜರು ದೇವಾಲಯದ ಗೋಪುರವೇರಿ ಅದನ್ನು ಎಲ್ಲರಿಗೂ ಸಾರಿದರು — ಅನೇಕರು ಉದ್ಧಾರವಾಗುವುದಾದರೆ ತಾವು ಕಷ್ಟಪಡಲು ಸಿದ್ಧರೆಂದು. ಆಳವಂದಾರರ ಆಸೆಯಂತೆ ಬ್ರಹ್ಮಸೂತ್ರಗಳಿಗೆ ಶ್ರೀಭಾಷ್ಯ ರಚಿಸಿದರು. ಚೋಳರ ಹಿಂಸೆಯಿಂದ ತಪ್ಪಿಸಿಕೊಂಡು ಕರ್ನಾಟಕದ ತಿರುನಾರಾಯಣಪುರದಲ್ಲಿ (ಮೇಲುಕೋಟೆ) ಹನ್ನೆರಡು ವರ್ಷ ನೆಲೆಸಿದರು; ಹೊಯ್ಸಳ ರಾಜ ವಿಷ್ಣುವರ್ಧನ ಅವರ ಅನುಯಾಯಿಯಾದನು; ಉತ್ಸವಮೂರ್ತಿ ಸೆಲ್ವಪಿಳ್ಳೈಯನ್ನು ಮರಳಿ ತಂದರು. ಸಂಪ್ರದಾಯದಂತೆ ನೂರಿಪ್ಪತ್ತು ವರ್ಷ ಬದುಕಿದರು.",
      ),
    ],
    works: [
      n("Sri Bhashya, on the Brahma Sutras", "ಶ್ರೀಭಾಷ್ಯ (ಬ್ರಹ್ಮಸೂತ್ರ ಭಾಷ್ಯ)"),
      n("Gita Bhashya and Vedartha Sangraha", "ಗೀತಾಭಾಷ್ಯ, ವೇದಾರ್ಥಸಂಗ್ರಹ"),
      n("Vedanta Sara and Vedanta Dipa", "ವೇದಾಂತಸಾರ, ವೇದಾಂತದೀಪ"),
      n("Gadya Trayam and Nitya Grantha", "ಗದ್ಯತ್ರಯ, ನಿತ್ಯಗ್ರಂಥ"),
    ],
    composition: sloka(
      "tn-ramanuja",
      n("Tanian of Sri Ramanuja · Kurathalwan", "ಶ್ರೀ ರಾಮಾನುಜರ ತನಿಯನ್ · ಕೂರತ್ತಾಳ್ವಾನ್"),
      "ಯೋ ನಿತ್ಯಮಚ್ಯುತಪದಾಂಬುಜಯುಗ್ಮರುಕ್ಮ-\nವ್ಯಾಮೋಹತಸ್ತದಿತರಾಣಿ ತೃಣಾಯ ಮೇನೇ ।\nಅಸ್ಮದ್ಗುರೋರ್ಭಗವತೋಽಸ್ಯ ದಯೈಕಸಿಂಧೋಃ\nರಾಮಾನುಜಸ್ಯ ಚರಣೌ ಶರಣಂ ಪ್ರಪದ್ಯೇ ॥",
      "yo nityam acyutapadāmbujayugmarukma-\nvyāmohatas taditarāṇi tṛṇāya mene |\nasmadguror bhagavato 'sya dayaikasindhoḥ\nrāmānujasya caraṇau śaraṇaṁ prapadye ||",
      n(
        "I take refuge at the feet of Ramanuja, our revered guru, an ocean of compassion alone — who, enchanted by the golden lotus feet of Achyuta, counted everything else as mere straw.",
        "ಅಚ್ಯುತನ ಸುವರ್ಣ ಪಾದಕಮಲಗಳ ಮೇಲಿನ ಮೋಹದಿಂದ ಉಳಿದೆಲ್ಲವನ್ನೂ ಹುಲ್ಲುಕಡ್ಡಿಯಂತೆ ಕಂಡ, ದಯೆಯ ಸಾಗರವಾದ ನಮ್ಮ ಪೂಜ್ಯ ಗುರು ರಾಮಾನುಜರ ಪಾದಗಳನ್ನು ಶರಣು ಹೊಂದುತ್ತೇನೆ.",
      ),
    ),
  },
  {
    slug: "mudaliyandan",
    kind: "acharya",
    tirunakshatram: 15,
    name: n("Mudaliyandan", "ಮುದಲಿಯಾಂಡಾನ್"),
    alsoKnownAs: n("Dasharathi", "ದಾಶರಥಿ"),
    summary: n(
      "Ramanuja's nephew and constant companion, honoured as his very sandals (padukas).",
      "ರಾಮಾನುಜರ ಸೋದರಳಿಯ, ನಿತ್ಯ ಸಂಗಾತಿ — ಅವರ ಪಾದುಕೆಗಳೆಂದೇ ಗೌರವಿಸಲ್ಪಟ್ಟವರು.",
    ),
    life: [
      n(
        "Dasharathi, the son of Ramanuja's sister, was among his first disciples and stayed at his side all his life. Ramanuja would lean on his hand when returning from his bath in the river, and the tradition honours Mudaliyandan as Ramanuja's tridanda (staff) and his padukas (sandals).",
        "ರಾಮಾನುಜರ ಸೋದರಿಯ ಮಗನಾದ ದಾಶರಥಿ ಅವರ ಮೊದಲ ಶಿಷ್ಯರಲ್ಲಿ ಒಬ್ಬರು; ಜೀವನವಿಡೀ ಅವರ ಜೊತೆಯಲ್ಲೇ ಇದ್ದರು. ನದಿಸ್ನಾನದಿಂದ ಮರಳುವಾಗ ರಾಮಾನುಜರು ಅವರ ಕೈಯನ್ನು ಆಸರೆಯಾಗಿ ಹಿಡಿಯುತ್ತಿದ್ದರು; ಸಂಪ್ರದಾಯವು ಮುದಲಿಯಾಂಡಾನರನ್ನು ರಾಮಾನುಜರ ತ್ರಿದಂಡವೆಂದೂ ಪಾದುಕೆಗಳೆಂದೂ ಗೌರವಿಸುತ್ತದೆ.",
      ),
      n(
        "When Periya Nambi's daughter Attuzhai needed help in her husband's home, Ramanuja sent Mudaliyandan to serve there as her cook, and he went gladly. He managed the affairs of the Srirangam temple under Ramanuja, and his descendants serve there to this day.",
        "ಪೆರಿಯ ನಂಬಿಗಳ ಮಗಳು ಅತ್ತುಳಾಯ್‌ಗೆ ಗಂಡನ ಮನೆಯಲ್ಲಿ ಸಹಾಯ ಬೇಕಾದಾಗ, ರಾಮಾನುಜರು ಮುದಲಿಯಾಂಡಾನರನ್ನು ಅಲ್ಲಿ ಅಡುಗೆಯವರಾಗಿ ಸೇವೆಗೆ ಕಳುಹಿಸಿದರು; ಅವರು ಸಂತೋಷದಿಂದ ಹೋದರು. ರಾಮಾನುಜರ ಅಡಿಯಲ್ಲಿ ಶ್ರೀರಂಗ ದೇವಾಲಯದ ಆಡಳಿತ ನೋಡಿಕೊಂಡರು; ಅವರ ವಂಶಸ್ಥರು ಇಂದಿಗೂ ಅಲ್ಲಿ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತಾರೆ.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-mudaliyandan",
      n("Tanian of Mudaliyandan", "ಮುದಲಿಯಾಂಡಾನರ ತನಿಯನ್"),
      "ಪಾದುಕೇ ಯತಿರಾಜಸ್ಯ ಕಥಯಂತಿ ಯದಾಖ್ಯಯಾ ।\nತಸ್ಯ ದಾಶರಥೇಃ ಪಾದೌ ಶಿರಸಾ ಧಾರಯಾಮ್ಯಹಮ್ ॥",
      "pāduke yatirājasya kathayanti yadākhyayā |\ntasya dāśaratheḥ pādau śirasā dhārayāmy aham ||",
      n(
        "I bear on my head the feet of Dasharathi, whose very name people use for the sandals of Yatiraja.",
        "ಯಾರ ಹೆಸರಿನಿಂದಲೇ ಯತಿರಾಜರ ಪಾದುಕೆಗಳನ್ನು ಕರೆಯುತ್ತಾರೋ, ಆ ದಾಶರಥಿಯ ಪಾದಗಳನ್ನು ನಾನು ತಲೆಯ ಮೇಲೆ ಧರಿಸುತ್ತೇನೆ.",
      ),
    ),
  },
  {
    slug: "kurathalwan",
    kind: "acharya",
    tirunakshatram: 21,
    name: n("Kurathalwan", "ಕೂರತ್ತಾಳ್ವಾನ್"),
    alsoKnownAs: n("Srivatsanka Mishra, Kooresha", "ಶ್ರೀವತ್ಸಾಂಕ ಮಿಶ್ರ, ಕೂರೇಶ"),
    birthplace: n("Kooram, near Kanchipuram", "ಕೂರಂ, ಕಾಂಚೀಪುರ ಸಮೀಪ"),
    summary: n(
      "Ramanuja's foremost disciple, who gave his eyes rather than deny Narayana, and sang the Varadaraja Stavam to the Lord of Kanchi.",
      "ರಾಮಾನುಜರ ಅಗ್ರಶಿಷ್ಯ — ನಾರಾಯಣನನ್ನು ನಿರಾಕರಿಸುವುದಕ್ಕಿಂತ ಕಣ್ಣು ಕಳೆದುಕೊಳ್ಳಲು ಸಿದ್ಧರಾದವರು; ಕಾಂಚಿಯ ಸ್ವಾಮಿಗೆ 'ವರದರಾಜಸ್ತವ' ಹಾಡಿದವರು.",
    ),
    life: [
      n(
        "A wealthy landlord of Kooram, famed for his charity, he gave away everything to follow Ramanuja with his wife Andal. He had a prodigious memory: when the Bodhayana Vritti, needed for the Sri Bhashya, was taken back from them in Kashmir, he had already memorised it overnight.",
        "ಕೂರಂನ ಶ್ರೀಮಂತ ಭೂಮಾಲೀಕರಾದ ಅವರು ದಾನಕ್ಕೆ ಹೆಸರಾದವರು; ಪತ್ನಿ ಆಂಡಾಳ್‌ರೊಂದಿಗೆ ಸರ್ವಸ್ವವನ್ನೂ ತ್ಯಜಿಸಿ ರಾಮಾನುಜರನ್ನು ಅನುಸರಿಸಿದರು. ಅದ್ಭುತ ಸ್ಮರಣಶಕ್ತಿ ಅವರದು: ಶ್ರೀಭಾಷ್ಯಕ್ಕೆ ಬೇಕಾಗಿದ್ದ ಬೋಧಾಯನ ವೃತ್ತಿಯನ್ನು ಕಾಶ್ಮೀರದಲ್ಲಿ ಹಿಂಪಡೆದಾಗ, ಅವರು ಅದನ್ನು ಒಂದೇ ರಾತ್ರಿಯಲ್ಲಿ ಕಂಠಪಾಠ ಮಾಡಿಬಿಟ್ಟಿದ್ದರು.",
      ),
      n(
        "When the Chola king summoned Ramanuja, Kurathalwan went in his place, dressed in his ochre robes, and refused to sign that none is higher than Shiva; he was blinded. Later at Kanchi he sang the Varadaraja Stavam, and when Lord Varadaraja offered him a boon, he asked not for his sight but for liberation for the man who had harmed him. His sons Parashara Bhattar and Veda Vyasa Bhattar fulfilled Alavandar's wish that those names be honoured.",
        "ಚೋಳ ರಾಜನು ರಾಮಾನುಜರನ್ನು ಕರೆಸಿದಾಗ ಕೂರತ್ತಾಳ್ವಾನರು ಅವರ ಕಾವಿ ವಸ್ತ್ರ ಧರಿಸಿ ಅವರ ಬದಲಿಗೆ ಹೋದರು; 'ಶಿವನಿಗಿಂತ ಮೇಲಿಲ್ಲ' ಎಂದು ಸಹಿ ಹಾಕಲು ನಿರಾಕರಿಸಿ ಕಣ್ಣು ಕಳೆದುಕೊಂಡರು. ಮುಂದೆ ಕಾಂಚಿಯಲ್ಲಿ 'ವರದರಾಜಸ್ತವ' ಹಾಡಿದರು; ಶ್ರೀ ವರದರಾಜನು ವರ ಕೊಡಲು ಮುಂದಾದಾಗ ತಮ್ಮ ದೃಷ್ಟಿಯನ್ನಲ್ಲ, ತಮಗೆ ಹಾನಿ ಮಾಡಿದವನಿಗೆ ಮೋಕ್ಷವನ್ನು ಬೇಡಿದರು. ಅವರ ಮಕ್ಕಳಾದ ಪರಾಶರ ಭಟ್ಟರ್ ಮತ್ತು ವೇದವ್ಯಾಸ ಭಟ್ಟರ್ ಆ ಹೆಸರುಗಳನ್ನು ಗೌರವಿಸಬೇಕೆಂಬ ಆಳವಂದಾರರ ಆಸೆಯನ್ನು ಈಡೇರಿಸಿದರು.",
      ),
    ],
    works: [
      n("Pancha Stavam: Sri Vaikuntha Stavam, Atimanusha Stavam, Sundarabahu Stavam, Varadaraja Stavam, Sri Stavam", "ಪಂಚಸ್ತವ: ಶ್ರೀ ವೈಕುಂಠಸ್ತವ, ಅತಿಮಾನುಷಸ್ತವ, ಸುಂದರಬಾಹುಸ್ತವ, ವರದರಾಜಸ್ತವ, ಶ್ರೀಸ್ತವ"),
    ],
    composition: sloka(
      "tn-kurathalwan",
      n("Tanian of Kurathalwan · Parashara Bhattar", "ಕೂರತ್ತಾಳ್ವಾನರ ತನಿಯನ್ · ಪರಾಶರ ಭಟ್ಟರ್"),
      "ಶ್ರೀವತ್ಸಚಿಹ್ನಮಿಶ್ರೇಭ್ಯೋ ನಮ ಉಕ್ತಿಮಧೀಮಹೇ ।\nಯದುಕ್ತಯಸ್ತ್ರಯೀಕಂಠೇ ಯಾಂತಿ ಮಂಗಲಸೂತ್ರತಾಮ್ ॥",
      "śrīvatsacihnamiśrebhyo nama uktim adhīmahe |\nyaduktayas trayīkaṇṭhe yānti maṅgalasūtratām ||",
      n(
        "We offer our salutations to Srivatsanka Mishra, whose words become the sacred mangala-sutra on the neck of the Vedas.",
        "ಯಾರ ವಾಣಿಗಳು ವೇದಗಳ ಕಂಠದಲ್ಲಿ ಮಂಗಳಸೂತ್ರವಾಗುತ್ತವೋ, ಆ ಶ್ರೀವತ್ಸಾಂಕ ಮಿಶ್ರರಿಗೆ ನಮೋವಾಕವನ್ನು ಅರ್ಪಿಸುತ್ತೇವೆ.",
      ),
    ),
  },
  {
    slug: "embar",
    kind: "acharya",
    tirunakshatram: 22,
    name: n("Embar", "ಎಂಬಾರ್"),
    alsoKnownAs: n("Govinda Perumal", "ಗೋವಿಂದ ಪೆರುಮಾಳ್"),
    birthplace: n("Madhuramangalam, near Sriperumbudur", "ಮಧುರಮಂಗಲಂ, ಶ್ರೀಪೆರುಂಬುದೂರ್ ಸಮೀಪ"),
    summary: n(
      "Ramanuja's cousin who saved his life in the Vindhya forest, and later became the shade of his feet.",
      "ವಿಂಧ್ಯಾರಣ್ಯದಲ್ಲಿ ರಾಮಾನುಜರ ಪ್ರಾಣ ಉಳಿಸಿದ ಸೋದರಸಂಬಂಧಿ — ಮುಂದೆ ಅವರ ಪಾದಗಳ ನೆರಳಾದವರು.",
    ),
    life: [
      n(
        "Govinda, Ramanuja's cousin, was studying with him under Yadavaprakasha when he learnt of the plot to drown Ramanuja in the Ganga, and warned him to flee. Govinda himself went on to Kalahasti and became a devoted Shaiva, until his uncle Periya Tirumalai Nambi won him back with the verses of Tiruvaimozhi.",
        "ರಾಮಾನುಜರ ಸೋದರಸಂಬಂಧಿ ಗೋವಿಂದರು ಅವರೊಂದಿಗೆ ಯಾದವಪ್ರಕಾಶರ ಬಳಿ ಓದುತ್ತಿದ್ದಾಗ ರಾಮಾನುಜರನ್ನು ಗಂಗೆಯಲ್ಲಿ ಮುಳುಗಿಸುವ ಸಂಚನ್ನು ತಿಳಿದು, ಅವರನ್ನು ಓಡಿಹೋಗುವಂತೆ ಎಚ್ಚರಿಸಿದರು. ಗೋವಿಂದರು ಮುಂದೆ ಕಾಳಹಸ್ತಿಯಲ್ಲಿ ನಿಷ್ಠ ಶೈವರಾದರು; ಅವರ ಮಾವ ಪೆರಿಯ ತಿರುಮಲೈ ನಂಬಿಗಳು ತಿರುವಾಯ್ಮೊಳಿಯ ಪಾಶುರಗಳಿಂದ ಅವರನ್ನು ಮರಳಿ ಕರೆತಂದರು.",
      ),
      n(
        "He served Ramanuja with such single-minded love that Ramanuja gave him sannyasa and the name Embar. He was the acharya of Parashara Bhattar, carrying Ramanuja's teaching to the next generation.",
        "ಏಕಾಗ್ರ ಪ್ರೇಮದಿಂದ ರಾಮಾನುಜರನ್ನು ಸೇವಿಸಿದ ಅವರಿಗೆ ರಾಮಾನುಜರು ಸನ್ಯಾಸ ನೀಡಿ 'ಎಂಬಾರ್' ಎಂದು ಹೆಸರಿಟ್ಟರು. ಪರಾಶರ ಭಟ್ಟರರ ಆಚಾರ್ಯರಾಗಿ ರಾಮಾನುಜರ ಬೋಧನೆಯನ್ನು ಮುಂದಿನ ಪೀಳಿಗೆಗೆ ತಲುಪಿಸಿದರು.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-embar",
      n("Tanian of Embar", "ಎಂಬಾರರ ತನಿಯನ್"),
      "ರಾಮಾನುಜಪದಚ್ಛಾಯಾ ಗೋವಿಂದಾಹ್ವಾನಪಾಯಿನೀ ।\nತದಾಯತ್ತಸ್ವರೂಪಾ ಸಾ ಜೀಯಾನ್ಮದ್ವಿಶ್ರಮಸ್ಥಲೀ ॥",
      "rāmānujapadacchāyā govindāhvānapāyinī |\ntadāyattasvarūpā sā jīyān madviśramasthalī ||",
      n(
        "May Govinda flourish — the never-departing shade of Ramanuja's feet, whose very being rests in him, and my place of rest.",
        "ರಾಮಾನುಜರ ಪಾದಗಳ ಎಂದೂ ಅಗಲದ ನೆರಳಾದ, ಅವರಲ್ಲೇ ತನ್ನ ಸ್ವರೂಪವನ್ನು ಇಟ್ಟ, ನನ್ನ ವಿಶ್ರಾಂತಿಸ್ಥಾನವಾದ ಗೋವಿಂದರು ಬಾಳಲಿ.",
      ),
    ),
  },
  {
    slug: "parashara-bhattar",
    kind: "acharya",
    tirunakshatram: 16,
    name: n("Parashara Bhattar", "ಪರಾಶರ ಭಟ್ಟರ್"),
    birthplace: n("Srirangam", "ಶ್ರೀರಂಗ"),
    summary: n(
      "Kurathalwan's son, raised as the child of Sri Ranganatha and Ranganayaki, the brilliant teacher of Srirangam.",
      "ಕೂರತ್ತಾಳ್ವಾನರ ಮಗ — ಶ್ರೀ ರಂಗನಾಥ-ರಂಗನಾಯಕಿಯರ ಮಗುವಾಗಿ ಬೆಳೆದ ಶ್ರೀರಂಗದ ಪ್ರತಿಭಾವಂತ ಆಚಾರ್ಯ.",
    ),
    life: [
      n(
        "Born to Kurathalwan and Andal after they received prasadam from Sri Ranganatha's kitchen, the child was named by Ramanuja after Parashara, author of the Vishnu Purana. He was brought up in the temple as the son of the Lord and Thayar themselves, and as a boy silenced a proud scholar with a single question about a handful of sand.",
        "ಶ್ರೀ ರಂಗನಾಥನ ಪ್ರಸಾದ ಸ್ವೀಕರಿಸಿದ ನಂತರ ಕೂರತ್ತಾಳ್ವಾನ್-ಆಂಡಾಳ್ ದಂಪತಿಗೆ ಜನಿಸಿದ ಮಗುವಿಗೆ ರಾಮಾನುಜರು ವಿಷ್ಣುಪುರಾಣಕರ್ತ ಪರಾಶರರ ಹೆಸರಿಟ್ಟರು. ಸ್ವಾಮಿ-ತಾಯಾರರ ಮಗನಂತೆಯೇ ದೇವಾಲಯದಲ್ಲಿ ಬೆಳೆದ ಅವರು, ಬಾಲಕನಾಗಿದ್ದಾಗಲೇ ಒಂದು ಹಿಡಿ ಮರಳಿನ ಬಗ್ಗೆ ಒಂದೇ ಪ್ರಶ್ನೆಯಿಂದ ಅಹಂಕಾರಿ ಪಂಡಿತನೊಬ್ಬನನ್ನು ಮೌನಗೊಳಿಸಿದರು.",
      ),
      n(
        "He became the leading teacher at Srirangam after Embar, and won over the great Advaita scholar Vedanti Madhava, who became his disciple Nanjeeyar. His commentary on the Vishnu Sahasranama and his hymns to Sri Ranganatha and Ranganayaki are treasured.",
        "ಎಂಬಾರರ ನಂತರ ಶ್ರೀರಂಗದ ಪ್ರಮುಖ ಆಚಾರ್ಯರಾದರು; ಮಹಾನ್ ಅದ್ವೈತ ಪಂಡಿತ ವೇದಾಂತಿ ಮಾಧವರನ್ನು ಗೆದ್ದು ತಮ್ಮ ಶಿಷ್ಯ ನಂಜೀಯರ್ ಆಗಿಸಿದರು. ವಿಷ್ಣುಸಹಸ್ರನಾಮದ ಮೇಲಿನ ಅವರ ಭಾಷ್ಯ ಮತ್ತು ರಂಗನಾಥ-ರಂಗನಾಯಕಿಯರ ಸ್ತೋತ್ರಗಳು ಅಮೂಲ್ಯ.",
      ),
    ],
    works: [
      n("Bhagavad Guna Darpanam, on the Vishnu Sahasranama", "ಭಗವದ್ಗುಣದರ್ಪಣ (ವಿಷ್ಣುಸಹಸ್ರನಾಮ ಭಾಷ್ಯ)"),
      n("Sri Rangaraja Stavam and Sri Guna Ratna Kosham", "ಶ್ರೀ ರಂಗರಾಜಸ್ತವ, ಶ್ರೀ ಗುಣರತ್ನಕೋಶ"),
      n("Ashtasloki", "ಅಷ್ಟಶ್ಲೋಕೀ"),
    ],
    composition: sloka(
      "tn-parashara-bhattar",
      n("Tanian of Parashara Bhattar", "ಪರಾಶರ ಭಟ್ಟರರ ತನಿಯನ್"),
      "ಶ್ರೀಪರಾಶರಭಟ್ಟಾರ್ಯಃ ಶ್ರೀರಂಗೇಶಪುರೋಹಿತಃ ।\nಶ್ರೀವತ್ಸಾಂಕಸುತಃ ಶ್ರೀಮಾನ್ ಶ್ರೇಯಸೇ ಮೇಽಸ್ತು ಭೂಯಸೇ ॥",
      "śrīparāśarabhaṭṭāryaḥ śrīraṅgeśapurohitaḥ |\nśrīvatsāṅkasutaḥ śrīmān śreyase me 'stu bhūyase ||",
      n(
        "May the glorious Parashara Bhattar, preceptor at the court of Sri Ranganatha and son of Srivatsanka, bring me abundant good.",
        "ಶ್ರೀ ರಂಗನಾಥನ ಪುರೋಹಿತರಾದ, ಶ್ರೀವತ್ಸಾಂಕರ ಪುತ್ರರಾದ ಶ್ರೀಮಾನ್ ಪರಾಶರ ಭಟ್ಟರು ನನಗೆ ಅಪಾರ ಶ್ರೇಯಸ್ಸನ್ನು ನೀಡಲಿ.",
      ),
    ),
  },
  {
    slug: "pillai-lokacharya",
    kind: "acharya",
    tirunakshatram: 19,
    name: n("Pillai Lokacharya", "ಪಿಳ್ಳೈ ಲೋಕಾಚಾರ್ಯ"),
    birthplace: n("Srirangam", "ಶ್ರೀರಂಗ"),
    period: n("13th–14th century CE", "ಕ್ರಿ.ಶ. 13–14ನೇ ಶತಮಾನ"),
    summary: n(
      "Author of the eighteen Rahasya works, who in his old age carried Namperumal to safety during the invasion of Srirangam.",
      "ಹದಿನೆಂಟು ರಹಸ್ಯ ಗ್ರಂಥಗಳ ಕರ್ತೃ — ವೃದ್ಧಾಪ್ಯದಲ್ಲಿ ಶ್ರೀರಂಗದ ಮೇಲಿನ ಆಕ್ರಮಣದ ವೇಳೆ ನಂಪೆರುಮಾಳರನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಕರೆದೊಯ್ದವರು.",
    ),
    life: [
      n(
        "Son of Vadakku Tiruveedhi Pillai, he was named after the great teacher Nampillai, who was called Lokacharya. He set down the subtle teachings of the tradition in clear Manipravalam for everyone, in eighteen works on the three secrets — the Ashtakshara, the Dvaya and the Charama Sloka — culminating in the Sri Vachana Bhushanam.",
        "ವಡಕ್ಕು ತಿರುವೀದಿ ಪಿಳ್ಳೈಯವರ ಮಗನಾದ ಅವರಿಗೆ 'ಲೋಕಾಚಾರ್ಯ' ಎಂದು ಕರೆಯಲ್ಪಡುತ್ತಿದ್ದ ನಂಪಿಳ್ಳೈಯವರ ಹೆಸರಿಡಲಾಯಿತು. ಸಂಪ್ರದಾಯದ ಸೂಕ್ಷ್ಮ ಬೋಧನೆಗಳನ್ನು ಎಲ್ಲರಿಗೂ ತಿಳಿಯುವಂತೆ ಸ್ಪಷ್ಟ ಮಣಿಪ್ರವಾಳದಲ್ಲಿ ಮೂರು ರಹಸ್ಯಗಳ — ಅಷ್ಟಾಕ್ಷರ, ದ್ವಯ, ಚರಮಶ್ಲೋಕ — ಮೇಲೆ ಹದಿನೆಂಟು ಗ್ರಂಥಗಳಲ್ಲಿ ಬರೆದರು; ಶ್ರೀವಚನಭೂಷಣ ಅವುಗಳ ಶಿಖರ.",
      ),
      n(
        "When an invading army reached Srirangam in the early fourteenth century, the aged acharya fled south with the utsava image Namperumal to keep the Lord safe. He passed away on the journey at Jyotishkudi near Madurai, having given his life for the Lord's protection.",
        "ಹದಿನಾಲ್ಕನೇ ಶತಮಾನದ ಆರಂಭದಲ್ಲಿ ಆಕ್ರಮಣಕಾರಿ ಸೈನ್ಯ ಶ್ರೀರಂಗ ತಲುಪಿದಾಗ, ವೃದ್ಧ ಆಚಾರ್ಯರು ಉತ್ಸವಮೂರ್ತಿ ನಂಪೆರುಮಾಳರನ್ನು ಸುರಕ್ಷಿತವಾಗಿಡಲು ದಕ್ಷಿಣಕ್ಕೆ ಕರೆದೊಯ್ದರು. ಆ ಪ್ರಯಾಣದಲ್ಲೇ ಮಧುರೆಯ ಸಮೀಪದ ಜ್ಯೋತಿಷ್ಕುಡಿಯಲ್ಲಿ ಪರಮಪದಿಸಿದರು — ಸ್ವಾಮಿಯ ರಕ್ಷಣೆಗಾಗಿ ಪ್ರಾಣವನ್ನೇ ಅರ್ಪಿಸಿದರು.",
      ),
    ],
    works: [
      n("Sri Vachana Bhushanam", "ಶ್ರೀವಚನಭೂಷಣ"),
      n("Mumukshuppadi and Tattva Trayam", "ಮುಮುಕ್ಷುಪ್ಪಡಿ, ತತ್ತ್ವತ್ರಯ"),
      n("Eighteen Rahasya works in all", "ಒಟ್ಟು ಹದಿನೆಂಟು ರಹಸ್ಯ ಗ್ರಂಥಗಳು"),
    ],
    composition: sloka(
      "tn-pillai-lokacharya",
      n("Tanian of Pillai Lokacharya", "ಪಿಳ್ಳೈ ಲೋಕಾಚಾರ್ಯರ ತನಿಯನ್"),
      "ಲೋಕಾಚಾರ್ಯಗುರವೇ ಕೃಷ್ಣಪಾದಸ್ಯ ಸೂನವೇ ।\nಸಂಸಾರಭೋಗಿಸಂದಷ್ಟಜೀವಜೀವಾತವೇ ನಮಃ ॥",
      "lokācāryagurave kṛṣṇapādasya sūnave |\nsaṁsārabhogisandaṣṭajīvajīvātave namaḥ ||",
      n(
        "Salutations to the guru Lokacharya, son of Krishnapada — the life-giving remedy for souls bitten by the serpent of samsara.",
        "ಕೃಷ್ಣಪಾದರ ಪುತ್ರರಾದ, ಸಂಸಾರವೆಂಬ ಸರ್ಪದಿಂದ ಕಚ್ಚಲ್ಪಟ್ಟ ಜೀವಿಗಳಿಗೆ ಸಂಜೀವಿನಿಯಾದ ಲೋಕಾಚಾರ್ಯ ಗುರುಗಳಿಗೆ ನಮಸ್ಕಾರ.",
      ),
    ),
  },
  {
    slug: "vedanta-desikar",
    kind: "acharya",
    tirunakshatram: 5,
    name: n("Sri Vedanta Desikar", "ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರ್"),
    alsoKnownAs: n("Venkatanatha, Kavitarkika Kesari, Sarvatantra Svatantra", "ವೇಂಕಟನಾಥ, ಕವಿತಾರ್ಕಿಕಕೇಸರೀ, ಸರ್ವತಂತ್ರಸ್ವತಂತ್ರ"),
    birthplace: n("Thoopul (Tiruttanka), Kanchipuram", "ತೂಪ್ಪುಲ್ (ತಿರುತ್ತಣ್ಕಾ), ಕಾಂಚೀಪುರಂ"),
    amsam: n("The bell of Lord Srinivasa at Tirumala", "ತಿರುಮಲೆ ಶ್ರೀನಿವಾಸನ ಘಂಟೆ"),
    period: n("1268 – 1369 CE (traditional)", "ಕ್ರಿ.ಶ. 1268 – 1369 (ಸಾಂಪ್ರದಾಯಿಕ)"),
    summary: n(
      "The poet-philosopher of Kanchi, 'lion among poets and logicians', who wrote over a hundred works and saved the Sri Bhashya in a time of invasion.",
      "ಕಾಂಚಿಯ ಕವಿ-ದಾರ್ಶನಿಕ, 'ಕವಿತಾರ್ಕಿಕಕೇಸರೀ' — ನೂರಕ್ಕೂ ಹೆಚ್ಚು ಕೃತಿಗಳ ಕರ್ತೃ; ಆಕ್ರಮಣದ ಕಾಲದಲ್ಲಿ ಶ್ರೀಭಾಷ್ಯವನ್ನು ಉಳಿಸಿದವರು.",
    ),
    life: [
      n(
        "Venkatanatha was born at Thoopul in Kanchi, and as a child of five was taken by his uncle Kidambi Appullar to the discourse of Nadadur Ammal, who blessed him to establish the tradition. At Tiruvahindrapuram he received the grace of Lord Hayagriva, and he lived for many years at Kanchi serving Lord Varadaraja, for whom he composed hymns such as the Varadaraja Panchashat.",
        "ವೇಂಕಟನಾಥರು ಕಾಂಚಿಯ ತೂಪ್ಪುಲ್‌ನಲ್ಲಿ ಜನಿಸಿದರು; ಐದು ವರ್ಷದ ಬಾಲಕನಾಗಿದ್ದಾಗ ಮಾವ ಕಿಡಾಂಬಿ ಅಪ್ಪುಳ್ಳಾರ್ ಅವರನ್ನು ನಡಾದೂರ್ ಅಮ್ಮಾಳರ ಪ್ರವಚನಕ್ಕೆ ಕರೆದೊಯ್ದರು; ಅಮ್ಮಾಳರು ಸಂಪ್ರದಾಯವನ್ನು ಸ್ಥಾಪಿಸುವಂತೆ ಆಶೀರ್ವದಿಸಿದರು. ತಿರುವಹೀಂದ್ರಪುರದಲ್ಲಿ ಶ್ರೀ ಹಯಗ್ರೀವನ ಅನುಗ್ರಹ ಪಡೆದರು; ಕಾಂಚಿಯಲ್ಲಿ ಬಹುಕಾಲ ಶ್ರೀ ವರದರಾಜನ ಸೇವೆಯಲ್ಲಿದ್ದು 'ವರದರಾಜಪಂಚಾಶತ್' ಮೊದಲಾದ ಸ್ತೋತ್ರಗಳನ್ನು ರಚಿಸಿದರು.",
      ),
      n(
        "At Srirangam, Sri Ranganatha named him Vedantacharya and Ranganayaki called him Sarvatantra Svatantra. Challenged to compose a thousand verses in a night, he wrote the Paduka Sahasram on the Lord's sandals. When Srirangam was sacked, he hid among the dead to save the Srutaprakashika, the great commentary on the Sri Bhashya, and the young sons of its author, and later lived at Satyagalam in Karnataka; his Abhiti Stava prays for the Lord's return to Srirangam.",
        "ಶ್ರೀರಂಗದಲ್ಲಿ ಶ್ರೀ ರಂಗನಾಥನು ಅವರಿಗೆ 'ವೇದಾಂತಾಚಾರ್ಯ' ಎಂದೂ, ರಂಗನಾಯಕಿ 'ಸರ್ವತಂತ್ರಸ್ವತಂತ್ರ' ಎಂದೂ ಬಿರುದು ನೀಡಿದರು. ಒಂದೇ ರಾತ್ರಿಯಲ್ಲಿ ಸಾವಿರ ಶ್ಲೋಕ ರಚಿಸುವ ಸವಾಲಿಗೆ ಸ್ವಾಮಿಯ ಪಾದುಕೆಗಳ ಮೇಲೆ 'ಪಾದುಕಾಸಹಸ್ರ' ರಚಿಸಿದರು. ಶ್ರೀರಂಗ ಲೂಟಿಯಾದಾಗ ಶವಗಳ ನಡುವೆ ಅಡಗಿ ಶ್ರೀಭಾಷ್ಯದ ಮಹಾವ್ಯಾಖ್ಯಾನ 'ಶ್ರುತಪ್ರಕಾಶಿಕಾ'ವನ್ನೂ ಅದರ ಕರ್ತೃವಿನ ಎಳೆಯ ಮಕ್ಕಳನ್ನೂ ಉಳಿಸಿದರು; ಮುಂದೆ ಕರ್ನಾಟಕದ ಸತ್ಯಾಗಾಲದಲ್ಲಿ ನೆಲೆಸಿದರು. ಅವರ 'ಅಭೀತಿಸ್ತವ' ಸ್ವಾಮಿ ಶ್ರೀರಂಗಕ್ಕೆ ಮರಳಲೆಂದು ಪ್ರಾರ್ಥಿಸುತ್ತದೆ.",
      ),
    ],
    works: [
      n("Paduka Sahasram and Daya Shatakam", "ಪಾದುಕಾಸಹಸ್ರ, ದಯಾಶತಕ"),
      n("Rahasya Traya Saram and Tatparya Chandrika", "ರಹಸ್ಯತ್ರಯಸಾರ, ತಾತ್ಪರ್ಯಚಂದ್ರಿಕಾ"),
      n("Yadavabhyudayam, Hamsa Sandesham, Sankalpa Suryodayam", "ಯಾದವಾಭ್ಯುದಯ, ಹಂಸಸಂದೇಶ, ಸಂಕಲ್ಪಸೂರ್ಯೋದಯ"),
      n("Varadaraja Panchashat and Abhiti Stava", "ವರದರಾಜಪಂಚಾಶತ್, ಅಭೀತಿಸ್ತವ"),
    ],
    composition: sloka(
      "tn-vedanta-desikar",
      n("Tanian of Sri Vedanta Desikar", "ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರ ತನಿಯನ್"),
      "ಶ್ರೀಮಾನ್ ವೇಂಕಟನಾಥಾರ್ಯಃ ಕವಿತಾರ್ಕಿಕಕೇಸರೀ ।\nವೇದಾಂತಾಚಾರ್ಯವರ್ಯೋ ಮೇ ಸನ್ನಿಧತ್ತಾಂ ಸದಾ ಹೃದಿ ॥",
      "śrīmān veṅkaṭanāthāryaḥ kavitārkikakesarī |\nvedāntācāryavaryo me sannidhattāṁ sadā hṛdi ||",
      n(
        "May the glorious Venkatanatha, lion among poets and logicians, foremost of Vedanta teachers, ever dwell in my heart.",
        "ಕವಿಗಳು ಮತ್ತು ತಾರ್ಕಿಕರಲ್ಲಿ ಸಿಂಹರಾದ, ವೇದಾಂತಾಚಾರ್ಯರಲ್ಲಿ ಶ್ರೇಷ್ಠರಾದ ಶ್ರೀಮಾನ್ ವೇಂಕಟನಾಥಾರ್ಯರು ಸದಾ ನನ್ನ ಹೃದಯದಲ್ಲಿ ನೆಲೆಸಲಿ.",
      ),
    ),
  },
  {
    slug: "manavala-mamunigal",
    kind: "acharya",
    tirunakshatram: 9,
    name: n("Manavala Mamunigal", "ಮಣವಾಳ ಮಾಮುನಿಗಳ್"),
    alsoKnownAs: n("Ramya Jamatru Muni, Periya Jeeyar", "ರಮ್ಯಜಾಮಾತೃ ಮುನಿ, ಪೆರಿಯ ಜೀಯರ್"),
    birthplace: n("Alwarthirunagari", "ಆಳ್ವಾರ್ ತಿರುನಗರಿ"),
    period: n("1370 – 1443 CE (traditional)", "ಕ್ರಿ.ಶ. 1370 – 1443 (ಸಾಂಪ್ರದಾಯಿಕ)"),
    summary: n(
      "The last great Acharya, to whom Sri Ranganatha Himself, as a child, offered the tanian sung before every recital.",
      "ಕೊನೆಯ ಮಹಾನ್ ಆಚಾರ್ಯ — ಶ್ರೀ ರಂಗನಾಥನೇ ಬಾಲಕನಾಗಿ ಬಂದು ಪ್ರತಿ ಪಾರಾಯಣಕ್ಕೂ ಮೊದಲು ಹಾಡುವ ತನಿಯನ್ ಅನ್ನು ಅರ್ಪಿಸಿದ್ದು ಇವರಿಗೆ.",
    ),
    life: [
      n(
        "Born at Alwarthirunagari, the home of Nammalwar, he became the disciple of Tiruvaimozhi Pillai, who devoted him to Ramanuja and to the Alwars' Tamil Veda. The tradition sees him as Ramanuja come again, and he restored worship and learning across the Divya Desams after the years of invasion.",
        "ನಮ್ಮಾಳ್ವಾರರ ಊರಾದ ಆಳ್ವಾರ್ ತಿರುನಗರಿಯಲ್ಲಿ ಜನಿಸಿದ ಅವರು ತಿರುವಾಯ್ಮೊಳಿ ಪಿಳ್ಳೈಯವರ ಶಿಷ್ಯರಾದರು; ಅವರು ಇವರನ್ನು ರಾಮಾನುಜರಿಗೂ ಆಳ್ವಾರರ ದ್ರಾವಿಡ ವೇದಕ್ಕೂ ಅರ್ಪಿಸಿದರು. ಸಂಪ್ರದಾಯವು ಅವರನ್ನು ರಾಮಾನುಜರ ಪುನರವತಾರವೆಂದು ಕಾಣುತ್ತದೆ; ಆಕ್ರಮಣದ ವರ್ಷಗಳ ನಂತರ ದಿವ್ಯದೇಶಗಳಲ್ಲಿ ಪೂಜೆ, ವಿದ್ಯೆಯನ್ನು ಪುನಃಸ್ಥಾಪಿಸಿದರು.",
      ),
      n(
        "At Srirangam, at the Lord's command, he expounded Tiruvaimozhi with the Eedu commentary for a whole year, with the temple festivals paused. On the final day a small boy stepped forward in the assembly, recited 'Srishailesha dayapatram' and vanished — the Lord Himself, accepting Mamunigal as His acharya. That tanian opens every recital of the Divya Prabandham to this day.",
        "ಶ್ರೀರಂಗದಲ್ಲಿ ಸ್ವಾಮಿಯ ಆಜ್ಞೆಯಂತೆ, ಉತ್ಸವಗಳನ್ನು ನಿಲ್ಲಿಸಿ ಒಂದು ವರ್ಷವಿಡೀ ಈಡು ವ್ಯಾಖ್ಯಾನ ಸಹಿತ ತಿರುವಾಯ್ಮೊಳಿಯನ್ನು ಪ್ರವಚನ ಮಾಡಿದರು. ಕೊನೆಯ ದಿನ ಸಭೆಯಿಂದ ಒಬ್ಬ ಪುಟ್ಟ ಬಾಲಕ ಎದ್ದು 'ಶ್ರೀಶೈಲೇಶ ದಯಾಪಾತ್ರಂ' ಎಂದು ಹಾಡಿ ಮಾಯವಾದನು — ಮಾಮುನಿಗಳನ್ನು ತನ್ನ ಆಚಾರ್ಯರಾಗಿ ಸ್ವೀಕರಿಸಿದ ಸ್ವಾಮಿಯೇ ಅವನು. ಆ ತನಿಯನ್ ಇಂದಿಗೂ ದಿವ್ಯ ಪ್ರಬಂಧದ ಪ್ರತಿ ಪಾರಾಯಣವನ್ನು ಆರಂಭಿಸುತ್ತದೆ.",
      ),
    ],
    works: [
      n("Upadesa Ratnamalai and Tiruvaimozhi Nootrandhadhi", "ಉಪದೇಶರತ್ನಮಾಲೈ, ತಿರುವಾಯ್ಮೊಳಿ ನೂಟ್ರಂದಾದಿ"),
      n("Arthi Prabandham", "ಆರ್ತಿ ಪ್ರಬಂಧ"),
      n("Commentaries on Sri Vachana Bhushanam, Mumukshuppadi and Acharya Hridayam", "ಶ್ರೀವಚನಭೂಷಣ, ಮುಮುಕ್ಷುಪ್ಪಡಿ, ಆಚಾರ್ಯಹೃದಯಗಳಿಗೆ ವ್ಯಾಖ್ಯಾನ"),
    ],
    composition: sloka(
      "tn-manavala-mamunigal",
      n("Tanian of Manavala Mamunigal · given by Sri Ranganatha", "ಮಣವಾಳ ಮಾಮುನಿಗಳ ತನಿಯನ್ · ಶ್ರೀ ರಂಗನಾಥನಿಂದ"),
      "ಶ್ರೀಶೈಲೇಶದಯಾಪಾತ್ರಂ ಧೀಭಕ್ತ್ಯಾದಿಗುಣಾರ್ಣವಮ್ ।\nಯತೀಂದ್ರಪ್ರವಣಂ ವಂದೇ ರಮ್ಯಜಾಮಾತರಂ ಮುನಿಮ್ ॥",
      "śrīśaileśadayāpātraṁ dhībhaktyādiguṇārṇavam |\nyatīndrapravaṇaṁ vande ramyajāmātaraṁ munim ||",
      n(
        "I bow to Ramya Jamatru Muni — the recipient of Srishailesha's grace, an ocean of wisdom, devotion and every virtue, wholly devoted to Yatindra (Ramanuja).",
        "ಶ್ರೀಶೈಲೇಶರ (ತಿರುವಾಯ್ಮೊಳಿ ಪಿಳ್ಳೈ) ದಯೆಗೆ ಪಾತ್ರರಾದ, ಜ್ಞಾನ-ಭಕ್ತಿ ಮೊದಲಾದ ಗುಣಗಳ ಸಾಗರರಾದ, ಯತೀಂದ್ರರಲ್ಲಿ (ರಾಮಾನುಜರಲ್ಲಿ) ನಿಷ್ಠರಾದ ರಮ್ಯಜಾಮಾತೃ ಮುನಿಗಳಿಗೆ ವಂದಿಸುತ್ತೇನೆ.",
      ),
    ),
  },

  // ── Nityasuris ──────────────────────────────────────────────────────────
  {
    slug: "chakrathalwar",
    kind: "nityasuri",
    tirunakshatram: 24,
    name: n("Chakrathalwar (Sri Sudarshana)", "ಚಕ್ರತ್ತಾಳ್ವಾರ್ (ಶ್ರೀ ಸುದರ್ಶನ)"),
    alsoKnownAs: n("Sudarshana, Hetiraja, Chakkarathazhvar", "ಸುದರ್ಶನ, ಹೇತಿರಾಜ, ಚಕ್ಕರತ್ತಾಳ್ವಾರ್"),
    summary: n(
      "The Lord's radiant discus, honoured as an Alwar and protector of devotees — his tirunakshatram is Sudarshana Jayanti.",
      "ಭಗವಂತನ ತೇಜೋಮಯ ಚಕ್ರ — ಆಳ್ವಾರರೆಂದು ಪೂಜಿತರು, ಭಕ್ತರ ರಕ್ಷಕರು; ಅವರ ತಿರುನಕ್ಷತ್ರವೇ ಸುದರ್ಶನ ಜಯಂತಿ.",
    ),
    life: [
      n(
        "Sudarshana, the blazing discus in the Lord's right hand, is one of the Nityasuris — the eternal attendants of Sri Vaikuntha. Srivaishnavas honour him as Chakrathalwar and worship him as the guardian of the Lord's devotees. In temples he is often shown with sixteen arms bearing weapons, with Yoga Narasimha on the reverse; the Chakrapani temple at Kumbakonam is dedicated to him.",
        "ಭಗವಂತನ ಬಲಗೈಯಲ್ಲಿ ಜ್ವಲಿಸುವ ಸುದರ್ಶನ ಚಕ್ರವು ನಿತ್ಯಸೂರಿಗಳಲ್ಲಿ ಒಬ್ಬರು — ಶ್ರೀ ವೈಕುಂಠದ ನಿತ್ಯ ಸೇವಕರು. ಶ್ರೀವೈಷ್ಣವರು ಅವರನ್ನು ಚಕ್ರತ್ತಾಳ್ವಾರ್ ಎಂದು ಗೌರವಿಸಿ ಭಗವದ್ಭಕ್ತರ ರಕ್ಷಕರಾಗಿ ಪೂಜಿಸುತ್ತಾರೆ. ದೇವಾಲಯಗಳಲ್ಲಿ ಅವರು ಹದಿನಾರು ಕೈಗಳಲ್ಲಿ ಆಯುಧಗಳನ್ನು ಹಿಡಿದು, ಹಿಂಭಾಗದಲ್ಲಿ ಯೋಗ ನರಸಿಂಹನೊಂದಿಗೆ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಾರೆ; ಕುಂಭಕೋಣದ ಚಕ್ರಪಾಣಿ ದೇವಾಲಯ ಅವರಿಗೇ ಮೀಸಲು.",
      ),
      n(
        "The Puranas tell how Sudarshana shielded King Ambarisha from Durvasa's wrath and cut down the crocodile that seized Gajendra. Tirumazhisai Alwar is held to be his amsam, and Vedanta Desikar praised him in the Sudarshana Ashtakam and the Shodashayudha Stotram. His tirunakshatram, Aani Chitra, is kept as Sudarshana Jayanti with homams and special worship.",
        "ದುರ್ವಾಸರ ಕೋಪದಿಂದ ಅಂಬರೀಷ ರಾಜನನ್ನು ರಕ್ಷಿಸಿದ, ಗಜೇಂದ್ರನನ್ನು ಹಿಡಿದ ಮೊಸಳೆಯನ್ನು ಸಂಹರಿಸಿದ ಸುದರ್ಶನನ ಕಥೆಗಳನ್ನು ಪುರಾಣಗಳು ಹೇಳುತ್ತವೆ. ತಿರುಮಳಿಶೈ ಆಳ್ವಾರರು ಅವರ ಅಂಶವೆಂದು ಪ್ರತೀತಿ; ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರು 'ಸುದರ್ಶನಾಷ್ಟಕ' ಮತ್ತು 'ಷೋಡಶಾಯುಧ ಸ್ತೋತ್ರ'ಗಳಲ್ಲಿ ಅವರನ್ನು ಸ್ತುತಿಸಿದರು. ಅವರ ತಿರುನಕ್ಷತ್ರ ಆನಿ ಚಿತ್ರಾ — ಸುದರ್ಶನ ಜಯಂತಿಯಾಗಿ ಹೋಮ, ವಿಶೇಷ ಪೂಜೆಗಳೊಂದಿಗೆ ಆಚರಿಸಲಾಗುತ್ತದೆ.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-chakrathalwar",
      n("Sudarshana Ashtakam 1 · Sri Vedanta Desikar", "ಸುದರ್ಶನಾಷ್ಟಕ 1 · ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರ್"),
      "ಪ್ರತಿಭಟಶ್ರೇಣಿಭೀಷಣ ವರಗುಣಸ್ತೋಮಭೂಷಣ\nಜನಿಭಯಸ್ಥಾನತಾರಣ ಜಗದವಸ್ಥಾನಕಾರಣ ।\nನಿಖಿಲದುಷ್ಕರ್ಮಕರ್ಶನ ನಿಗಮಸದ್ಧರ್ಮದರ್ಶನ\nಜಯ ಜಯ ಶ್ರೀಸುದರ್ಶನ ಜಯ ಜಯ ಶ್ರೀಸುದರ್ಶನ ॥",
      "pratibhaṭaśreṇibhīṣaṇa varaguṇastomabhūṣaṇa\njanibhayasthānatāraṇa jagadavasthānakāraṇa |\nnikhiladuṣkarmakarśana nigamasaddharmadarśana\njaya jaya śrīsudarśana jaya jaya śrīsudarśana ||",
      n(
        "Terror to the ranks of foes, adorned with a host of noble qualities; who carries us across birth and its fears, the cause that sustains the world; who wears away every evil deed and reveals the true dharma of the Vedas — victory, victory to Sri Sudarshana!",
        "ಶತ್ರುಸಮೂಹಕ್ಕೆ ಭಯಂಕರನೇ, ಶ್ರೇಷ್ಠ ಗುಣಗಳ ರಾಶಿಯಿಂದ ಅಲಂಕೃತನೇ, ಜನ್ಮಭಯದಿಂದ ಪಾರುಮಾಡುವವನೇ, ಜಗತ್ತಿನ ಸ್ಥಿತಿಗೆ ಕಾರಣನೇ, ಸಕಲ ದುಷ್ಕರ್ಮಗಳನ್ನು ನಾಶಮಾಡುವವನೇ, ವೇದಧರ್ಮವನ್ನು ತೋರುವವನೇ — ಜಯ ಜಯ ಶ್ರೀ ಸುದರ್ಶನ!",
      ),
    ),
  },
  {
    slug: "garudalwar",
    kind: "nityasuri",
    tirunakshatram: 25,
    name: n("Garudalwar (Periya Thiruvadi)", "ಗರುಡಾಳ್ವಾರ್ (ಪೆರಿಯ ತಿರುವಡಿ)"),
    alsoKnownAs: n("Garuda, Vainateya, Periya Thiruvadi", "ಗರುಡ, ವೈನತೇಯ, ಪೆರಿಯ ತಿರುವಡಿ"),
    summary: n(
      "Garuda, the Lord's eagle mount and banner — 'Periya Thiruvadi', the great servant at the Lord's feet.",
      "ಭಗವಂತನ ವಾಹನ ಮತ್ತು ಧ್ವಜವಾದ ಗರುಡ — 'ಪೆರಿಯ ತಿರುವಡಿ', ಸ್ವಾಮಿಯ ಪಾದಸೇವಕರಲ್ಲಿ ಹಿರಿಯರು.",
    ),
    life: [
      n(
        "Garuda, son of the sage Kashyapa and Vinata, is the eternal servant who carries the Lord on his shoulders and flies on His flag. As a youth he brought the nectar of immortality from the gods to free his mother from bondage; pleased with his strength and selflessness, Vishnu made him His own vehicle. Srivaishnavas call him Garudalwar and Periya Thiruvadi.",
        "ಕಶ್ಯಪ ಮುನಿ ಮತ್ತು ವಿನತೆಯ ಮಗನಾದ ಗರುಡನು ಭಗವಂತನನ್ನು ಹೆಗಲ ಮೇಲೆ ಹೊರುವ, ಅವನ ಧ್ವಜದಲ್ಲಿ ಹಾರಾಡುವ ನಿತ್ಯ ಸೇವಕ. ತಾಯಿಯನ್ನು ದಾಸ್ಯದಿಂದ ಬಿಡಿಸಲು ಎಳೆಯ ವಯಸ್ಸಿನಲ್ಲೇ ದೇವತೆಗಳಿಂದ ಅಮೃತವನ್ನು ತಂದನು; ಅವನ ಬಲ ಮತ್ತು ನಿಸ್ವಾರ್ಥತೆಗೆ ಮೆಚ್ಚಿದ ವಿಷ್ಣು ಅವನನ್ನು ತನ್ನ ವಾಹನವಾಗಿಸಿಕೊಂಡನು. ಶ್ರೀವೈಷ್ಣವರು ಅವನನ್ನು ಗರುಡಾಳ್ವಾರ್, ಪೆರಿಯ ತಿರುವಡಿ ಎಂದು ಕರೆಯುತ್ತಾರೆ.",
      ),
      n(
        "Honoured as Vedatma, whose very form is the Vedas, he stands in every Vishnu temple facing the Lord, and the Garuda Seva is the most awaited procession of a Brahmotsavam. Periyalwar is held to be his amsam, and it was through Garuda's grace that Vedanta Desikar received the Hayagriva mantra at Tiruvahindrapuram; Desikar sang the Garuda Dandakam and Garuda Panchashat in thanks. His tirunakshatram is Aadi Swati.",
        "ವೇದಗಳೇ ತನ್ನ ಸ್ವರೂಪವಾದ 'ವೇದಾತ್ಮ'ನೆಂದು ಪೂಜಿತನಾದ ಅವನು ಪ್ರತಿ ವಿಷ್ಣು ದೇವಾಲಯದಲ್ಲೂ ಸ್ವಾಮಿಗೆ ಎದುರಾಗಿ ನಿಂತಿರುತ್ತಾನೆ; ಬ್ರಹ್ಮೋತ್ಸವದಲ್ಲಿ ಗರುಡಸೇವೆಯೇ ಅತ್ಯಂತ ನಿರೀಕ್ಷಿತ ಉತ್ಸವ. ಪೆರಿಯಾಳ್ವಾರರು ಅವನ ಅಂಶವೆಂದು ಪ್ರತೀತಿ; ಗರುಡನ ಅನುಗ್ರಹದಿಂದಲೇ ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರು ತಿರುವಹೀಂದ್ರಪುರದಲ್ಲಿ ಹಯಗ್ರೀವ ಮಂತ್ರವನ್ನು ಪಡೆದು, ಕೃತಜ್ಞತೆಯಿಂದ 'ಗರುಡದಂಡಕ' ಮತ್ತು 'ಗರುಡಪಂಚಾಶತ್' ಹಾಡಿದರು. ಅವನ ತಿರುನಕ್ಷತ್ರ ಆಡಿ ಸ್ವಾತಿ.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-garudalwar",
      n("Garuda prarthana (traditional)", "ಗರುಡ ಪ್ರಾರ್ಥನೆ (ಸಾಂಪ್ರದಾಯಿಕ)"),
      "ಕುಂಕುಮಾಂಕಿತವರ್ಣಾಯ ಕುಂದೇಂದುಧವಲಾಯ ಚ ।\nವಿಷ್ಣುವಾಹ ನಮಸ್ತುಭ್ಯಂ ಪಕ್ಷಿರಾಜಾಯ ತೇ ನಮಃ ॥",
      "kuṅkumāṅkitavarṇāya kundendudhavalāya ca |\nviṣṇuvāha namastubhyaṁ pakṣirājāya te namaḥ ||",
      n(
        "Salutations to you, of saffron hue and white as the jasmine and the moon; O bearer of Vishnu, king of birds, salutations to you.",
        "ಕುಂಕುಮವರ್ಣದವನೇ, ಮಲ್ಲಿಗೆ-ಚಂದ್ರರಂತೆ ಧವಳನೇ, ವಿಷ್ಣುವಾಹನನೇ, ಪಕ್ಷಿರಾಜನೇ, ನಿನಗೆ ನಮಸ್ಕಾರ.",
      ),
    ),
  },

  // ── Recent Acharyas ─────────────────────────────────────────────────────
  {
    slug: "madhuramangalam-jeeyar",
    kind: "recent",
    tirunakshatram: 26,
    name: n("Sri Yatiraja Narayana Ramanuja Jeeyar (Madhuramangalam)", "ಶ್ರೀ ಯತಿರಾಜ ನಾರಾಯಣ ರಾಮಾನುಜ ಜೀಯರ್ (ಮಧುರಮಂಗಲಂ)"),
    alsoKnownAs: n("Madhuramangalam Jeeyar, Divya Desha Jeeyar", "ಮಧುರಮಂಗಲಂ ಜೀಯರ್, ದಿವ್ಯದೇಶ ಜೀಯರ್"),
    period: n("Attained paramapadam on 9 May 2011", "9 ಮೇ 2011ರಂದು ಪರಮಪದ"),
    summary: n(
      "Pontiff of the Emperumanar Jeeyar Mutt at Madhuramangalam, Embar's birthplace — the 'Divya Desha Jeeyar' who worshipped at all 108 Divya Desams.",
      "ಎಂಬಾರರ ಜನ್ಮಸ್ಥಳ ಮಧುರಮಂಗಲದ ಎಂಪೆರುಮಾನಾರ್ ಜೀಯರ್ ಮಠದ ಪೀಠಾಧಿಪತಿಗಳು — 108 ದಿವ್ಯದೇಶಗಳನ್ನೂ ಸೇವಿಸಿದ 'ದಿವ್ಯದೇಶ ಜೀಯರ್'.",
    ),
    life: [
      n(
        "Sri Yatiraja Narayana Ramanuja Jeeyar Swami headed the Emperumanar Jeeyar Mutt at Madhuramangalam near Sriperumbudur — the village where Embar, Ramanuja's cousin and disciple, was born. Under him the mutt ran the Ramanuja Siddhanta Vardhini patashala for the Vedas and Agamas, and he brought many devotees into the Srivaishnava sampradaya.",
        "ಶ್ರೀ ಯತಿರಾಜ ನಾರಾಯಣ ರಾಮಾನುಜ ಜೀಯರ್ ಸ್ವಾಮಿಗಳು ಶ್ರೀಪೆರುಂಬುದೂರ್ ಸಮೀಪದ ಮಧುರಮಂಗಲದ ಎಂಪೆರುಮಾನಾರ್ ಜೀಯರ್ ಮಠದ ಪೀಠಾಧಿಪತಿಗಳಾಗಿದ್ದರು — ರಾಮಾನುಜರ ಸೋದರಸಂಬಂಧಿ ಮತ್ತು ಶಿಷ್ಯರಾದ ಎಂಬಾರರು ಜನಿಸಿದ ಊರು ಇದು. ಅವರ ಮಾರ್ಗದರ್ಶನದಲ್ಲಿ ಮಠವು ವೇದ-ಆಗಮಗಳ 'ರಾಮಾನುಜ ಸಿದ್ಧಾಂತ ವರ್ಧಿನೀ' ಪಾಠಶಾಲೆಯನ್ನು ನಡೆಸಿತು; ಅನೇಕ ಭಕ್ತರನ್ನು ಶ್ರೀವೈಷ್ಣವ ಸಂಪ್ರದಾಯಕ್ಕೆ ಕರೆತಂದರು.",
      ),
      n(
        "He made a year-long journey by road, thousands of kilometres, to worship at all 108 Divya Desams — organised by the mutt with TTD and the SVBC channel — and came to be called the Divya Desha Jeeyar. He attained paramapadam on 9 May 2011; that September his disciples marked his sixtieth tirunakshatram in his memory.",
        "ಮಠವು ಟಿಟಿಡಿ ಮತ್ತು ಎಸ್‌ವಿಬಿಸಿ ವಾಹಿನಿಯೊಂದಿಗೆ ಏರ್ಪಡಿಸಿದ, ಸಾವಿರಾರು ಕಿಲೋಮೀಟರ್‌ಗಳ ಒಂದು ವರ್ಷದ ರಸ್ತೆ ಯಾತ್ರೆಯಲ್ಲಿ ಅವರು 108 ದಿವ್ಯದೇಶಗಳನ್ನೂ ಸೇವಿಸಿ 'ದಿವ್ಯದೇಶ ಜೀಯರ್' ಎಂದು ಪ್ರಸಿದ್ಧರಾದರು. 9 ಮೇ 2011ರಂದು ಪರಮಪದಿಸಿದರು; ಅದೇ ಸೆಪ್ಟೆಂಬರ್‌ನಲ್ಲಿ ಶಿಷ್ಯರು ಅವರ ಸ್ಮರಣೆಯಲ್ಲಿ ಅರವತ್ತನೇ ತಿರುನಕ್ಷತ್ರವನ್ನು ಆಚರಿಸಿದರು.",
      ),
    ],
    works: [],
    composition: sloka(
      "tn-madhuramangalam-jeeyar",
      n("Tanian of Sri Yatiraja Narayana Ramanuja Jeeyar", "ಶ್ರೀ ಯತಿರಾಜ ನಾರಾಯಣ ರಾಮಾನುಜ ಜೀಯರರ ತನಿಯನ್"),
      "ವಿಜಯವರ್ಷೇ ಕನ್ಯಾಮಾಸೇ ಹಸ್ತಭೇ ಗುರುವಾಸರೇ ಜಾತಂ ।\nಶ್ರೀಯತಿರಾಜನಾರಾಯಣರಾಮಾನುಜದೇಶಿಕೇಂದ್ರಮ್ ।\nಪ್ರಣತೋಽಸ್ಮಿ ಸದಾ ತಸ್ಯ ಚರಣಾಂಬುಜಸನ್ನಿಧಿಮ್ ॥",
      "vijayavarṣe kanyāmāse hastabhe guruvāsare jātaṁ |\nśrīyatirājanārāyaṇarāmānujadeśikendram |\npraṇato 'smi sadā tasya caraṇāmbujasannidhim ||",
      n(
        "To Sri Yatiraja Narayana Ramanuja, foremost of teachers — born in the Vijaya year, in the month of Kanya, under the star Hasta, on a Thursday — I bow always, at the presence of his lotus feet.",
        "ವಿಜಯ ಸಂವತ್ಸರದ ಕನ್ಯಾ ಮಾಸದಲ್ಲಿ, ಹಸ್ತ ನಕ್ಷತ್ರದಲ್ಲಿ, ಗುರುವಾರದಂದು ಅವತರಿಸಿದ ಆಚಾರ್ಯಶ್ರೇಷ್ಠ ಶ್ರೀ ಯತಿರಾಜ ನಾರಾಯಣ ರಾಮಾನುಜರ ಪಾದಕಮಲಗಳ ಸನ್ನಿಧಿಗೆ ಸದಾ ನಮಿಸುತ್ತೇನೆ.",
      ),
    ),
  },
  {
    slug: "satakopa-ramanuja-jeeyar",
    kind: "recent",
    name: n("Sri Satakopa Ramanuja Jeeyar Swami", "ಶ್ರೀ ಶಠಕೋಪ ರಾಮಾನುಜ ಜೀಯರ್ ಸ್ವಾಮಿ"),
    alsoKnownAs: n("23rd pontiff of the Sri Andal Jeeyar Mutt, Srivilliputtur", "ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರ್ ಶ್ರೀ ಆಂಡಾಳ್ ಜೀಯರ್ ಮಠದ 23ನೇ ಪೀಠಾಧಿಪತಿ"),
    summary: n(
      "The 23rd Jeeyar of the Sri Andal Jeeyar Mutt at Srivilliputtur, and founder of the Anandashrama at Melkote.",
      "ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರಿನ ಶ್ರೀ ಆಂಡಾಳ್ ಜೀಯರ್ ಮಠದ 23ನೇ ಜೀಯರ್ — ಮೇಲುಕೋಟೆಯ ಆನಂದಾಶ್ರಮದ ಸ್ಥಾಪಕರು.",
    ),
    life: [
      n(
        "The Sri Andal Jeeyar Mutt at Srivilliputtur — the birthplace of Sri Andal and Periyalwar — traces an unbroken line of Jeeyars to Manavala Mamunigal, some six hundred years ago. Its pontiffs bear the title Satakopa Ramanuja Jeeyar, and Swami is the 23rd in that line.",
        "ಶ್ರೀ ಆಂಡಾಳ್ ಮತ್ತು ಪೆರಿಯಾಳ್ವಾರರ ಜನ್ಮಸ್ಥಳವಾದ ಶ್ರೀವಿಲ್ಲಿಪುತ್ತೂರಿನ ಶ್ರೀ ಆಂಡಾಳ್ ಜೀಯರ್ ಮಠವು ಸುಮಾರು ಆರುನೂರು ವರ್ಷಗಳ ಹಿಂದೆ ಮಣವಾಳ ಮಾಮುನಿಗಳಿಂದ ಆರಂಭವಾದ ಅಖಂಡ ಜೀಯರ್ ಪರಂಪರೆಯನ್ನು ಹೊಂದಿದೆ. ಅದರ ಪೀಠಾಧಿಪತಿಗಳು 'ಶಠಕೋಪ ರಾಮಾನುಜ ಜೀಯರ್' ಎಂಬ ಬಿರುದು ಧರಿಸುತ್ತಾರೆ; ಸ್ವಾಮಿಗಳು ಆ ಪರಂಪರೆಯ 23ನೇಯವರು.",
      ),
      n(
        "Swami has carried the mutt's service to Melkote — Tirunarayanapuram, where Sri Ramanuja lived for twelve years — founding the Anandashrama there. At Melukote the mutt also runs a gurukula patashala teaching the Yajurveda, the Divya Prabandham and Sanskrit.",
        "ಸ್ವಾಮಿಗಳು ಮಠದ ಸೇವೆಯನ್ನು ಶ್ರೀ ರಾಮಾನುಜರು ಹನ್ನೆರಡು ವರ್ಷ ನೆಲೆಸಿದ ತಿರುನಾರಾಯಣಪುರ — ಮೇಲುಕೋಟೆಗೆ ವಿಸ್ತರಿಸಿ ಅಲ್ಲಿ ಆನಂದಾಶ್ರಮವನ್ನು ಸ್ಥಾಪಿಸಿದರು. ಮೇಲುಕೋಟೆಯಲ್ಲಿ ಮಠವು ಯಜುರ್ವೇದ, ದಿವ್ಯ ಪ್ರಬಂಧ ಮತ್ತು ಸಂಸ್ಕೃತವನ್ನು ಕಲಿಸುವ ಗುರುಕುಲ ಪಾಠಶಾಲೆಯನ್ನೂ ನಡೆಸುತ್ತದೆ.",
      ),
    ],
    works: [],
  },
];

// Freely licensed pictures from Wikimedia Commons, saved in public/images/acharyas.
const PICTURES: Record<string, Omit<MediaCredit, "src">> = PICTURE_CREDITS;

// Freely licensed recordings from Wikimedia Commons, saved in public/audio/acharyas.
const RECORDINGS: Record<string, MediaCredit> = {
  ramanuja: {
    src: "/audio/acharyas/ramanuja-tanian.mp3",
    author: "Sriveenkat",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Y%C5%8Dnityamacyuta_pad%C4%81mbhuja_(r%C4%81m%C4%81nujar_or_known_as_emperum%C4%81%E1%B9%89%C4%81r_ta%E1%B9%89iya%E1%B9%89).ogg",
    title: n("The tanian \"Yo nityam acyuta\", recited", "\"ಯೋ ನಿತ್ಯಮಚ್ಯುತ\" ತನಿಯನ್ ಪಠಣ"),
  },
  periyalwar: {
    src: "/audio/acharyas/tiruppallandu.mp3",
    author: "Sriveenkat (Tamil Wikisource audiobook)",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:%E0%AE%A4%E0%AE%BF%E0%AE%B0%E0%AF%81%E0%AE%AA%E0%AF%8D%E0%AE%AA%E0%AE%B2%E0%AF%8D%E0%AE%B2%E0%AE%BE%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%81_%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D.ogg",
    title: n("Tiruppallandu, all twelve verses", "ತಿರುಪ್ಪಲ್ಲಾಂಡು, ಹನ್ನೆರಡೂ ಪಾಶುರಗಳು"),
  },
  "madhurakavi-alwar": {
    src: "/audio/acharyas/kanninun-siruthambu.mp3",
    author: "Sriveenkat",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kanninun_Cirutampu.ogg",
    title: n("Kanninun Siruthambu, all eleven verses", "ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು, ಹನ್ನೊಂದೂ ಪಾಶುರಗಳು"),
  },
  "kulasekhara-alwar": {
    src: "/audio/acharyas/mukunda-mala-nagaratnamma.mp3",
    author: "Bengaluru Nagaratnamma (historic recording)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mukunda_Mala_stotra_by_Bengaluru_Nagaratnamma.ogg",
    title: n("A verse of his Mukunda Mala, sung by Bengaluru Nagaratnamma", "ಮುಕುಂದಮಾಲೆಯ ಒಂದು ಶ್ಲೋಕ, ಬೆಂಗಳೂರು ನಾಗರತ್ನಮ್ಮ ಅವರ ಗಾಯನ"),
  },
};

for (const a of ACHARYAS) {
  const picture = PICTURES[a.slug];
  if (picture) a.picture = { src: `/images/acharyas/${a.slug}.jpg`, ...picture };
  if (RECORDINGS[a.slug]) a.audio = RECORDINGS[a.slug];
}

/** The picture and recording to show: the temple's uploads first, else the bundled ones. */
export function mediaFor(a: Acharya, uploads: AcharyaUploads) {
  const image = uploads.images[a.slug];
  const audio = uploads.audio[a.slug];
  return {
    imageUrl: image ?? a.picture?.src ?? null,
    imageCredit: image ? null : (a.picture ?? null),
    audioUrl: audio ?? a.audio?.src ?? null,
    audioCredit: audio ? null : (a.audio ?? null),
  };
}

export type AcharyaUploads = { images: Record<string, string>; audio: Record<string, string> };
export const NO_UPLOADS: AcharyaUploads = { images: {}, audio: {} };

const BY_SLUG = new Map(ACHARYAS.map((a) => [a.slug, a]));
const BY_TIRUNAKSHATRAM = new Map(ACHARYAS.filter((a) => a.tirunakshatram !== undefined).map((a) => [a.tirunakshatram!, a]));

export const acharyaBySlug = (slug: string) => BY_SLUG.get(slug);
export const acharyaForTirunakshatram = (index: number) => BY_TIRUNAKSHATRAM.get(index);

/** The Alwars and Acharyas whose tirunakshatram falls on a day. */
export function acharyasOn(observances: Observance[]): Acharya[] {
  return observances.flatMap((o) => (o.kind === "tirunakshatram" ? [acharyaForTirunakshatram(o.index)].filter((a) => !!a) : [])) as Acharya[];
}

/** "Aippasi · Shravana" — the month and star of a tirunakshatram (null while unknown). */
export function tirunakshatramOf(a: Acharya) {
  if (a.tirunakshatram === undefined) return null;
  const tn = TIRUNAKSHATRAMS[a.tirunakshatram];
  return { month: TAMIL_MONTHS[tn.rashi], nakshatra: tn.nakshatra };
}

/** The page about an Alwar or Acharya. */
export const acharyaPath = (slug: string) => `/panchangam/acharya/${slug}`;
