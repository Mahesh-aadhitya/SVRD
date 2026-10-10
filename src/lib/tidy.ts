// Display clean-ups for text that admins type or that came from file names.

// "17Hiyagriva_Speech.mp3" → "Hiyagriva Speech"
export function tidyTitle(title: string) {
  return title
    .replace(/\.(mp3|m4a|wav|ogg|aac)$/i, "")
    .replace(/^\d+[\s._-]*/, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || title;
}

// "SRI VARADARAJA SWAMY TEMPLE STREET AMMAVARI PETE" → "Sri Varadaraja Swamy
// Temple Street Ammavari Pete"; "Kolar , Karnataka,563101" → "Kolar, Karnataka, 563101"
export function tidyAddress(line: string) {
  let s = line.replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ").replace(/\s+/g, " ").trim();
  if (/[A-Z]{3}/.test(s) && !/[a-z]/.test(s)) s = s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return s.replace(/\b(\p{Lu})(\p{Lu}{2,})\b/gu, (_, a, b) => a + b.toLowerCase());
}

// A name fit to show publicly: never an email address.
export function publicName(name: string | null | undefined) {
  const n = (name ?? "").trim();
  return !n || n.includes("@") ? "Devotee" : n;
}
