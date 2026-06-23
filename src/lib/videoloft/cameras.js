// lib/videoloft/cameras.js
//
// Per-property whitelist of which Videoloft cameras may appear on the public
// site. A camera physically cannot be requested (snapshot OR live) unless its
// uidd is listed here for the given property — this is the security boundary,
// enforced server-side in every route.
//
// You can later move this into the Supabase `properties.videoloft_cameras`
// jsonb column (see README) and load per-row; the shape is identical.

export const PROPERTIES = {
  // The large finca — exteriors / grounds only. Interiors deliberately omitted.
  finca: {
    label: "Finca",
    cameras: [
      { uidd: "1253490.169", label: "Área de la piscina" },
      { uidd: "1253490.201", label: "Área del gallinero" },
      { uidd: "1253490.159", label: "Gallinero 1" },
      { uidd: "1253490.162", label: "Gallinero 2" },
      { uidd: "1253490.168", label: "Entrada principal de la casa" },
      { uidd: "1253490.166", label: "Portón de la terraza" },
      { uidd: "1253490.173", label: "Puerta 1 — entrada a la calle" },
      { uidd: "1253490.177", label: "Puerta 2 — entrada a la calle" },
      { uidd: "1253490.179", label: "Entrada fuente de agua terraza" },
      { uidd: "1253490.178", label: "Terraza 2" },
      { uidd: "1253490.203", label: "Terraza 3" },
    ],
  },

  // Palestina — property is empty, so all cameras are eligible.
  palestina: {
    label: "Palestina",
    cameras: [
      { uidd: "1253490.182", label: "Sala de ejercicios" },
      { uidd: "1253490.183", label: "Puerta principal" },
      { uidd: "1253490.184", label: "Cocina" },
      { uidd: "1253490.185", label: "Entrada lateral" },
      { uidd: "1253490.186", label: "Balcón segundo piso" },
      { uidd: "1253490.187", label: "3er piso — área de jacuzzi" },
      { uidd: "1253490.188", label: "3er piso" },
      { uidd: "1253490.189", label: "Piso 2 — salón" },
    ],
  },
};

/** Returns true if uidd is whitelisted for the given property slug. */
export function isAllowed(propertySlug, uidd) {
  const p = PROPERTIES[propertySlug];
  if (!p) return false;
  return p.cameras.some((c) => c.uidd === uidd);
}

/** Returns the camera list for a property, or [] if unknown. */
export function camerasFor(propertySlug) {
  return PROPERTIES[propertySlug]?.cameras ?? [];
}
