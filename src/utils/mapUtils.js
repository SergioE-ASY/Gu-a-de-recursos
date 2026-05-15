import L from "leaflet";
import { createElement } from "react";

export const PEOPLE_LABELS = {
  usuaria: "Usuaria Atendida",
  potencial: "Persona Potencial",
  recurso: "Persona Recurso",
};

const resourceIconCache = new Map();

// Detecta si el viewport actual es móvil (<= 980px)
export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 980px)").matches;
}

export function isValidCoord(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function getValuesFromResource(resource, key) {
  const value = resource[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

export function normalizeMarkerIcon(iconName) {
  if (!iconName) return "/assets/icons/map_markers/salud.png";
  return `/assets/icons/map_markers/${iconName}.png`;
}

export function getResourceMarkerIcon(iconName) {
  const iconUrl = normalizeMarkerIcon(iconName);
  if (!resourceIconCache.has(iconUrl)) {
    resourceIconCache.set(
      iconUrl,
      L.icon({
        iconUrl,
        iconSize: [32, 37],
        iconAnchor: [16, 37],
      })
    );
  }
  return resourceIconCache.get(iconUrl);
}

export function renderArrayItems(items, emptyLabel = "Sin datos") {
  const values = !items || items.length === 0 ? [emptyLabel] : items;
  return createElement(
    "ul",
    null,
    values.map((item) => createElement("li", { key: item }, item))
  );
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
