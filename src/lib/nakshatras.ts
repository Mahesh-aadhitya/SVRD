// The 27 nakshatrams, in traditional order. Bookings store the English key;
// the devotee app shows the name in the visitor's language.
export const NAKSHATRAS = [
  { key: "Ashwini", kn: "ಅಶ್ವಿನಿ" },
  { key: "Bharani", kn: "ಭರಣಿ" },
  { key: "Krittika", kn: "ಕೃತ್ತಿಕಾ" },
  { key: "Rohini", kn: "ರೋಹಿಣಿ" },
  { key: "Mrigashira", kn: "ಮೃಗಶಿರ" },
  { key: "Ardra", kn: "ಆರ್ದ್ರಾ" },
  { key: "Punarvasu", kn: "ಪುನರ್ವಸು" },
  { key: "Pushya", kn: "ಪುಷ್ಯ" },
  { key: "Ashlesha", kn: "ಆಶ್ಲೇಷ" },
  { key: "Magha", kn: "ಮಘಾ" },
  { key: "Purva Phalguni", kn: "ಪೂರ್ವ ಫಲ್ಗುಣಿ" },
  { key: "Uttara Phalguni", kn: "ಉತ್ತರ ಫಲ್ಗುಣಿ" },
  { key: "Hasta", kn: "ಹಸ್ತ" },
  { key: "Chitra", kn: "ಚಿತ್ತಾ" },
  { key: "Swati", kn: "ಸ್ವಾತಿ" },
  { key: "Vishakha", kn: "ವಿಶಾಖ" },
  { key: "Anuradha", kn: "ಅನುರಾಧ" },
  { key: "Jyeshtha", kn: "ಜ್ಯೇಷ್ಠ" },
  { key: "Mula", kn: "ಮೂಲ" },
  { key: "Purva Ashadha", kn: "ಪೂರ್ವಾಷಾಢ" },
  { key: "Uttara Ashadha", kn: "ಉತ್ತರಾಷಾಢ" },
  { key: "Shravana", kn: "ಶ್ರವಣ" },
  { key: "Dhanishta", kn: "ಧನಿಷ್ಠ" },
  { key: "Shatabhisha", kn: "ಶತಭಿಷ" },
  { key: "Purva Bhadrapada", kn: "ಪೂರ್ವಾಭಾದ್ರ" },
  { key: "Uttara Bhadrapada", kn: "ಉತ್ತರಾಭಾದ್ರ" },
  { key: "Revati", kn: "ರೇವತಿ" },
] as const;

export const NAKSHATRA_KEYS: readonly string[] = NAKSHATRAS.map((n) => n.key);

export function nakshatraLabel(key: string, locale: string) {
  const n = NAKSHATRAS.find((x) => x.key === key);
  return n ? (locale === "kn" ? n.kn : n.key) : key;
}
