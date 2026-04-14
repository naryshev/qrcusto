import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("links")
    .select("url, clicks")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  // Increment click counter (fire and forget)
  supabase
    .from("links")
    .update({ clicks: data.clicks + 1 })
    .eq("slug", slug)
    .then(() => {});

  return NextResponse.redirect(data.url, { status: 302 });
}
