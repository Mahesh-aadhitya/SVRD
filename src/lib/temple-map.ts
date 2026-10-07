// Google Maps links for the temple. Everything points at this one temple:
// the map embeds its listing by name and address, and directions use its
// unique place ID — a name alone would match every Varadaraja Swamy temple.
// Plain module, safe for client bundles.

type Place = { mapsPlace: string; mapsPlaceId: string; lat: number | null; lon: number | null };

export function mapEmbedSrc(place: string, lat: string | number, lon: string | number) {
  const q = place || `${lat},${lon}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&ll=${lat},${lon}&z=17&output=embed`;
}

// Opens Google Maps with the route from the visitor's current location to
// the temple, ready to start (dir_action=navigate begins navigation in the
// Maps app on phones).
export function mapDirectionsHref({ mapsPlace, mapsPlaceId, lat, lon }: Place) {
  const params = new URLSearchParams({ api: "1", travelmode: "driving", dir_action: "navigate" });
  if (mapsPlaceId) {
    params.set("destination", mapsPlace || `${lat},${lon}`);
    params.set("destination_place_id", mapsPlaceId);
  } else {
    // No place ID: the exact pin, which can't be confused with another temple.
    params.set("destination", `${lat},${lon}`);
  }
  return `https://www.google.com/maps/dir/?${params}`;
}
