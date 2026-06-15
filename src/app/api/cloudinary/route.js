import { v2 as cloudinary } from 'cloudinary';

// Runs as a serverless function on Netlify. Never cached at build time.
export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: 'dbxg99wgp',                       // public — safe to hardcode
  api_key: process.env.CLOUDINARY_API_KEY,        // server-only env vars
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Section order = the order rooms appear. Apply these as TAGS in the
// Cloudinary Media Library; anything untagged still shows, just last.
const SECTION_ORDER = ['exterior', 'living', 'kitchen', 'bedroom', 'bathroom', 'amenities'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'CASA WAYNE GRANDE';

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Response.json(
      { error: 'Cloudinary credentials not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' },
      { status: 500 }
    );
  }

  try {
    const result = await cloudinary.search
      .expression(`asset_folder="${folder}"`) // dynamic-folders mode uses asset_folder
      .with_field('tags')
      .sort_by('uploaded_at', 'asc')
      .max_results(120)
      .execute();

    const resources = result.resources || [];

    const url = (r, width) =>
      cloudinary.url(r.public_id, {
        resource_type: r.resource_type,
        width,
        quality: 'auto',
        fetch_format: 'auto',
        crop: 'limit',
        secure: true,
      });

    const imgs = resources.filter((r) => r.resource_type === 'image');
    const vids = resources.filter((r) => r.resource_type === 'video');

    // Order images: hero first, then by section, then everything else.
    const rank = (r) => {
      const tags = r.tags || [];
      if (tags.includes('hero')) return -1;
      const i = SECTION_ORDER.findIndex((tag) => tags.includes(tag));
      return i === -1 ? SECTION_ORDER.length : i;
    };
    imgs.sort((a, b) => rank(a) - rank(b));

    const images = imgs.map((r) => url(r, 1600));

    const videos = vids.map((r) => ({
      url: url(r, 1280),
      poster: cloudinary.url(r.public_id, {
        resource_type: 'video',
        format: 'jpg',
        width: 1280,
        quality: 'auto',
        crop: 'limit',
        secure: true,
      }),
      type: 'file', // Cloudinary-hosted file -> rendered with <video>, not an iframe
    }));

    return Response.json(
      { folder, count: resources.length, images, videos },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    console.error('[cloudinary route] failed:', err);
    return Response.json(
      { error: 'Could not load assets from Cloudinary.', detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
