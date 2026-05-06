const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const API_RESOURCES_PATH = import.meta.env.VITE_API_RESOURCES_PATH?.trim() || "/resources";
const ENABLE_LOCAL_FALLBACK = import.meta.env.VITE_ENABLE_LOCAL_FALLBACK !== "false";

function buildApiUrl() {
  if (!API_BASE_URL) return "";
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = API_RESOURCES_PATH.startsWith("/") ? API_RESOURCES_PATH : `/${API_RESOURCES_PATH}`;
  return `${base}${path}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al consultar ${url}`);
  }
  return response.json();
}

function validateDataShape(data) {
  if (!Array.isArray(data)) {
    throw new Error("La API no devolvio un array de recursos");
  }
  return data;
}

export async function fetchResources() {
  const apiUrl = buildApiUrl();

  if (apiUrl) {
    try {
      const apiData = await fetchJson(apiUrl);
      return { data: validateDataShape(apiData), source: "api" };
    } catch (error) {
      if (!ENABLE_LOCAL_FALLBACK) {
        throw error;
      }
    }
  }

  const localData = await fetchJson("/data/data.json");
  return { data: validateDataShape(localData), source: "local-fallback" };
}
