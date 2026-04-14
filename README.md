# QRCUSTO

Styled QR codes with built-in short-link redirect. Paste a URL, style your QR, share the link.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (Postgres — stores slug → URL mappings)
- **qr-code-styling** (client-side QR generation)
- **Vercel** (hosting + Edge Functions)

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run this SQL in the Supabase SQL editor:

```sql
create table links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  url text not null,
  clicks integer default 0,
  created_at timestamptz default now()
);

-- Allow public inserts and reads (anon key is fine for this)
alter table links enable row level security;

create policy "Public read" on links for select using (true);
create policy "Public insert" on links for insert with check (true);
create policy "Public update clicks" on links for update using (true);
```

3. Copy your **Project URL** and **anon public key** from Settings → API

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### 3. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same env vars in Vercel Dashboard → Settings → Environment Variables.

### 4. Local Dev

```bash
npm install
npm run dev
```

---

## How It Works

1. User pastes a URL → clicks GEN
2. App calls `/api/shorten` → generates a 6-char slug → stores `{slug, url}` in Supabase
3. QR code is rendered pointing to `BASE_URL/[slug]`
4. When scanned, `/[slug]` route fetches the URL from Supabase and 302 redirects
5. Click count incremented on each scan

---

## Customization Options

- Dot style: Square, Rounded, Dots, Classy, Classy+, XL Round
- Corner style: Square, Rounded, Dot
- Color presets + custom FG/BG color pickers
- Optional logo/image overlay URL
- Download as PNG or SVG
