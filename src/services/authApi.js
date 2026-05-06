const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL?.trim();
const AUTH_LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH?.trim() || "/auth/login";
const ENABLE_MOCK_AUTH = import.meta.env.VITE_ENABLE_MOCK_AUTH !== "false";

const MOCK_USERS = [
  {
    username: "trabajadora.demo",
    password: "Demo2026!",
    fullName: "Trabajadora Social Demo",
    role: "trabajadora",
  },
  {
    username: "coordinadora.demo",
    password: "Coord2026!",
    fullName: "Coordinadora Demo",
    role: "coordinadora",
  },
];

const SESSION_KEY = "internal_admin_session";

function buildAuthUrl(path) {
  if (!AUTH_BASE_URL) return "";
  const base = AUTH_BASE_URL.endsWith("/") ? AUTH_BASE_URL.slice(0, -1) : AUTH_BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function loginAgainstApi(credentials) {
  const url = buildAuthUrl(AUTH_LOGIN_PATH);
  if (!url) {
    throw new Error("No hay URL de autenticacion configurada");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(`Login fallido (${response.status})`);
  }

  const data = await response.json();
  if (!data?.token || !data?.user) {
    throw new Error("Respuesta de autenticacion invalida");
  }

  return {
    token: data.token,
    user: data.user,
    source: "api",
  };
}

async function loginAgainstMock(credentials) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const user = MOCK_USERS.find(
    (item) => item.username === credentials.username && item.password === credentials.password
  );

  if (!user) {
    throw new Error("Credenciales invalidas");
  }

  return {
    token: `mock-token-${user.username}`,
    user: {
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
    source: "mock",
  };
}

export async function login(credentials) {
  if (AUTH_BASE_URL) {
    try {
      const session = await loginAgainstApi(credentials);
      persistSession(session);
      return session;
    } catch (error) {
      if (!ENABLE_MOCK_AUTH) throw error;
    }
  }

  const mockSession = await loginAgainstMock(credentials);
  persistSession(mockSession);
  return mockSession;
}

export function persistSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getPersistedSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
