// app/cameras-test/page.jsx
//
// TEMPORARY verification page. Visit /cameras-test to check the Videoloft
// integration end-to-end before wiring cameras into real listing pages.
// Delete this route (the whole app/cameras-test folder) once you're satisfied.

import PropertyCameras from "@/components/PropertyCameras";
import { camerasFor, PROPERTIES } from "@/lib/videoloft/cameras";

export const metadata = {
  title: "Cameras test — WayLuz",
  robots: { index: false, follow: false }, // keep it out of search engines
};

export const dynamic = "force-dynamic";

export default function CamerasTestPage() {
  const slugs = Object.keys(PROPERTIES);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Internal — verification only
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Videoloft camera test
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Snapshots load publicly and refresh every 45s. Click “Ver en vivo” on
          one camera to test the lead gate, then the live stream. If a snapshot
          shows “Cámara no disponible,” open the network tab and check the
          <code className="mx-1 rounded bg-neutral-100 px-1">/api/videoloft/snapshot</code>
          response. Delete this route before launch.
        </p>
      </header>

      {slugs.map((slug) => {
        const cams = camerasFor(slug);
        return (
          <section key={slug} className="mb-12">
            <div className="mb-3 flex items-baseline justify-between border-b border-neutral-200 pb-2">
              <h2 className="text-lg font-semibold capitalize text-neutral-900">
                {PROPERTIES[slug].label}
              </h2>
              <span className="text-sm text-neutral-500">
                {cams.length} cámaras · property=&quot;{slug}&quot;
              </span>
            </div>
            <PropertyCameras property={slug} cameras={cams} />
          </section>
        );
      })}
    </main>
  );
}
