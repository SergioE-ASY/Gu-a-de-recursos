import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPersistedSession,
  login,
  logout,
} from "../services/authApi";
import {
  createResourceAdmin,
  deleteResourceAdmin,
  listResourcesAdmin,
  updateResourceAdmin,
} from "../services/resourcesAdminApi";
import "./admin.css";

const initialForm = {
  tit: "",
  dir: "",
  amb: "",
  tip: "",
  lat: "",
  lng: "",
  map_marker_icon: "salud",
  data_panel_color: "default",
};

function mapFormToResource(form) {
  return {
    ...form,
    lat: Number(form.lat),
    lng: Number(form.lng),
    are_int: [],
    req_acc: [],
    des_ser: [],
    pob_ate: [],
    per: [],
  };
}

function AdminPortalPage() {
  const [session, setSession] = useState(() => getPersistedSession());
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceError, setResourceError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const canEdit = session?.user?.role === "coordinadora";

  useEffect(() => {
    if (!session) return;
    let active = true;

    async function loadResources() {
      try {
        setLoadingResources(true);
        setResourceError("");
        const data = await listResourcesAdmin();
        if (!active) return;
        setResources(data);
      } catch (error) {
        if (!active) return;
        setResourceError(error instanceof Error ? error.message : "No se pudieron cargar recursos");
      } finally {
        if (active) setLoadingResources(false);
      }
    }

    loadResources();
    return () => {
      active = false;
    };
  }, [session]);

  const filteredResources = useMemo(() => {
    // Normaliza quitando tildes y pasando a minúsculas
    const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";
    const term = normalize(query.trim());
    if (!term) return resources;
    return resources.filter((item) => normalize(item.tit).includes(term));
  }, [resources, query]);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError("");
      const nextSession = await login(loginForm);
      setSession(nextSession);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "No fue posible iniciar sesion");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  function startEdit(resource) {
    setEditingId(resource.id);
    setForm({
      tit: resource.tit || "",
      dir: resource.dir || "",
      amb: resource.amb || "",
      tip: resource.tip || "",
      lat: resource.lat ?? "",
      lng: resource.lng ?? "",
      map_marker_icon: resource.map_marker_icon || "salud",
      data_panel_color: resource.data_panel_color || "default",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit) return;
    const payload = mapFormToResource(form);

    try {
      if (editingId !== null) {
        const updated = await updateResourceAdmin(editingId, payload);
        setResources((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createResourceAdmin(payload);
        setResources((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : "No fue posible guardar");
    }
  }

  async function handleDelete(resourceId) {
    if (!canEdit) return;
    const confirmed = window.confirm("Esta accion eliminara el recurso. Deseas continuar?");
    if (!confirmed) return;
    try {
      await deleteResourceAdmin(resourceId);
      setResources((prev) => prev.filter((item) => item.id !== resourceId));
      if (editingId === resourceId) {
        resetForm();
      }
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : "No fue posible eliminar");
    }
  }

  if (!session) {
    return (
      <main className="admin-auth-page">
        <section className="auth-card">
          <h1>Acceso interno trabajadoras</h1>
          <p>Inicia sesion para gestionar recursos de la guia.</p>
          <form onSubmit={handleLoginSubmit}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            {loginError && <p className="error">{loginError}</p>}
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Accediendo..." : "Entrar"}
            </button>
          </form>
          <Link to="/" className="go-back-link">
            Volver al mapa
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-header">
        <div>
          <h1>Dashboard interno</h1>
          <p>
            {session.user.fullName} · {session.user.role}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/internal-map" className="go-back-link">
            Mapa interno
          </Link>
          {session.user.role === "coordinadora" && (
            <Link to="/admin/internal-guide" className="go-back-link">
              Gestion personas
            </Link>
          )}
          <Link to="/" className="go-back-link">
            Ir al mapa
          </Link>
          <button type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      {resourceError && <p className="error">{resourceError}</p>}
      {loadingResources && <p>Cargando recursos...</p>}
      {!canEdit && (
        <p className="permission-note">
          Perfil trabajadora: acceso en modo consulta. Solo coordinacion puede editar recursos.
        </p>
      )}

      <section className="admin-grid">
        {canEdit ? (
          <article className="editor-card">
            <h2>{editingId !== null ? "Editar recurso" : "Nuevo recurso"}</h2>
            <form onSubmit={handleSave} className="editor-form">
              <label htmlFor="tit">Nombre</label>
              <input
                id="tit"
                value={form.tit}
                onChange={(event) => setForm((prev) => ({ ...prev, tit: event.target.value }))}
                required
              />

            <label htmlFor="dir">Direccion</label>
            <input
              id="dir"
              value={form.dir}
              onChange={(event) => setForm((prev) => ({ ...prev, dir: event.target.value }))}
              required
            />

            <label htmlFor="amb">Ambito</label>
            <input
              id="amb"
              value={form.amb}
              onChange={(event) => setForm((prev) => ({ ...prev, amb: event.target.value }))}
              required
            />

            <label htmlFor="tip">Tipo</label>
            <input
              id="tip"
              value={form.tip}
              onChange={(event) => setForm((prev) => ({ ...prev, tip: event.target.value }))}
              required
            />

            <div className="two-cols">
              <div>
                <label htmlFor="lat">Latitud</label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(event) => setForm((prev) => ({ ...prev, lat: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="lng">Longitud</label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(event) => setForm((prev) => ({ ...prev, lng: event.target.value }))}
                  required
                />
              </div>
            </div>

            <label htmlFor="map_marker_icon">Icono marcador</label>
            <input
              id="map_marker_icon"
              value={form.map_marker_icon}
              onChange={(event) => setForm((prev) => ({ ...prev, map_marker_icon: event.target.value }))}
            />

            <label htmlFor="data_panel_color">Color panel</label>
            <input
              id="data_panel_color"
              value={form.data_panel_color}
              onChange={(event) => setForm((prev) => ({ ...prev, data_panel_color: event.target.value }))}
            />

              <div className="form-actions">
                <button type="submit">{editingId !== null ? "Guardar cambios" : "Crear recurso"}</button>
                {editingId !== null && (
                  <button type="button" className="ghost" onClick={resetForm}>
                    Cancelar edicion
                  </button>
                )}
              </div>
            </form>
          </article>
        ) : (
          <article className="editor-card">
            <h2>Gestion de recursos</h2>
            <p>Este perfil no tiene permisos de edicion.</p>
            <p>
              Puedes consultar recursos internos desde <strong>Mapa interno</strong>.
            </p>
          </article>
        )}

        <article className="list-card">
          <div className="list-header">
            <h2>Recursos ({filteredResources.length})</h2>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <ul>
            {filteredResources.map((resource) => (
              <li key={resource.id}>
                <div className="resource-meta">
                  <strong>{resource.tit}</strong>
                  <span>
                    {resource.amb} · {resource.tip}
                  </span>
                </div>
                <div className="resource-actions">
                  {canEdit && (
                    <>
                      <button type="button" className="ghost" onClick={() => startEdit(resource)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(resource.id)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default AdminPortalPage;
