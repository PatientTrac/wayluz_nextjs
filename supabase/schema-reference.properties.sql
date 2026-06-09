-- Reference only: this is the shape inferred from the Hostinger Horizons export.
-- Do not apply blindly if your existing Supabase properties table already has data.
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  description text,
  price_cop numeric,
  price_usd numeric,
  area numeric,
  bedrooms integer,
  bathrooms integer,
  year_built integer,
  type text,
  amenities jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  videos jsonb default '[]'::jsonb,
  featured_image_url text,
  created_at timestamptz not null default now()
);
