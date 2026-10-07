import "server-only";

// Turns whatever the temple office pastes into an exact location: a Google
// Maps link (full or maps.app.goo.gl short link), "lat, lng", or a plain
// address. Short links are followed to the place's link, which carries its
// pin and name; addresses are looked up with OpenStreetMap's geocoder.

export type MapLocation = { lat: number; lon: number; label: string; placeId?: string };

// Google's place ID ("ChIJ…") is a base64 protobuf of the two 64-bit halves
// of the feature ID that Maps links carry as !1s0x…:0x….
export function placeIdFromLink(url: string) {
  const m = decodeURIComponent(url).match(/!1s(0x[0-9a-f]+):(0x[0-9a-f]+)/i);
  if (!m) return undefined;
  const bytes = Buffer.alloc(20);
  bytes.set([0x0a, 0x12, 0x09], 0);
  bytes.writeBigUInt64LE(BigInt(m[1]), 3);
  bytes[11] = 0x11;
  bytes.writeBigUInt64LE(BigInt(m[2]), 12);
  return bytes.toString("base64url");
}

const valid = (lat: number, lon: number) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

function coordsIn(text: string): { lat: number; lon: number } | null {
  const decoded = decodeURIComponent(text);
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // place pin
    /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/, // "13.12, 78.14"
  ];
  for (const re of patterns) {
    const m = decoded.match(re);
    if (m && valid(Number(m[1]), Number(m[2]))) return { lat: Number(m[1]), lon: Number(m[2]) };
  }
  return null;
}

const placeName = (url: string) => {
  const m = decodeURIComponent(url).match(/\/place\/([^/@]+)/);
  return m ? m[1].replace(/\+/g, " ") : "";
};

async function fromGoogleLink(link: string): Promise<MapLocation | null> {
  // Follow short-link redirects ourselves to keep the final URL. (Short
  // links answer a browser with an interstitial page but redirect a plain
  // client.)
  let url = link;
  for (let hop = 0; hop < 5; hop++) {
    const direct = coordsIn(url);
    if (direct) return { ...direct, label: placeName(url), placeId: placeIdFromLink(url) };
    if (!/(^|\.)goo\.gl$/.test(new URL(url).hostname)) break;
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": "curl/8.7.1" }, signal: AbortSignal.timeout(10_000) });
    const next = res.headers.get("location");
    if (!(res.status >= 300 && res.status < 400 && next)) return null;
    url = new URL(next, url).toString();
  }
  // Only Google's own pin (!3d…!4d… in the link) is trusted: the map's
  // view centre can sit hundreds of metres or kilometres away.
  const pin = coordsIn(url);
  return pin ? { ...pin, label: placeName(url), placeId: placeIdFromLink(url) } : null;
}

async function fromAddress(address: string): Promise<MapLocation | null> {
  const params = new URLSearchParams({ q: address, format: "json", limit: "1", countrycodes: "in" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { "user-agent": "SriVaradarajaSwamyDevasthaanam/1.0 (temple admin)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return hit && valid(Number(hit.lat), Number(hit.lon)) ? { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name } : null;
}

export async function resolveMapLocation(input: string): Promise<MapLocation | null> {
  const text = input.trim();
  if (!text) return null;
  const direct = coordsIn(text);
  if (direct) return { ...direct, label: "" };
  try {
    if (/^https?:\/\//i.test(text)) return await fromGoogleLink(text);
    return await fromAddress(text);
  } catch (error) {
    console.error("resolveMapLocation:", error instanceof Error ? error.message : error);
    return null;
  }
}
