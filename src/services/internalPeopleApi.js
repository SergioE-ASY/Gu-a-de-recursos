const SIMPLY_API_BASE_URL = import.meta.env.VITE_SIMPLY_API_BASE_URL?.trim();
const SIMPLY_PEOPLE_PATH = import.meta.env.VITE_SIMPLY_PEOPLE_PATH?.trim() || "/people";

const INTERNAL_PEOPLE_API_BASE_URL = import.meta.env.VITE_INTERNAL_PEOPLE_API_BASE_URL?.trim();
const INTERNAL_PEOPLE_PATH = import.meta.env.VITE_INTERNAL_PEOPLE_PATH?.trim() || "/internal-people";

const ENABLE_MOCK_SIMPLY = import.meta.env.VITE_ENABLE_MOCK_SIMPLY !== "false";
const MOCK_KEY = "internal_people_resources_db";

const TYPE_COLORS = {
  usuaria: "#000000",
  potencial: "#000000",
  recurso: "#000000",
};

const MOCK_PEOPLE = [
  {
    id: "p-001",
    nombre: "Ariadna Hernandez",
    tipo: "usuaria",
    origen: "simply",
    zona: "Valverde",
    telefono: "679 123 456",
    email: "ariadna.demo@correo.com",
    lat: 27.8071,
    lng: -17.9142,
    datosBasicos: "Usuaria activa en programa de acompanamiento social.",
    relacionesActivas: ["Centro de Dia Frontera", "Trabajadora social referente"],
    relacionesInactivas: ["Programa de formacion 2024"],
    historialAcuerdos: [
      "2025-05: Acuerdo de acompanamiento semanal.",
      "2025-11: Colaboracion en actividad comunitaria de barrio.",
    ],
  },
  {
    id: "p-002",
    nombre: "Fatima Martin",
    tipo: "potencial",
    origen: "simply",
    zona: "La Frontera",
    telefono: "622 555 731",
    email: "fatima.potencial@correo.com",
    lat: 27.7519,
    lng: -18.0115,
    datosBasicos: "Usuaria potencial detectada por derivacion vecinal.",
    relacionesActivas: ["Equipo de intervencion comunitaria"],
    relacionesInactivas: [],
    historialAcuerdos: ["2026-01: Primera entrevista de valoracion."],
  },
  {
    id: "p-003",
    nombre: "Pedro Gonzalez",
    tipo: "recurso",
    origen: "externo",
    zona: "El Pinar",
    telefono: "636 212 788",
    email: "pedro.recurso@correo.com",
    lat: 27.7094,
    lng: -17.9792,
    datosBasicos: "Persona referente local para apoyo logistico y redes comunitarias.",
    relacionesActivas: ["Asociacion vecinal El Pinar", "Servicios Sociales Municipales"],
    relacionesInactivas: ["Red de voluntariado 2023"],
    historialAcuerdos: [
      "2024-02: Acuerdo de colaboracion para rutas de acompanamiento.",
      "2025-09: Renovacion de acuerdo de derivaciones comunitarias.",
    ],
  },
];

function buildUrl(base, path, suffix = "") {
  if (!base) return "";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}${suffix}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Error API (${response.status})`);
  return response.json();
}

function readMockDb() {
  const raw = localStorage.getItem(MOCK_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(MOCK_KEY);
    return [];
  }
}

function writeMockDb(data) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(data));
}

function ensureMockSeeded() {
  const db = readMockDb();
  if (db.length) return db;
  writeMockDb(MOCK_PEOPLE);
  return MOCK_PEOPLE;
}

function normalizePerson(person) {
  return {
    ...person,
    color: TYPE_COLORS[person.tipo] || TYPE_COLORS.recurso,
    relacionesActivas: person.relacionesActivas || [],
    relacionesInactivas: person.relacionesInactivas || [],
    historialAcuerdos: person.historialAcuerdos || [],
  };
}

export async function listInternalPeople() {
  const simplyUrl = buildUrl(SIMPLY_API_BASE_URL, SIMPLY_PEOPLE_PATH);
  const internalUrl = buildUrl(INTERNAL_PEOPLE_API_BASE_URL, INTERNAL_PEOPLE_PATH);

  if (simplyUrl || internalUrl) {
    try {
      const fromSimply = simplyUrl ? await requestJson(simplyUrl, { method: "GET" }) : [];
      const fromInternal = internalUrl ? await requestJson(internalUrl, { method: "GET" }) : [];
      const merged = [...fromSimply, ...fromInternal].map(normalizePerson);
      if (merged.length > 0) return merged;
    } catch (error) {
      if (!ENABLE_MOCK_SIMPLY) throw error;
    }
  }

  return ensureMockSeeded().map(normalizePerson);
}

export async function createInternalPerson(payload) {
  const internalUrl = buildUrl(INTERNAL_PEOPLE_API_BASE_URL, INTERNAL_PEOPLE_PATH);
  if (internalUrl) {
    try {
      return normalizePerson(
        await requestJson(internalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
    } catch (error) {
      if (!ENABLE_MOCK_SIMPLY) throw error;
    }
  }

  const db = ensureMockSeeded();
  const nextItem = {
    ...payload,
    id: `p-${Date.now()}`,
    origen: payload.origen || "interno",
  };
  const nextDb = [nextItem, ...db];
  writeMockDb(nextDb);
  return normalizePerson(nextItem);
}

export async function updateInternalPerson(id, payload) {
  const internalUrl = buildUrl(INTERNAL_PEOPLE_API_BASE_URL, INTERNAL_PEOPLE_PATH, `/${id}`);
  if (internalUrl) {
    try {
      return normalizePerson(
        await requestJson(internalUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );
    } catch (error) {
      if (!ENABLE_MOCK_SIMPLY) throw error;
    }
  }

  const db = ensureMockSeeded();
  const nextDb = db.map((item) => (item.id === id ? { ...item, ...payload } : item));
  writeMockDb(nextDb);
  return normalizePerson(nextDb.find((item) => item.id === id));
}

export async function deleteInternalPerson(id) {
  const internalUrl = buildUrl(INTERNAL_PEOPLE_API_BASE_URL, INTERNAL_PEOPLE_PATH, `/${id}`);
  if (internalUrl) {
    try {
      await requestJson(internalUrl, { method: "DELETE" });
      return;
    } catch (error) {
      if (!ENABLE_MOCK_SIMPLY) throw error;
    }
  }

  const db = ensureMockSeeded();
  writeMockDb(db.filter((item) => item.id !== id));
}

export async function convertPersonToResource(id) {
  const internalUrl = buildUrl(INTERNAL_PEOPLE_API_BASE_URL, INTERNAL_PEOPLE_PATH, `/${id}/convert-resource`);
  if (internalUrl) {
    try {
      return normalizePerson(await requestJson(internalUrl, { method: "POST" }));
    } catch (error) {
      if (!ENABLE_MOCK_SIMPLY) throw error;
    }
  }

  const db = ensureMockSeeded();
  const nextDb = db.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      tipo: "recurso",
      historialAcuerdos: [
        ...(item.historialAcuerdos || []),
        `${new Date().toISOString().slice(0, 10)}: Conversion a recurso definitivo desde guia interna.`,
      ],
    };
  });
  writeMockDb(nextDb);
  return normalizePerson(nextDb.find((item) => item.id === id));
}

export { TYPE_COLORS };
