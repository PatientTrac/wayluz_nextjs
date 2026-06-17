// src/app/api/youtube/route.js
//
// Pulls every video from the WayLuz YouTube channel via the public RSS feed
// (no API key, no quota) and returns embed-ready URLs. New uploads appear
// automatically — no code changes needed. Mirrors the /api/cloudinary pattern.

import { NextResponse } from 'next/server';

const CHANNEL_ID = 'UCXurfWtMeEFyqGKOldrqlZg';

// Re-check the channel feed hourly.
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ videos: [] });
    }

    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    const videos = entries
      .map((m) => {
        const block = m[1];
        const id = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
        const title = block.match(/<title>(.*?)<\/title>/)?.[1];
        const published = block.match(/<published>(.*?)<\/published>/)?.[1];
        if (!id) return null;
        return {
          id,
          title,
          published,
          // VideoGallerySection renders any string as an <iframe>; YouTube
          // needs the /embed/ form, NOT the watch?v= form.
          embedUrl: `https://www.youtube.com/embed/${id}`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ videos });
  } catch (err) {
    console.error('YouTube feed error:', err);
    return NextResponse.json({ videos: [] });
  }
}
