const publicSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const publicSupabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicSupabaseKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseKey,
    NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL:
      process.env.NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL ||
      process.env.WAYLUZ_ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      '',
    NEXT_PUBLIC_ENABLE_DIAGNOSTICS:
      process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTICS ||
      process.env.ENABLE_DIAGNOSTICS ||
      'false',
  },
};

export default nextConfig;
