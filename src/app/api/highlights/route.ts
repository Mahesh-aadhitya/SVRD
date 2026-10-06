import { getHighlights } from "@/lib/data/highlights";

// Polled by open pages so a live stream, ticket release or announcement
// reaches devotees without a reload. The sources are tag-cached, so this
// is cheap; the response itself is never cached.
export async function GET() {
  const highlights = await getHighlights();
  return Response.json(highlights, { headers: { "Cache-Control": "no-store" } });
}
