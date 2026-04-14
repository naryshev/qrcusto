import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function generateSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const supabase = getSupabase();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Auto-prepend https:// if no protocol
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
  } catch {
    return NextResponse.json({ error: "Malformed URL" }, { status: 400 });
  }

  let slug = generateSlug();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("links")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  const { error } = await supabase.from("links").insert({ slug, url: normalizedUrl });

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;
  return NextResponse.json({ slug, shortUrl });
}
