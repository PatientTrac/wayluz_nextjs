"use client";
// components/PropertyCameras.jsx
//
// Public snapshot grid for a property's whitelisted cameras, styled for the
// wayluz.com dark theme (#0f0f0f bg, #d4af37 gold accent). Live viewing is
// gated: clicking "Ver en vivo" opens a short lead form, which records the lead
// and unlocks live for the session.
//
// Requires: npm i hls.js

import { useEffect, useRef, useState } from "react";

const SNAPSHOT_REFRESH_MS = 45_000;
const KEEPALIVE_MS = 25_000;

export default function PropertyCameras({ property, cameras = [] }) {
  const [unlocked, setUnlocked] = useState(false);
  const [gateFor, setGateFor] = useState(null);
  const [liveCam, setLiveCam] = useState(null);

  const handleLiveClick = (cam) => {
    if (unlocked) setLiveCam(cam);
    else setGateFor(cam);
  };

  const onUnlocked = () => {
    setUnlocked(true);
    const pending = gateFor;
    setGateFor(null);
    if (pending) setLiveCam(pending);
  };

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((cam) => (
          <SnapshotCard
            key={cam.uidd}
            property={property}
            cam={cam}
            onLiveClick={() => handleLiveClick(cam)}
          />
        ))}
      </div>

      {gateFor && (
        <GateModal property={property} onClose={() => setGateFor(null)} onUnlocked={onUnlocked} />
      )}

      {liveCam && (
        <LiveModal property={property} cam={liveCam} onClose={() => setLiveCam(null)} />
      )}
    </section>
  );
}

function SnapshotCard({ property, cam, onLiveClick }) {
  const [src, setSrc] = useState(
    `/api/videoloft/snapshot?property=${property}&uidd=${cam.uidd}&t=${Date.now()}`
  );
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSrc(`/api/videoloft/snapshot?property=${property}&uidd=${cam.uidd}&t=${Date.now()}`);
      setErrored(false);
    }, SNAPSHOT_REFRESH_MS);
    return () => clearInterval(id);
  }, [property, cam.uidd]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#d4af37]/20 bg-[#1a1a1a] transition-colors hover:border-[#d4af37]/50">
      <div className="aspect-video w-full bg-black">
        {errored ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            Cámara no disponible
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={cam.label} className="h-full w-full object-cover" onError={() => setErrored(true)} />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <span className="truncate text-sm font-medium text-white">{cam.label}</span>
        <button
          type="button"
          onClick={onLiveClick}
          className="shrink-0 rounded-md bg-[#d4af37] px-3 py-1.5 text-xs font-semibold text-[#0f0f0f] transition hover:bg-[#c9a961]"
        >
          Ver en vivo
        </button>
      </div>
    </div>
  );
}

function GateModal({ property, onClose, onUnlocked }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/videoloft/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, property }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo verificar el acceso.");
      onUnlocked();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border-2 border-[#d4af37]/30 bg-[#1a1a1a] p-6 shadow-2xl shadow-black/50">
        <h3 className="text-lg font-bold text-[#d4af37]">Ver cámaras en vivo</h3>
        <p className="mt-1 text-sm text-gray-400">
          Déjanos tus datos para acceder a las cámaras en vivo de esta propiedad.
        </p>
        <div className="mt-4 space-y-3">
          <Field label="Nombre" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Correo electrónico" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <Field label="Teléfono (opcional)" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#0f0f0f] hover:bg-[#c9a961] disabled:opacity-50"
          >
            {submitting ? "Verificando…" : "Acceder a las cámaras"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function LiveModal({ property, cam, onClose }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Conectando…");

  useEffect(() => {
    let hls;
    let keepaliveId;
    let cancelled = false;

    const keepalive = () =>
      fetch("/api/videoloft/live/keepalive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property, uidd: cam.uidd }),
      }).catch(() => {});

    (async () => {
      try {
        const res = await fetch("/api/videoloft/live/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property, uidd: cam.uidd }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo iniciar el video.");
        if (cancelled) return;

        const playlist = `/api/videoloft/live/hls?property=${encodeURIComponent(property)}&w=${encodeURIComponent(data.wowza)}&s=${encodeURIComponent(data.streamName)}&f=index.m3u8`;
        const video = videoRef.current;

        keepalive();
        keepaliveId = setInterval(keepalive, KEEPALIVE_MS);

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = playlist;
          video.play().catch(() => {});
          setStatus("");
        } else {
          const { default: Hls } = await import("hls.js");
          if (Hls.isSupported()) {
            hls = new Hls({ lowLatencyMode: true });
            hls.loadSource(playlist);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
              setStatus("");
            });
            hls.on(Hls.Events.ERROR, (_e, d) => {
              if (d.fatal) setStatus("Error de transmisión. Intenta de nuevo.");
            });
          } else {
            setStatus("Tu navegador no soporta este video.");
          }
        }
      } catch (err) {
        if (!cancelled) setStatus(err.message);
      }
    })();

    return () => {
      cancelled = true;
      if (keepaliveId) clearInterval(keepaliveId);
      if (hls) hls.destroy();
    };
  }, [property, cam.uidd]);

  return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-black shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-3">
          <span className="text-sm font-medium text-[#d4af37]">{cam.label} — en vivo</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Cerrar">✕</button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          <video ref={videoRef} className="h-full w-full" controls playsInline muted />
          {status && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300">{status}</div>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37]"
      />
    </label>
  );
}
