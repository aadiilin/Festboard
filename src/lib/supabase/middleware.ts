import { createMiddlewareClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });
  const supabase = createMiddlewareClient(
    { req: request, res: supabaseResponse }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
