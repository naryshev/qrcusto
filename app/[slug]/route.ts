import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const { data, error } = await supabase
    .from("links")
    .select("url")
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
