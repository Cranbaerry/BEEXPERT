import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Pages that require authentication
export const config = {
  matcher: ["/pre-test", "/post-test", "/playground", "/evaluasi"],
};
