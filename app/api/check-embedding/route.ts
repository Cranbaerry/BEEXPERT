import { findRelevantContent } from "@/lib/embeddings";

export const dynamic = "force-static";

export async function GET() {
  const documents = await findRelevantContent("Trigonometryy");
  return Response.json({ documents });
}
