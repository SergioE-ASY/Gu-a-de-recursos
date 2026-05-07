import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { getPersistedSession, logout } from "../services/authApi";
import { normalizePersonIcon, normalizeText } from "../utils/mapUtils";
import { fetchResources } from "../services/resourcesApi";
import {
  TYPE_COLORS,
  convertPersonToResource,
  createInternalPerson,
  deleteInternalPerson,
  listInternalPeople,
  updateInternalPerson,
} from "../services/internalPeopleApi";
import "./admin.css";

const defaultCenter = [27.74216081251307, -18.008738423478977];

const PEOPLE_LABELS = {
  usuaria: "Usuaria Atendida",
  potencial: "Persona Potencial",
  recurso: "Persona Recurso",
};

const initialForm = {
  nombre: "",
  tipo: "potencial",
  zona: "",
  telefono: "",
  email: "",
  lat: "",
  lng: "",
  datosBasicos: "",
};

function toArrayFromText(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderArrayItems(items, emptyLabel = "Sin datos") {
  if (!items || items.length === 0) {
    return (
      <ul>
        <li>{emptyLabel}</li>
      </ul>
    );
  }
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// Comprueba que lat y lng sean números válidos antes de usarlos en Leaflet
function isValidCoord(lat, lng) {
  return typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
}

function InternalPeopleGuidePage({ readOnly = false }) {
  const [session, setSession] = useState(() => getPersistedSession());
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [relacionesActivasText, setRelacionesActivasText] = useState("");
  const [relacionesInactivasText, setRelacionesInactivasText] = useState("");
  const [historialText, setHistorialText] = useState("");
  const canEdit = session?.user?.role === "coordinadora" && !readOnly;

  useEffect(() => {
    if (!session) return;
    let active = true;

    async function loadPeople() {
      try {
        setLoading(true);
        setError("");
        const [peopleData, resourceData] = await Promise.all([
          listInternalPeople(),
          fetchResources(),
        ]);
        if (!active) return;
        setPeople(peopleData);
        setResources(resourceData.data || []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar personas");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPeople();
    return () => {
      active = false;
    };
  }, [session]);

  const filteredPeople = useMemo(() => {
    const term = normalizeText(query.trim());
    return people.filter((person) => {
      if (typeFilter !== "todos" && person.tipo !== typeFilter) return false;
      if (!term) return true;
      return (
          normalizeText(person.nombre).includes(term) ||
          normalizeText(person.zona).includes(term) ||
          normalizeText(person.email).includes(term)
      );
    });
  }, [people, query, typeFilter]);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedId) || null,
    [people, selectedId]
  );
  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  if (!readOnly && session.user.role !== "coordinadora") {
    return <Navigate to="/admin/internal-map" replace />;
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  function startEdit(person) {
    setEditingId(person.id);
    setForm({
      nombre: person.nombre || "",
      tipo: person.tipo || "potencial",
      zona: person.zona || "",
      telefono: person.telefono || "",
      email: person.email || "",
      lat: person.lat ?? "",
      lng: person.lng ?? "",
      datosBasicos: person.datosBasicos || "",
    });
    setRelacionesActivasText((person.relacionesActivas || []).join("\n"));
    setRelacionesInactivasText((person.relacionesInactivas || []).join("\n"));
    setHistorialText((person.historialAcuerdos || []).join("\n"));
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setRelacionesActivasText("");
    setRelacionesInactivasText("");
    setHistorialText("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canEdit) return;
    const payload = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      relacionesActivas: toArrayFromText(relacionesActivasText),
      relacionesInactivas: toArrayFromText(relacionesInactivasText),
      historialAcuerdos: toArrayFromText(historialText),
      origen: editingId ? undefined : "interno",
    };

    try {
      if (editingId) {
        const updated = await updateInternalPerson(editingId, payload);
        setPeople((prev) => prev.map((person) => (person.id === editingId ? updated : person)));
      } else {
        const created = await createInternalPerson(payload);
        setPeople((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar");
    }
  }

  async function handleDelete(id) {
    if (!canEdit) return;
    if (!window.confirm("Se eliminara la persona-recurso. Deseas continuar?")) return;
    try {
      await deleteInternalPerson(id);
      setPeople((prev) => prev.filter((person) => person.id !== id));
      if (selectedId === id) setSelectedId(null);
      if (editingId === id) resetForm();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar");
    }
  }

  async function handleConvert(id) {
    if (!canEdit) return;
    try {
      const converted = await convertPersonToResource(id);
      setPeople((prev) => prev.map((person) => (person.id === id ? converted : person)));
                      openPersonSheet(id);
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "No se pudo convertir");
    }
  }

  function openPersonSheet(id) {
    setSelectedResourceId(null);
    setSelectedId(id);
  }

  function openResourceSheet(id) {
    setSelectedId(null);
    setSelectedResourceId(id);
  }

  return (
    <main className={readOnly ? "admin-dashboard-page internal-consult-page" : "admin-dashboard-page"}>
      <header className="admin-header">
        <div>
          <h1>Guia interna de personas-recurso</h1>
          <p>{session.user.fullName} · {session.user.role}</p>
        </div>
        <div className="header-actions">
          <Link to="/admin" className="go-back-link">
            Dashboard
          </Link>
          <Link to="/admin/internal-map" className="go-back-link">
            Mapa interno
          </Link>
          {session.user.role === "coordinadora" && (
            <Link to="/admin/internal-guide" className="go-back-link">
              Gestion personas
            </Link>
          )}
          <Link to="/" className="go-back-link">
            Ir al mapa publico
          </Link>
          <button type="button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <section className="people-legend">
        <span><i style={{ background: "#000000" }} /> Usuaria Atendida</span>
        <span><i style={{ background: "#000000" }} /> Persona Potencial</span>
        <span><i style={{ background: "#000000" }} /> Persona Recurso</span>
        <span><i style={{ background: "#2563eb" }} /> Recursos (centros/instalaciones)</span>
      </section>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading-inline">Cargando guia interna...</p>}

      {readOnly ? (
        <section className="internal-map-consult-layout">
          <article className="list-card consult-search-card">
            <div className="list-header">
              <h2>Buscar personas ({filteredPeople.length})</h2>
              <input
                type="text"
                placeholder="Buscar persona..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="type-filters">
              {["todos", "usuaria", "potencial", "recurso"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={typeFilter === type ? "active" : ""}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === "todos" ? "Todos" : (PEOPLE_LABELS[type] || type)}
                </button>
              ))}
            </div>
            <ul>
              {filteredPeople.map((person) => (
                <li key={person.id}>
                  <div className="resource-meta">
                    <strong>{person.nombre}</strong>
                    <span>{person.zona} · {PEOPLE_LABELS[person.tipo] || person.tipo}</span>
                  </div>
                  <div className="resource-actions">
                    <button type="button" className="ghost" onClick={() => openPersonSheet(person.id)}>
                      Ficha
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <div className="internal-map-stage">
            <MapContainer center={defaultCenter} zoom={11} className="internal-consult-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPeople.map((person) => {
                // Omitir marcadores con coordenadas inválidas
                if (!isValidCoord(person.lat, person.lng)) return null;
                return (
                  <Marker
                    key={person.id}
                    position={[person.lat, person.lng]}
                    icon={normalizePersonIcon(person.tipo)}
                    zIndexOffset={1000}
                    eventHandlers={{ click: () => openPersonSheet(person.id) }}
                  >
                    <Popup>
                      <strong>{person.nombre}</strong>
                      <br />
                      {PEOPLE_LABELS[person.tipo] || person.tipo} · {person.zona}
                    </Popup>
                  </Marker>
                );
              })}
              {resources.map((resource) => {
                // Omitir marcadores con coordenadas inválidas
                if (!isValidCoord(resource.lat, resource.lng)) return null;
                return (
                <CircleMarker
                  key={`resource-${resource.id}`}
                  center={[resource.lat, resource.lng]}
                  radius={6}
                  pathOptions={{
                    color: "#2563eb",
                    fillColor: "#2563eb",
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => openResourceSheet(resource.id) }}
                >
                  <Popup>
                    <strong>{resource.tit}</strong>
                    <br />
                    Recurso de la guia
                  </Popup>
                </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {(selectedPerson || selectedResource) && (
            <aside className="resource-sheet internal-sheet">
              <div className="resource-sheet-header">
                <h2>{selectedPerson ? selectedPerson.nombre : selectedResource.tit}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setSelectedResourceId(null);
                  }}
                >
                  Cerrar
                </button>
              </div>

              {selectedPerson && (
                <>
                  <section>
                    <h3>Datos basicos</h3>
                    <div className="sheet-row"><strong>Tipo:</strong><p>{PEOPLE_LABELS[selectedPerson.tipo] || selectedPerson.tipo}</p></div>
                    <div className="sheet-row"><strong>Zona:</strong><p>{selectedPerson.zona}</p></div>
                    <div className="sheet-row"><strong>Telefono:</strong><p>{selectedPerson.telefono || "Sin telefono"}</p></div>
                    <div className="sheet-row"><strong>Email:</strong><p>{selectedPerson.email || "Sin email"}</p></div>
                    <div className="sheet-row"><strong>Datos basicos:</strong><p>{selectedPerson.datosBasicos || "Sin datos"}</p></div>
                    <div className="sheet-row"><strong>Geolocalizacion:</strong><p>{selectedPerson.lat}, {selectedPerson.lng}</p></div>
                  </section>
                  <section>
                    <h3>Relaciones activas</h3>
                    {renderArrayItems(selectedPerson.relacionesActivas, "Sin relaciones activas")}
                  </section>
                  <section>
                    <h3>Relaciones inactivas</h3>
                    {renderArrayItems(selectedPerson.relacionesInactivas, "Sin relaciones inactivas")}
                  </section>
                  <section>
                    <h3>Historial acuerdos y colaboraciones</h3>
                    {renderArrayItems(selectedPerson.historialAcuerdos, "Sin historial")}
                  </section>
                </>
              )}

              {selectedResource && (
                <>
                  <section>
                    <h3>Ficha de recurso</h3>
                    <div className="sheet-row"><strong>Nombre:</strong><p>{selectedResource.tit}</p></div>
                    <div className="sheet-row"><strong>Direccion:</strong><p>{selectedResource.dir || "Sin direccion"}</p></div>
                    <div className="sheet-row"><strong>Ambito:</strong><p>{selectedResource.amb || "Sin ambito"}</p></div>
                    <div className="sheet-row"><strong>Tipo:</strong><p>{selectedResource.tip || "Sin tipo"}</p></div>
                    <div className="sheet-row"><strong>Geolocalizacion:</strong><p>{selectedResource.lat}, {selectedResource.lng}</p></div>
                    <div className="sheet-row"><strong>Descripcion servicio:</strong>{renderArrayItems(selectedResource.des_ser, "Sin descripcion")}</div>
                  </section>
                </>
              )}
            </aside>
          )}
        </section>
      ) : (
        <section className="internal-people-grid">
          <article className="list-card people-list-card">
            <div className="list-header">
              <h2>Personas ({filteredPeople.length})</h2>
              <input
                type="text"
                placeholder="Buscar persona..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="type-filters">
              {["todos", "usuaria", "potencial", "recurso"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={typeFilter === type ? "active" : ""}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === "todos" ? "Todos" : (PEOPLE_LABELS[type] || type)}
                </button>
              ))}
            </div>
            <ul>
              {filteredPeople.map((person) => (
                <li key={person.id}>
                  <div className="resource-meta">
                    <strong>{person.nombre}</strong>
                    <span>{person.zona} · {PEOPLE_LABELS[person.tipo] || person.tipo}</span>
                  </div>
                  <div className="resource-actions">
                    <button type="button" className="ghost" onClick={() => openPersonSheet(person.id)}>
                      Ficha
                    </button>
                    {canEdit && (
                      <>
                        <button type="button" className="ghost" onClick={() => startEdit(person)}>
                          Editar
                        </button>
                        {person.tipo !== "recurso" && (
                          <button type="button" onClick={() => handleConvert(person.id)}>
                            Convertir
                          </button>
                        )}
                        <button type="button" className="danger" onClick={() => handleDelete(person.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="editor-card people-form-card">
            <h2>{editingId ? "Editar persona-recurso" : "Nueva persona-recurso"}</h2>
            <form onSubmit={handleSave} className="editor-form">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} required />
              <div className="two-cols">
                <div>
                  <label htmlFor="tipo">Tipo</label>
                  <select id="tipo" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                    <option value="usuaria">Usuaria Atendida</option>
                    <option value="potencial">Persona Potencial</option>
                    <option value="recurso">Persona Recurso</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="zona">Zona</label>
                  <input id="zona" value={form.zona} onChange={(e) => setForm((p) => ({ ...p, zona: e.target.value }))} required />
                </div>
              </div>
              <div className="two-cols">
                <div>
                  <label htmlFor="telefono">Telefono</label>
                  <input id="telefono" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="two-cols">
                <div>
                  <label htmlFor="lat">Latitud</label>
                  <input id="lat" type="number" step="any" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} required />
                </div>
                <div>
                  <label htmlFor="lng">Longitud</label>
                  <input id="lng" type="number" step="any" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} required />
                </div>
              </div>
              <label htmlFor="datosBasicos">Datos basicos</label>
              <textarea id="datosBasicos" rows={3} value={form.datosBasicos} onChange={(e) => setForm((p) => ({ ...p, datosBasicos: e.target.value }))} />
              <label htmlFor="act">Relaciones activas (una por linea)</label>
              <textarea id="act" rows={3} value={relacionesActivasText} onChange={(e) => setRelacionesActivasText(e.target.value)} />
              <label htmlFor="inact">Relaciones inactivas (una por linea)</label>
              <textarea id="inact" rows={3} value={relacionesInactivasText} onChange={(e) => setRelacionesInactivasText(e.target.value)} />
              <label htmlFor="hist">Historial acuerdos/colaboraciones (una por linea)</label>
              <textarea id="hist" rows={3} value={historialText} onChange={(e) => setHistorialText(e.target.value)} />
              <div className="form-actions">
                <button type="submit">{editingId ? "Guardar cambios" : "Crear persona-recurso"}</button>
                {editingId && <button type="button" className="ghost" onClick={resetForm}>Cancelar</button>}
              </div>
            </form>
          </article>

          <article className="list-card people-map-card">
            <h2>Mapa interno</h2>
            <div className="people-map-wrap">
              <MapContainer center={defaultCenter} zoom={11} className="people-map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredPeople.map((person) => {
                  // Omitir marcadores con coordenadas inválidas
                  if (!isValidCoord(person.lat, person.lng)) return null;
                  return (
                    <Marker
                      key={person.id}
                      position={[person.lat, person.lng]}
                      icon={normalizePersonIcon(person.tipo)}
                      zIndexOffset={1000}
                      eventHandlers={{ click: () => openPersonSheet(person.id) }}
                    >
                      <Popup>
                        <strong>{person.nombre}</strong>
                        <br />
                        {PEOPLE_LABELS[person.tipo] || person.tipo} · {person.zona}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
            {selectedPerson && (
              <div className="person-sheet">
                <h3>Ficha de persona-recurso</h3>
                <p><strong>Nombre:</strong> {selectedPerson.nombre}</p>
                <p><strong>Tipo:</strong> {PEOPLE_LABELS[selectedPerson.tipo] || selectedPerson.tipo}</p>
                <p><strong>Zona:</strong> {selectedPerson.zona}</p>
                <p><strong>Datos basicos:</strong> {selectedPerson.datosBasicos || "Sin datos"}</p>
                <p><strong>Geolocalizacion:</strong> {selectedPerson.lat}, {selectedPerson.lng}</p>
                <div>
                  <strong>Relaciones activas</strong>
                  {renderArrayItems(selectedPerson.relacionesActivas, "Sin relaciones activas")}
                </div>
                <div>
                  <strong>Relaciones inactivas</strong>
                  {renderArrayItems(selectedPerson.relacionesInactivas, "Sin relaciones inactivas")}
                </div>
                <div>
                  <strong>Historial acuerdos y colaboraciones</strong>
                  {renderArrayItems(selectedPerson.historialAcuerdos, "Sin historial")}
                </div>
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default InternalPeopleGuidePage;
