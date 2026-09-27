// Plain type shared between the server data-fetcher (src/lib/data/sevas.ts)
// and client components (BookingFlow). Deliberately has no "server-only"
// imports so client bundles can import it directly.

export type Seva = {
  id: string;
  name: { en: string; kn: string };
  description: { en: string; kn: string };
  price: number;
  capacityPerSlot: number;
  isActive: boolean;
  releaseStartDate: string | null;
  releaseEndDate: string | null;
};
