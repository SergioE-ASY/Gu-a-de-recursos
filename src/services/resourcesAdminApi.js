import { fetchResources } from "./resourcesApi";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL?.trim();
const API_RESOURCES_PATH = import.meta.env.VITE_ADMIN_RESOURCES_PATH?.trim() || "/resources";
const ENABLE_MOCK_ADMIN = import.meta.env.VITE_ENABLE_MOCK_ADMIN !== "false";
const MOCK_DB_KEY = "internal_resources_admin_db";

function buildApiUrl(suffix = "") {
  if (!API_BASE_URL) return "";
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = API_RESOURCES_PATH.startsWith("/") ? API_RESOURCES_PATH : `/${API_RESOURCES_PATH}`;
  return `${base}${path}${suffix}`;
}

function getMockDb() {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(MOCK_DB_KEY);
    }
  }
  return [];
}

function saveMockDb(data) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
}

async function ensureMockSeeded() {
  const db = getMockDb();
  if (db.length > 0) return db;
  const initial = await fetchResources();
  saveMockDb(initial.data);
  return initial.data;
}

async function apiRequest(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Error API (${response.status})`);
  }
  return response.json();
}

export async function listResourcesAdmin() {
  if (API_BASE_URL) {
    try {
      return await apiRequest(buildApiUrl(), { method: "GET" });
    } catch (error) {
      if (!ENABLE_MOCK_ADMIN) throw error;
    }
  }
  return ensureMockSeeded();
}

export async function createResourceAdmin(payload) {
  if (API_BASE_URL) {
    try {
      return await apiRequest(buildApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!ENABLE_MOCK_ADMIN) throw error;
    }
  }

  const db = await ensureMockSeeded();
  const nextId = db.length ? Math.max(...db.map((item) => Number(item.id) || 0)) + 1 : 1;
  const nextItem = {
    ...payload,
    id: nextId,
    data_panel_color: payload.data_panel_color || "default",
    map_marker_icon: payload.map_marker_icon || "salud",
  };
  const nextDb = [nextItem, ...db];
  saveMockDb(nextDb);
  return nextItem;
}

export async function updateResourceAdmin(id, payload) {
  if (API_BASE_URL) {
    try {
      return await apiRequest(buildApiUrl(`/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!ENABLE_MOCK_ADMIN) throw error;
    }
  }

  const db = await ensureMockSeeded();
  const nextDb = db.map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
  saveMockDb(nextDb);
  return nextDb.find((item) => String(item.id) === String(id));
}

export async function deleteResourceAdmin(id) {
  if (API_BASE_URL) {
    try {
      await apiRequest(buildApiUrl(`/${id}`), { method: "DELETE" });
      return;
    } catch (error) {
      if (!ENABLE_MOCK_ADMIN) throw error;
    }
  }

  const db = await ensureMockSeeded();
  const nextDb = db.filter((item) => String(item.id) !== String(id));
  saveMockDb(nextDb);
}
