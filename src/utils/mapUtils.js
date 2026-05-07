import L from "leaflet";

// Detecta si el viewport actual es móvil (<= 980px)
export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 980px)").matches;
}

// Crea el icono Leaflet para marcadores de personas según su tipo
export function normalizePersonIcon(type) {
  const iconUrl = `/assets/icons/map_markers/persona_${type}.svg`;
  const size = [54, 54];
  const anchor = [27, 54];

  return L.icon({
    iconUrl,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -size[1] / 2],
  });
}

// Normaliza una cadena quitando tildes y pasando a minúsculas
export function normalizeText(str) {
  return str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";
}
