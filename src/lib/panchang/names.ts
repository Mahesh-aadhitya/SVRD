// Panchangam vocabulary in English and Kannada. Indexes match the values
// computed in ./compute (e.g. TITHIS[0] is Shukla Prathama's name).
import { NAKSHATRAS } from "@/lib/nakshatras";

export type Named = { en: string; kn: string };

const n = (en: string, kn: string): Named => ({ en, kn });

export function label(item: Named, locale: string) {
  return locale === "kn" ? item.kn : item.en;
}

// 15 names; tithi index 0–14 is Shukla, 15–29 Krishna (29 = Amavasya).
const TITHI_NAMES: Named[] = [
  n("Prathama", "ಪ್ರತಿಪದ"),
  n("Dwitiya", "ದ್ವಿತೀಯ"),
  n("Tritiya", "ತೃತೀಯ"),
  n("Chaturthi", "ಚತುರ್ಥಿ"),
  n("Panchami", "ಪಂಚಮಿ"),
  n("Shashthi", "ಷಷ್ಠಿ"),
  n("Saptami", "ಸಪ್ತಮಿ"),
  n("Ashtami", "ಅಷ್ಟಮಿ"),
  n("Navami", "ನವಮಿ"),
  n("Dashami", "ದಶಮಿ"),
  n("Ekadashi", "ಏಕಾದಶಿ"),
  n("Dwadashi", "ದ್ವಾದಶಿ"),
  n("Trayodashi", "ತ್ರಯೋದಶಿ"),
  n("Chaturdashi", "ಚತುರ್ದಶಿ"),
];
const PURNIMA = n("Purnima", "ಹುಣ್ಣಿಮೆ");
const AMAVASYA = n("Amavasya", "ಅಮಾವಾಸ್ಯೆ");

export function tithiName(index: number): Named {
  if (index === 14) return PURNIMA;
  if (index === 29) return AMAVASYA;
  return TITHI_NAMES[index % 15];
}

export const PAKSHAS: Named[] = [n("Shukla Paksha", "ಶುಕ್ಲ ಪಕ್ಷ"), n("Krishna Paksha", "ಕೃಷ್ಣ ಪಕ್ಷ")];

export const NAKSHATRA_NAMES: Named[] = NAKSHATRAS.map((x) => n(x.key, x.kn));

export const YOGAS: Named[] = [
  n("Vishkambha", "ವಿಷ್ಕಂಭ"),
  n("Priti", "ಪ್ರೀತಿ"),
  n("Ayushman", "ಆಯುಷ್ಮಾನ್"),
  n("Saubhagya", "ಸೌಭಾಗ್ಯ"),
  n("Shobhana", "ಶೋಭನ"),
  n("Atiganda", "ಅತಿಗಂಡ"),
  n("Sukarma", "ಸುಕರ್ಮ"),
  n("Dhriti", "ಧೃತಿ"),
  n("Shula", "ಶೂಲ"),
  n("Ganda", "ಗಂಡ"),
  n("Vriddhi", "ವೃದ್ಧಿ"),
  n("Dhruva", "ಧ್ರುವ"),
  n("Vyaghata", "ವ್ಯಾಘಾತ"),
  n("Harshana", "ಹರ್ಷಣ"),
  n("Vajra", "ವಜ್ರ"),
  n("Siddhi", "ಸಿದ್ಧಿ"),
  n("Vyatipata", "ವ್ಯತೀಪಾತ"),
  n("Variyan", "ವರೀಯಾನ್"),
  n("Parigha", "ಪರಿಘ"),
  n("Shiva", "ಶಿವ"),
  n("Siddha", "ಸಿದ್ಧ"),
  n("Sadhya", "ಸಾಧ್ಯ"),
  n("Shubha", "ಶುಭ"),
  n("Shukla", "ಶುಕ್ಲ"),
  n("Brahma", "ಬ್ರಹ್ಮ"),
  n("Indra", "ಐಂದ್ರ"),
  n("Vaidhriti", "ವೈಧೃತಿ"),
];

// Karana index 0–59 (half-tithis). 0 is Kimstughna, 1–56 cycle through
// the seven movable karanas, 57–59 are the fixed ones.
const MOVABLE_KARANAS: Named[] = [
  n("Bava", "ಬವ"),
  n("Balava", "ಬಾಲವ"),
  n("Kaulava", "ಕೌಲವ"),
  n("Taitila", "ತೈತಿಲ"),
  n("Garaja", "ಗರಜ"),
  n("Vanija", "ವಣಿಜ"),
  n("Vishti (Bhadra)", "ವಿಷ್ಟಿ (ಭದ್ರಾ)"),
];
const FIXED_KARANAS: Named[] = [n("Shakuni", "ಶಕುನಿ"), n("Chatushpada", "ಚತುಷ್ಪಾದ"), n("Naga", "ನಾಗ")];
const KIMSTUGHNA = n("Kimstughna", "ಕಿಂಸ್ತುಘ್ನ");

export function karanaName(index: number): Named {
  if (index === 0) return KIMSTUGHNA;
  if (index >= 57) return FIXED_KARANAS[index - 57];
  return MOVABLE_KARANAS[(index - 1) % 7];
}

// Sunday first, matching Date#getUTCDay.
export const VARAS: Named[] = [
  n("Sunday · Bhanuvara", "ಭಾನುವಾರ"),
  n("Monday · Somavara", "ಸೋಮವಾರ"),
  n("Tuesday · Mangalavara", "ಮಂಗಳವಾರ"),
  n("Wednesday · Budhavara", "ಬುಧವಾರ"),
  n("Thursday · Guruvara", "ಗುರುವಾರ"),
  n("Friday · Shukravara", "ಶುಕ್ರವಾರ"),
  n("Saturday · Shanivara", "ಶನಿವಾರ"),
];

// Amanta lunar months, Chaitra first.
export const MASAS: Named[] = [
  n("Chaitra", "ಚೈತ್ರ"),
  n("Vaishakha", "ವೈಶಾಖ"),
  n("Jyeshtha", "ಜ್ಯೇಷ್ಠ"),
  n("Ashadha", "ಆಷಾಢ"),
  n("Shravana", "ಶ್ರಾವಣ"),
  n("Bhadrapada", "ಭಾದ್ರಪದ"),
  n("Ashvayuja", "ಆಶ್ವಯುಜ"),
  n("Kartika", "ಕಾರ್ತಿಕ"),
  n("Margashira", "ಮಾರ್ಗಶಿರ"),
  n("Pushya", "ಪುಷ್ಯ"),
  n("Magha", "ಮಾಘ"),
  n("Phalguna", "ಫಾಲ್ಗುಣ"),
];

export const ADHIKA = n("Adhika", "ಅಧಿಕ");

export const RITUS: Named[] = [
  n("Vasanta", "ವಸಂತ"),
  n("Grishma", "ಗ್ರೀಷ್ಮ"),
  n("Varsha", "ವರ್ಷ"),
  n("Sharad", "ಶರದ್"),
  n("Hemanta", "ಹೇಮಂತ"),
  n("Shishira", "ಶಿಶಿರ"),
];

export const AYANAS: Named[] = [n("Uttarayana", "ಉತ್ತರಾಯಣ"), n("Dakshinayana", "ದಕ್ಷಿಣಾಯನ")];

// Mesha first.
export const RASHIS: Named[] = [
  n("Mesha", "ಮೇಷ"),
  n("Vrishabha", "ವೃಷಭ"),
  n("Mithuna", "ಮಿಥುನ"),
  n("Karkataka", "ಕರ್ಕಾಟಕ"),
  n("Simha", "ಸಿಂಹ"),
  n("Kanya", "ಕನ್ಯಾ"),
  n("Tula", "ತುಲಾ"),
  n("Vrishchika", "ವೃಶ್ಚಿಕ"),
  n("Dhanu", "ಧನು"),
  n("Makara", "ಮಕರ"),
  n("Kumbha", "ಕುಂಭ"),
  n("Meena", "ಮೀನ"),
];

// Zodiac glyphs, Mesha first. U+FE0E asks for the plain text glyph rather
// than a colour emoji.
export const RASHI_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => `${g}\uFE0E`);

// The 60-year cycle, Prabhava first.
export const SAMVATSARAS: Named[] = [
  n("Prabhava", "ಪ್ರಭವ"),
  n("Vibhava", "ವಿಭವ"),
  n("Shukla", "ಶುಕ್ಲ"),
  n("Pramoduta", "ಪ್ರಮೋದೂತ"),
  n("Prajotpatti", "ಪ್ರಜೋತ್ಪತ್ತಿ"),
  n("Angirasa", "ಆಂಗೀರಸ"),
  n("Shrimukha", "ಶ್ರೀಮುಖ"),
  n("Bhava", "ಭಾವ"),
  n("Yuva", "ಯುವ"),
  n("Dhatu", "ಧಾತು"),
  n("Ishvara", "ಈಶ್ವರ"),
  n("Bahudhanya", "ಬಹುಧಾನ್ಯ"),
  n("Pramathi", "ಪ್ರಮಾಥಿ"),
  n("Vikrama", "ವಿಕ್ರಮ"),
  n("Vrisha", "ವೃಷ"),
  n("Chitrabhanu", "ಚಿತ್ರಭಾನು"),
  n("Svabhanu", "ಸ್ವಭಾನು"),
  n("Tarana", "ತಾರಣ"),
  n("Parthiva", "ಪಾರ್ಥಿವ"),
  n("Vyaya", "ವ್ಯಯ"),
  n("Sarvajit", "ಸರ್ವಜಿತ್"),
  n("Sarvadhari", "ಸರ್ವಧಾರಿ"),
  n("Virodhi", "ವಿರೋಧಿ"),
  n("Vikriti", "ವಿಕೃತಿ"),
  n("Khara", "ಖರ"),
  n("Nandana", "ನಂದನ"),
  n("Vijaya", "ವಿಜಯ"),
  n("Jaya", "ಜಯ"),
  n("Manmatha", "ಮನ್ಮಥ"),
  n("Durmukhi", "ದುರ್ಮುಖಿ"),
  n("Hevilambi", "ಹೇವಿಳಂಬಿ"),
  n("Vilambi", "ವಿಳಂಬಿ"),
  n("Vikari", "ವಿಕಾರಿ"),
  n("Sharvari", "ಶಾರ್ವರಿ"),
  n("Plava", "ಪ್ಲವ"),
  n("Shubhakrit", "ಶುಭಕೃತ್"),
  n("Shobhakrit", "ಶೋಭಕೃತ್"),
  n("Krodhi", "ಕ್ರೋಧಿ"),
  n("Vishvavasu", "ವಿಶ್ವಾವಸು"),
  n("Parabhava", "ಪರಾಭವ"),
  n("Plavanga", "ಪ್ಲವಂಗ"),
  n("Kilaka", "ಕೀಲಕ"),
  n("Saumya", "ಸೌಮ್ಯ"),
  n("Sadharana", "ಸಾಧಾರಣ"),
  n("Virodhikrit", "ವಿರೋಧಿಕೃತ್"),
  n("Paridhavi", "ಪರಿಧಾವಿ"),
  n("Pramadicha", "ಪ್ರಮಾದೀಚ"),
  n("Ananda", "ಆನಂದ"),
  n("Rakshasa", "ರಾಕ್ಷಸ"),
  n("Nala", "ನಳ"),
  n("Pingala", "ಪಿಂಗಳ"),
  n("Kalayukti", "ಕಾಳಯುಕ್ತಿ"),
  n("Siddharthi", "ಸಿದ್ಧಾರ್ಥಿ"),
  n("Raudra", "ರೌದ್ರ"),
  n("Durmati", "ದುರ್ಮತಿ"),
  n("Dundubhi", "ದುಂದುಭಿ"),
  n("Rudhirodgari", "ರುಧಿರೋದ್ಗಾರಿ"),
  n("Raktakshi", "ರಕ್ತಾಕ್ಷಿ"),
  n("Krodhana", "ಕ್ರೋಧನ"),
  n("Akshaya", "ಅಕ್ಷಯ"),
];

export type GrahaKey = "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn" | "rahu" | "ketu";

// Short names for labels in the sky.
export const GRAHA_SHORT: Record<GrahaKey, Named> = {
  sun: n("Surya", "ಸೂರ್ಯ"),
  moon: n("Chandra", "ಚಂದ್ರ"),
  mars: n("Kuja", "ಕುಜ"),
  mercury: n("Budha", "ಬುಧ"),
  jupiter: n("Guru", "ಗುರು"),
  venus: n("Shukra", "ಶುಕ್ರ"),
  saturn: n("Shani", "ಶನಿ"),
  rahu: n("Rahu", "ರಾಹು"),
  ketu: n("Ketu", "ಕೇತು"),
};

export const GRAHAS: Record<GrahaKey, Named & { about: Named }> = {
  sun: { ...n("Surya", "ಸೂರ್ಯ"), about: n("Soul, vitality and authority.", "ಆತ್ಮ, ಚೈತನ್ಯ ಮತ್ತು ಅಧಿಕಾರದ ಕಾರಕ.") },
  moon: { ...n("Chandra", "ಚಂದ್ರ"), about: n("Mind, emotions and nourishment.", "ಮನಸ್ಸು, ಭಾವನೆ ಮತ್ತು ಪೋಷಣೆಯ ಕಾರಕ.") },
  mars: { ...n("Kuja (Mangala)", "ಕುಜ (ಮಂಗಳ)"), about: n("Courage, energy and land.", "ಧೈರ್ಯ, ಶಕ್ತಿ ಮತ್ತು ಭೂಮಿಯ ಕಾರಕ.") },
  mercury: { ...n("Budha", "ಬುಧ"), about: n("Intellect, speech and trade.", "ಬುದ್ಧಿ, ವಾಕ್ ಮತ್ತು ವ್ಯಾಪಾರದ ಕಾರಕ.") },
  jupiter: { ...n("Guru (Brihaspati)", "ಗುರು (ಬೃಹಸ್ಪತಿ)"), about: n("Wisdom, dharma and blessings.", "ಜ್ಞಾನ, ಧರ್ಮ ಮತ್ತು ಅನುಗ್ರಹದ ಕಾರಕ.") },
  venus: { ...n("Shukra", "ಶುಕ್ರ"), about: n("Beauty, arts and harmony.", "ಸೌಂದರ್ಯ, ಕಲೆ ಮತ್ತು ಸಾಮರಸ್ಯದ ಕಾರಕ.") },
  saturn: { ...n("Shani", "ಶನಿ"), about: n("Discipline, patience and karma.", "ಶಿಸ್ತು, ತಾಳ್ಮೆ ಮತ್ತು ಕರ್ಮದ ಕಾರಕ.") },
  rahu: { ...n("Rahu", "ರಾಹು"), about: n("The Moon's north node — desire and illusion.", "ಚಂದ್ರನ ಉತ್ತರ ಪಾತ — ಆಸೆ ಮತ್ತು ಮಾಯೆ.") },
  ketu: { ...n("Ketu", "ಕೇತು"), about: n("The Moon's south node — detachment and moksha.", "ಚಂದ್ರನ ದಕ್ಷಿಣ ಪಾತ — ವೈರಾಗ್ಯ ಮತ್ತು ಮೋಕ್ಷ.") },
};

export const GRAHA_ORDER: GrahaKey[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

// When a festival's tithi must prevail: at sunrise (the default), midday
// (madhyahna), afternoon (aparahna), dusk (pradosha) or midnight (nishita).
export type TithiMoment = "sunrise" | "noon" | "aparahna" | "sunset" | "midnight";

// Festivals keyed by amanta masa + tithi.
export const FESTIVALS: { masa: number; tithi: number; name: Named; at?: TithiMoment }[] = [
  { masa: 0, tithi: 0, name: n("Ugadi", "ಯುಗಾದಿ") },
  { masa: 0, tithi: 8, name: n("Sri Rama Navami", "ಶ್ರೀ ರಾಮ ನವಮಿ"), at: "noon" },
  { masa: 1, tithi: 2, name: n("Akshaya Tritiya", "ಅಕ್ಷಯ ತೃತೀಯ") },
  { masa: 1, tithi: 13, name: n("Sri Narasimha Jayanti", "ಶ್ರೀ ನರಸಿಂಹ ಜಯಂತಿ"), at: "sunset" },
  { masa: 3, tithi: 14, name: n("Guru Purnima", "ಗುರು ಪೂರ್ಣಿಮೆ") },
  { masa: 4, tithi: 4, name: n("Naga Panchami", "ನಾಗರ ಪಂಚಮಿ") },
  { masa: 4, tithi: 14, name: n("Upakarma", "ಉಪಾಕರ್ಮ") },
  { masa: 4, tithi: 22, name: n("Sri Krishna Janmashtami", "ಶ್ರೀ ಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ"), at: "midnight" },
  { masa: 5, tithi: 3, name: n("Ganesha Chaturthi", "ಗಣೇಶ ಚತುರ್ಥಿ"), at: "noon" },
  { masa: 5, tithi: 13, name: n("Ananta Chaturdashi", "ಅನಂತ ಚತುರ್ದಶಿ") },
  { masa: 5, tithi: 29, name: n("Mahalaya Amavasya", "ಮಹಾಲಯ ಅಮಾವಾಸ್ಯೆ") },
  { masa: 6, tithi: 0, name: n("Navaratri begins", "ನವರಾತ್ರಿ ಆರಂಭ") },
  { masa: 6, tithi: 9, name: n("Vijayadashami", "ವಿಜಯದಶಮಿ"), at: "aparahna" },
  { masa: 6, tithi: 28, name: n("Naraka Chaturdashi", "ನರಕ ಚತುರ್ದಶಿ") },
  { masa: 6, tithi: 29, name: n("Deepavali · Lakshmi Puja", "ದೀಪಾವಳಿ · ಲಕ್ಷ್ಮೀ ಪೂಜೆ"), at: "sunset" },
  { masa: 7, tithi: 0, name: n("Bali Padyami", "ಬಲಿ ಪಾಡ್ಯಮಿ") },
  { masa: 7, tithi: 14, name: n("Kartika Purnima", "ಕಾರ್ತಿಕ ಪೂರ್ಣಿಮೆ") },
  { masa: 8, tithi: 10, name: n("Gita Jayanti", "ಗೀತಾ ಜಯಂತಿ") },
  { masa: 8, tithi: 12, name: n("Hanuma Jayanti", "ಹನುಮ ಜಯಂತಿ") },
  { masa: 8, tithi: 14, name: n("Datta Jayanti", "ದತ್ತ ಜಯಂತಿ") },
  { masa: 10, tithi: 4, name: n("Vasanta Panchami", "ವಸಂತ ಪಂಚಮಿ") },
  { masa: 10, tithi: 6, name: n("Ratha Saptami", "ರಥಸಪ್ತಮಿ") },
  { masa: 10, tithi: 28, name: n("Maha Shivaratri", "ಮಹಾ ಶಿವರಾತ್ರಿ"), at: "midnight" },
  { masa: 11, tithi: 14, name: n("Holi Hunnime", "ಹೋಳಿ ಹುಣ್ಣಿಮೆ") },
  { masa: 5, tithi: 11, name: n("Sri Vamana Jayanti", "ಶ್ರೀ ವಾಮನ ಜಯಂತಿ") },
  { masa: 6, tithi: 7, name: n("Durgashtami", "ದುರ್ಗಾಷ್ಟಮಿ") },
  { masa: 6, tithi: 8, name: n("Mahanavami · Ayudha Puja", "ಮಹಾನವಮಿ · ಆಯುಧ ಪೂಜೆ") },
  { masa: 7, tithi: 11, name: n("Tulasi Vivaha (Uttana Dwadashi)", "ತುಳಸಿ ವಿವಾಹ (ಉತ್ಥಾನ ದ್ವಾದಶಿ)") },
  { masa: 8, tithi: 5, name: n("Subrahmanya Shashthi", "ಸುಬ್ರಹ್ಮಣ್ಯ ಷಷ್ಠಿ") },
];

export const OBSERVANCES = {
  ekadashi: n("Ekadashi vrata", "ಏಕಾದಶಿ ವ್ರತ"),
  vaikunthaEkadashi: n("Vaikuntha Ekadashi", "ವೈಕುಂಠ ಏಕಾದಶಿ"),
  pradosha: n("Pradosha", "ಪ್ರದೋಷ"),
  sankashti: n("Sankashti Chaturthi", "ಸಂಕಷ್ಟ ಚತುರ್ಥಿ"),
  purnima: n("Purnima", "ಹುಣ್ಣಿಮೆ"),
  amavasya: n("Amavasya", "ಅಮಾವಾಸ್ಯೆ"),
  sankranti: n("Sankramana", "ಸಂಕ್ರಮಣ"),
};

// Ekadashi names by amanta masa: [Shukla, Krishna]. (The Krishna Ekadashi
// of an amanta month carries the name the purnimanta calendar gives the
// following month's.)
export const EKADASHI_NAMES: [Named, Named][] = [
  [n("Kamada", "ಕಾಮದಾ"), n("Varuthini", "ವರೂಥಿನೀ")],
  [n("Mohini", "ಮೋಹಿನೀ"), n("Apara", "ಅಪರಾ")],
  [n("Nirjala", "ನಿರ್ಜಲಾ"), n("Yogini", "ಯೋಗಿನೀ")],
  [n("Shayani", "ಶಯನೀ"), n("Kamika", "ಕಾಮಿಕಾ")],
  [n("Putrada", "ಪುತ್ರದಾ"), n("Aja", "ಅಜಾ")],
  [n("Parivartini", "ಪರಿವರ್ತಿನೀ"), n("Indira", "ಇಂದಿರಾ")],
  [n("Papankusha", "ಪಾಪಾಂಕುಶಾ"), n("Rama", "ರಮಾ")],
  [n("Prabodhini (Utthana)", "ಪ್ರಬೋಧಿನೀ (ಉತ್ಥಾನ)"), n("Utpanna", "ಉತ್ಪನ್ನಾ")],
  [n("Mokshada", "ಮೋಕ್ಷದಾ"), n("Saphala", "ಸಫಲಾ")],
  [n("Pausha Putrada", "ಪುಷ್ಯ ಪುತ್ರದಾ"), n("Shattila", "ಷಟ್ತಿಲಾ")],
  [n("Jaya", "ಜಯಾ"), n("Vijaya", "ವಿಜಯಾ")],
  [n("Amalaki", "ಆಮಲಕೀ"), n("Papamochani", "ಪಾಪಮೋಚನೀ")],
];
export const ADHIKA_EKADASHI_NAMES: [Named, Named] = [n("Padmini", "ಪದ್ಮಿನೀ"), n("Parama", "ಪರಮಾ")];
export const EKADASHI = n("Ekadashi", "ಏಕಾದಶಿ");

// Our temple's own annual utsavas — amanta masa + tithi (15+ = bahula).
/** The temple's town — named with the temple wherever timings are shared. */
export const TEMPLE_TOWN: Named = { en: "Kolar", kn: "ಕೋಲಾರ" };

export const TEMPLE_UTSAVAS = {
  varadaraja: {
    masa: 10,
    tithi: 19, // Magha Bahula Panchami
    name: n("Sri Varadarajaswamy Varshikotsava", "ಶ್ರೀ ವರದರಾಜಸ್ವಾಮಿ ವಾರ್ಷಿಕೋತ್ಸವ"),
    rule: n("Magha Bahula Panchami", "ಮಾಘ ಬಹುಳ ಪಂಚಮಿ"),
  },
  goda: {
    masa: 2,
    tithi: 24, // Jyeshtha Bahula Dashami
    name: n("Sri Goda Devi Varshikotsava", "ಶ್ರೀ ಗೋದಾದೇವಿ ವಾರ್ಷಿಕೋತ್ಸವ"),
    rule: n("Jyeshtha Bahula Dashami", "ಜ್ಯೇಷ್ಠ ಬಹುಳ ದಶಮಿ"),
  },
} as const;
export type UtsavaKey = keyof typeof TEMPLE_UTSAVAS;

// Festivals that aren't a plain masa + tithi.
export const SPECIAL_FESTIVALS = {
  makaraSankranti: n("Makara Sankranti", "ಮಕರ ಸಂಕ್ರಾಂತಿ"),
  varamahalakshmi: n("Varamahalakshmi Vrata", "ವರಮಹಾಲಕ್ಷ್ಮೀ ವ್ರತ"),
  vaikunthaEkadashi: n("Vaikuntha Ekadashi", "ವೈಕುಂಠ ಏಕಾದಶಿ"),
  shravana: n("Shravana nakshatra (Tiruvonam)", "ಶ್ರವಣ ನಕ್ಷತ್ರ (ತಿರುವೋಣ)"),
};

// Sri Venkateswara Swamy's festivals at Tirumala, by their traditional
// rules. TTD announces the final dates each year.
export const TIRUMALA_EVENTS = {
  ugadiAsthanam: n("Ugadi Asthanam", "ಯುಗಾದಿ ಆಸ್ಥಾನ"),
  koilAlwar: n("Koil Alwar Tirumanjanam", "ಕೋಯಿಲ್ ಆಳ್ವಾರ್ ತಿರುಮಂಜನ"),
  ramaNavami: n("Sri Rama Navami Asthanam", "ಶ್ರೀ ರಾಮನವಮಿ ಆಸ್ಥಾನ"),
  vasantotsavam: n("Vasantotsavam", "ವಸಂತೋತ್ಸವ"),
  padmavatiParinayam: n("Sri Padmavati Parinayotsavam", "ಶ್ರೀ ಪದ್ಮಾವತಿ ಪರಿಣಯೋತ್ಸವ"),
  jyeshtabhishekam: n("Jyeshtabhishekam", "ಜ್ಯೇಷ್ಠಾಭಿಷೇಕ"),
  anivaraAsthanam: n("Anivara Asthanam", "ಆಣಿವಾರ ಆಸ್ಥಾನ"),
  pavitrotsavam: n("Pavitrotsavam", "ಪವಿತ್ರೋತ್ಸವ"),
  gokulashtami: n("Gokulashtami Asthanam", "ಗೋಕುಲಾಷ್ಟಮಿ ಆಸ್ಥಾನ"),
  utlotsavam: n("Utlotsavam", "ಉಟ್ಲೋತ್ಸವ"),
  brahmotsavamStart: n("Srivari Brahmotsavam — Dhwajarohanam", "ಶ್ರೀವಾರಿ ಬ್ರಹ್ಮೋತ್ಸವ — ಧ್ವಜಾರೋಹಣ"),
  salakatlaStart: n("Srivari Salakatla Brahmotsavam — Dhwajarohanam", "ಶ್ರೀವಾರಿ ಸಾಲಕಟ್ಲ ಬ್ರಹ್ಮೋತ್ಸವ — ಧ್ವಜಾರೋಹಣ"),
  navaratriStart: n("Srivari Navaratri Brahmotsavam begins", "ಶ್ರೀವಾರಿ ನವರಾತ್ರಿ ಬ್ರಹ್ಮೋತ್ಸವ ಆರಂಭ"),
  garudaSeva: n("Brahmotsavam — Garuda Seva", "ಬ್ರಹ್ಮೋತ್ಸವ — ಗರುಡ ಸೇವೆ"),
  rathotsavam: n("Brahmotsavam — Rathotsavam", "ಬ್ರಹ್ಮೋತ್ಸವ — ರಥೋತ್ಸವ"),
  chakraSnanam: n("Brahmotsavam — Chakra Snanam", "ಬ್ರಹ್ಮೋತ್ಸವ — ಚಕ್ರಸ್ನಾನ"),
  deepavaliAsthanam: n("Deepavali Asthanam", "ದೀಪಾವಳಿ ಆಸ್ಥಾನ"),
  pushpayagam: n("Pushpa Yagam", "ಪುಷ್ಪಯಾಗ"),
  karthikaDeepam: n("Karthika Deepotsavam", "ಕಾರ್ತಿಕ ದೀಪೋತ್ಸವ"),
  panchamiTheertham: n("Tiruchanur Padmavati Brahmotsavam — Panchami Theertham", "ತಿರುಚಾನೂರು ಪದ್ಮಾವತಿ ಬ್ರಹ್ಮೋತ್ಸವ — ಪಂಚಮಿ ತೀರ್ಥ"),
  vaikunthaDwaraDarshan: n("Vaikuntha Dwara Darshan begins", "ವೈಕುಂಠ ದ್ವಾರ ದರ್ಶನ ಆರಂಭ"),
  rathaSaptami: n("Ratha Saptami (Ardha Brahmotsavam)", "ರಥಸಪ್ತಮಿ (ಅರ್ಧ ಬ್ರಹ್ಮೋತ್ಸವ)"),
  teppotsavam: n("Teppotsavam begins", "ತೆಪ್ಪೋತ್ಸವ ಆರಂಭ"),
  pournamiGaruda: n("Pournami Garuda Seva", "ಹುಣ್ಣಿಮೆ ಗರುಡ ಸೇವೆ"),
};
export type TirumalaKey = keyof typeof TIRUMALA_EVENTS;

export const GRAHANA_NAMES = {
  solar: n("Surya Grahana", "ಸೂರ್ಯ ಗ್ರಹಣ"),
  lunar: n("Chandra Grahana", "ಚಂದ್ರ ಗ್ರಹಣ"),
  total: n("Total", "ಖಗ್ರಾಸ"),
  partial: n("Partial", "ಖಂಡಗ್ರಾಸ"),
  annular: n("Annular", "ಕಂಕಣ"),
  penumbral: n("Penumbral", "ಛಾಯಾ (ಮಾಂದ್ಯ)"),
};

// Srivaishnava Alwar and Acharya tirunakshatrams: the birth star in a
// solar month (sun's sidereal rashi; Mesha = Chittirai). Nakshatra index
// as in NAKSHATRA_NAMES (Ashwini = 0).
export const TIRUNAKSHATRAMS: { rashi: number; nakshatra: number; name: Named }[] = [
  { rashi: 0, nakshatra: 5, name: n("Sri Ramanujacharya Tirunakshatram", "ಶ್ರೀ ರಾಮಾನುಜಾಚಾರ್ಯ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 0, nakshatra: 13, name: n("Madhurakavi Alwar Tirunakshatram", "ಮಧುರಕವಿ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 1, nakshatra: 15, name: n("Nammalwar Tirunakshatram", "ನಮ್ಮಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 2, nakshatra: 14, name: n("Periyalwar Tirunakshatram", "ಪೆರಿಯಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 3, nakshatra: 10, name: n("Tiruvadipooram · Sri Andal Tirunakshatram", "ತಿರುವಾಡಿಪ್ಪೂರ · ಶ್ರೀ ಆಂಡಾಳ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 5, nakshatra: 21, name: n("Sri Vedanta Desikar Tirunakshatram", "ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕರ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 6, nakshatra: 21, name: n("Poigai Alwar Tirunakshatram", "ಪೊಯ್ಗೈ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 6, nakshatra: 22, name: n("Bhoothathalwar Tirunakshatram", "ಭೂತತ್ತಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 6, nakshatra: 23, name: n("Peyalwar Tirunakshatram", "ಪೇಯಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 6, nakshatra: 18, name: n("Manavala Mamunigal Tirunakshatram", "ಮಣವಾಳ ಮಾಮುನಿಗಳ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 7, nakshatra: 2, name: n("Tirumangai Alwar Tirunakshatram", "ತಿರುಮಂಗೈ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 7, nakshatra: 3, name: n("Tiruppanalwar Tirunakshatram", "ತಿರುಪ್ಪಾಣಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 8, nakshatra: 17, name: n("Thondaradippodi Alwar Tirunakshatram", "ತೊಂಡರಡಿಪ್ಪೊಡಿ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 9, nakshatra: 9, name: n("Tirumazhisai Alwar Tirunakshatram", "ತಿರುಮಳಿಶೈ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 10, nakshatra: 6, name: n("Kulasekhara Alwar Tirunakshatram", "ಕುಲಶೇಖರ ಆಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  // Acharyas.
  { rashi: 0, nakshatra: 6, name: n("Mudaliyandan Tirunakshatram", "ಮುದಲಿಯಾಂಡಾನ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 1, nakshatra: 16, name: n("Parashara Bhattar Tirunakshatram", "ಪರಾಶರ ಭಟ್ಟರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 2, nakshatra: 16, name: n("Sriman Nathamuni Tirunakshatram", "ಶ್ರೀಮನ್ನಾಥಮುನಿಗಳ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 3, nakshatra: 20, name: n("Alavandar (Yamunacharya) Tirunakshatram", "ಆಳವಂದಾರ್ (ಯಾಮುನಾಚಾರ್ಯ) ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 6, nakshatra: 21, name: n("Pillai Lokacharya Tirunakshatram", "ಪಿಳ್ಳೈ ಲೋಕಾಚಾರ್ಯ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 8, nakshatra: 17, name: n("Periya Nambi Tirunakshatram", "ಪೆರಿಯ ನಂಬಿ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 9, nakshatra: 12, name: n("Kurathalwan Tirunakshatram", "ಕೂರತ್ತಾಳ್ವಾನ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 9, nakshatra: 6, name: n("Embar Tirunakshatram", "ಎಂಬಾರ್ ತಿರುನಕ್ಷತ್ರ") },
  { rashi: 10, nakshatra: 4, name: n("Tirukkachi Nambi Tirunakshatram", "ತಿರುಕ್ಕಚ್ಚಿ ನಂಬಿ ತಿರುನಕ್ಷತ್ರ") },
  // Nityasuris: the Lord's discus (Sudarshana Jayanti) and Garuda.
  { rashi: 2, nakshatra: 13, name: n("Chakrathalwar Tirunakshatram · Sudarshana Jayanti", "ಚಕ್ರತ್ತಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ · ಸುದರ್ಶನ ಜಯಂತಿ") },
  { rashi: 3, nakshatra: 14, name: n("Garudalwar Tirunakshatram · Garuda Jayanti", "ಗರುಡಾಳ್ವಾರ್ ತಿರುನಕ್ಷತ್ರ · ಗರುಡ ಜಯಂತಿ") },
  // Recent Acharyas.
  { rashi: 5, nakshatra: 12, name: n("Madhuramangalam Jeeyar Tirunakshatram", "ಮಧುರಮಂಗಲಂ ಜೀಯರ್ ತಿರುನಕ್ಷತ್ರ") },
  // "mēṣe maghāyāṃ sambhūtaṃ …" — born in Mesha (Chithirai) under Magha.
  { rashi: 0, nakshatra: 9, name: n("Sri Satakopa Ramanuja Jeeyar Tirunakshatram", "ಶ್ರೀ ಶಠಕೋಪ ರಾಮಾನುಜ ಜೀಯರ್ ತಿರುನಕ್ಷತ್ರ") },
];
