import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../App.css";
import { getPersistedSession, logout } from "../services/authApi";
import { fetchResources } from "../services/resourcesApi";
import { listInternalPeople, TYPE_COLORS as peopleTypeColors } from "../services/internalPeopleApi";
import { isMobileViewport, normalizePersonIcon, normalizeText } from "../utils/mapUtils";

const defaultCenter = [27.74216081251307, -18.008738423478977];
const resultsPerPage = 12;
const ACCESS_FILTER_OPTIONS = [
  { value: "libre-acceso", label: "Libre acceso (no requiere cita ni valoración previa)" },
  { value: "cita-previa", label: "Con cita previa (es necesario solicitar cita antes de acudir)" },
  { value: "derivacion-profesional", label: "Con derivación profesional (se accede a través de servicios sociales, sanitarios u otras profesionales)" },
  { value: "valoracion-tecnica", label: "Con valoración técnica (requiere evaluación previa para determinar acceso)" },
  { value: "requisitos-administrativos", label: "Con requisitos administrativos (necesario cumplir condiciones como empadronamiento, edad, situación económica, etc.)" },
];

const ACCESS_KEYWORDS = {
  "libre-acceso": ["sin requisitos", "libre", "libre acceso", "abierto publico"],
  "cita-previa": ["cita", "cita previa", "solicitar cita"],
  "derivacion-profesional": ["derivación", "derivacion", "profesional", "servicios sociales", "sanitarios", "derivado"],
  "valoracion-tecnica": ["valoración", "valoracion", "técnica", "tecnica", "evaluación", "evaluacion"],
  "requisitos-administrativos": ["empadronamiento", "matrícula", "matricula", "administrativos", "requisitos", "baremación", "baremacion", "edad", "económica", "economica"],
};

const filterConfig = [
  { key: "amb", label: "Ambito" },
  { key: "tip", label: "Tipo" },
  { key: "req_acc", label: "¿Cómo acceder?", options: ACCESS_FILTER_OPTIONS },
  { key: "des_ser", label: "Servicios" },
  { key: "pob_ate", label: "Poblacion atendida" },
  { key: "per", label: "Personal" },
];
const tileLayers = {
  map: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 20,
  },
};

const PEOPLE_LABELS = {
  usuaria: "Usuaria Atendida",
  potencial: "Persona Potencial",
  recurso: "Persona Recurso",
};

function createEmptyFilters() {
  return filterConfig.reduce((acc, item) => {
    acc[item.key] = [];
    return acc;
  }, {});
}

function getValuesFromResource(resource, key) {
  const value = resource[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

function normalizeMarkerIcon(iconName) {
  if (!iconName) return "/assets/icons/map_markers/salud.png";
  return `/assets/icons/map_markers/${iconName}.png`;
}

function FlyToTarget({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    // Validar coordenadas antes de llamar a setView para evitar que Leaflet falle
    if (typeof target.lat !== "number" || typeof target.lng !== "number" ||
        isNaN(target.lat) || isNaN(target.lng)) return;
    map.setView([target.lat, target.lng], 15, { animate: true });
  }, [map, target]);
  return null;
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

// Entradas de la leyenda: icono + etiqueta descriptiva
// Solo se incluyen los archivos que existen en /public/assets/icons/map_markers/
const LEGEND_ITEMS = [
  // Personas
  { src: "/assets/icons/map_markers/persona_usuaria.svg",   label: "Usuaria atendida"  },
  { src: "/assets/icons/map_markers/persona_potencial.svg", label: "Persona potencial" },
  { src: "/assets/icons/map_markers/persona_recurso.svg",   label: "Persona recurso"   },
  // Recursos
  { src: "/assets/icons/map_markers/salud.png",        label: "Salud"         },
  { src: "/assets/icons/map_markers/urgencias.png",    label: "Urgencias"     },
  { src: "/assets/icons/map_markers/consultorio.png",  label: "Consultorio"   },
  { src: "/assets/icons/map_markers/dentista.png",     label: "Dentista"      },
  { src: "/assets/icons/map_markers/fisioterapia.png", label: "Fisioterapia"  },
  { src: "/assets/icons/map_markers/educacion.png",    label: "Educación"     },
  { src: "/assets/icons/map_markers/ancianos.png",     label: "Ancianos"      },
  { src: "/assets/icons/map_markers/ayuntamiento.png", label: "Ayuntamiento"  },
  { src: "/assets/icons/map_markers/mujer.png",        label: "Mujer"         },
];

// Panel de leyenda flotante sobre el mapa, plegable y arrastrable
function MapLegend() {
  const [open, setOpen] = useState(true);
  // Posición inicial: esquina inferior derecha (se calcula al montar)
  const [pos, setPos] = useState({ bottom: 24, right: 12 });
  // Guardamos el offset del ratón respecto a la esquina del panel al iniciar el drag
  const dragOffset = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!panelRef.current) return;
    // Evita que Leaflet capture eventos del panel (mousedown, click, scroll…)
    // Sin esto, al arrastrar la leyenda Leaflet añade 'leaflet-drag-target' al body,
    // lo que aplica cursor:move!important a todos los elementos de la página.
    L.DomEvent.disableClickPropagation(panelRef.current);
    L.DomEvent.disableScrollPropagation(panelRef.current);
  }, []);

  function onMouseDown(e) {
    // Solo arrastramos con el botón izquierdo
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = panelRef.current.getBoundingClientRect();
    // Offset entre el cursor y la esquina superior izquierda del panel
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e) {
    if (!dragOffset.current) return;
    // Calculamos nueva posición como top/left para mayor control
    setPos({
      top: e.clientY - dragOffset.current.y,
      left: e.clientX - dragOffset.current.x,
    });
  }

  function onMouseUp() {
    dragOffset.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  // Estilo de posición: usa top/left tras primer drag, bottom/right al inicio
  const posStyle = pos.top !== undefined
    ? { top: pos.top, left: pos.left }
    : { bottom: pos.bottom, right: pos.right };

  return (
    <div
      ref={panelRef}
      className="map-legend"
      style={{
        position: "absolute",
        ...posStyle,
        zIndex: 1000,
        background: "rgba(20,26,36,0.93)",
        borderRadius: 10,
        minWidth: 190,
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        color: "#fff",
        fontSize: 13,
        userSelect: "none", // evita selección de texto al arrastrar
        cursor: "default",  // cursor normal fuera de la cabecera
      }}
    >
      {/* Cabecera: arrastrando aquí se mueve el panel; clic simple pliega/despliega */}
      <div
        className="legend-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          padding: "8px 14px",
          borderRadius: open ? "10px 10px 0 0" : 10,
          background: "rgba(255,255,255,0.06)",
        }}
        onMouseDown={onMouseDown}
        onClick={() => setOpen(o => !o)}
      >
        <strong style={{ fontSize: 13 }}>☰ Leyenda</strong>
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
          {open ? "▲ ocultar" : "▼ mostrar"}
        </span>
      </div>

      {/* Lista de iconos, solo visible cuando está abierto */}
      {open && (
        <ul style={{ listStyle: "none", margin: 0, padding: "8px 14px 10px" }}>
          {LEGEND_ITEMS.map(item => (
            <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <img src={item.src} alt={item.label} style={{ width: 24, height: 24, objectFit: "contain" }} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InternalMapPage() {
  const [session, setSession] = useState(() => getPersistedSession());
  const [resources, setResources] = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("interno");
  const [resourceFilters, setResourceFilters] = useState(createEmptyFilters);
  const [peopleTypeFilter, setPeopleTypeFilter] = useState({
    usuaria: true,
    potencial: true,
    recurso: true,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(() => !isMobileViewport());
  const [currentResultsPage, setCurrentResultsPage] = useState(1);
  const [mapViewMode, setMapViewMode] = useState("map");
  const [selectedTarget, setSelectedTarget] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [resourcesResponse, peopleResponse] = await Promise.all([
          fetchResources(),
          listInternalPeople(),
        ]);
        if (!active) return;
        setResources(resourcesResponse.data || []);
        setPeople(peopleResponse || []);
        setSourceLabel(`${resourcesResponse.source} + personas`);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Error cargando datos internos");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    return filterConfig.reduce((acc, filterItem) => {
      if (filterItem.options) {
        acc[filterItem.key] = filterItem.options;
      } else {
        const values = resources.flatMap((resource) => getValuesFromResource(resource, filterItem.key));
        acc[filterItem.key] = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "es"));
      }
      return acc;
    }, {});
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      return filterConfig.every((filterItem) => {
        const selectedValues = resourceFilters[filterItem.key] ?? [];
        if (selectedValues.length === 0) return true;

        if (filterItem.key === "req_acc") {
          const resourceText = [
            resource.tit,
            resource.des_ser,
            resource.req_acc,
          ].flatMap(v => (Array.isArray(v) ? v : [v])).join(" ").toLowerCase();

          return selectedValues.some((value) => {
            const keywords = ACCESS_KEYWORDS[value] || [];
            return keywords.some((kw) => resourceText.includes(kw));
          });
        }

        const resourceValues = getValuesFromResource(resource, filterItem.key);
        if (resourceValues.length === 0) return false;
        return resourceValues.some((value) => selectedValues.includes(value));
      });
    });
  }, [resources, resourceFilters]);

  const filteredPeople = useMemo(() => {
    return people.filter((person) => peopleTypeFilter[person.tipo] === true);
  }, [people, peopleTypeFilter]);

  const allSearchItems = useMemo(() => {
    const resourcesMapped = filteredResources.map((resource) => ({
      kind: "resource",
      id: `r-${resource.id}`,
      label: resource.tit,
      subtitle: `${resource.amb || "Sin ambito"} · ${resource.tip || "Sin tipo"}`,
      lat: resource.lat,
      lng: resource.lng,
      data: resource,
    }));
    const peopleMapped = filteredPeople.map((person) => ({
      kind: "person",
      id: `p-${person.id}`,
      label: person.nombre,
      subtitle: `${person.tipo} · ${person.zona || "Sin zona"}`,
      lat: person.lat,
      lng: person.lng,
      data: person,
    }));
    return [...resourcesMapped, ...peopleMapped];
  }, [filteredResources, filteredPeople]);

  const searchedItems = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) return allSearchItems;
    return allSearchItems.filter(
        (item) => normalizeText(item.label).includes(term) || normalizeText(item.subtitle).includes(term)
    );
  }, [allSearchItems, search]);

  const activeFilterCount = useMemo(() => {
    const resourceCount = Object.values(resourceFilters).reduce((total, values) => total + values.length, 0);
    const peopleCount = Object.values(peopleTypeFilter).filter(Boolean).length;
    return resourceCount + peopleCount;
  }, [resourceFilters, peopleTypeFilter]);

  const totalResultsPages = useMemo(
      () => Math.max(1, Math.ceil(searchedItems.length / resultsPerPage)),
      [searchedItems.length]
  );

  const pagedItems = useMemo(() => {
    const currentPageSafe = Math.min(currentResultsPage, totalResultsPages);
    const start = (currentPageSafe - 1) * resultsPerPage;
    return searchedItems.slice(start, start + resultsPerPage);
  }, [searchedItems, currentResultsPage, totalResultsPages]);

  useEffect(() => {
    setCurrentResultsPage(1);
  }, [search, resourceFilters, peopleTypeFilter]);

  function toggleResourceFilter(filterKey, value) {
    setResourceFilters((prev) => {
      const currentValues = prev[filterKey] ?? [];
      const nextValues = currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];
      return { ...prev, [filterKey]: nextValues };
    });
  }

  function togglePeopleType(type) {
    setPeopleTypeFilter((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  function clearAllFilters() {
    setResourceFilters(createEmptyFilters());
    setPeopleTypeFilter({ usuaria: true, potencial: true, recurso: true });
  }

  function handleSelectItem(item) {
    setSelectedTarget(item);
    if (isMobileViewport()) setIsResultsPanelOpen(false);
  }

  function handleLogout() {
    logout();
    setSession(null);
  }

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  return (
      <div className="app-shell">
        <header className="top-bar">
          <div className="brand-block">
            <h1>Mapa interno</h1>
            <p className="meta">Origen de datos: {sourceLabel}</p>
          </div>
          <div className="search-block">
            <input
                type="text"
                placeholder="Buscar personas o recursos..."
                aria-label="Buscar personas o recursos"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="actions-block">
            <button type="button" onClick={() => setIsFilterDrawerOpen(true)}>
              Filtros ({activeFilterCount})
            </button>
            <button type="button" onClick={() => setIsResultsPanelOpen((prev) => !prev)}>
              {isResultsPanelOpen ? "Ocultar resultados" : "Ver resultados"}
            </button>
            <Link className="admin-link" to="/admin">
              Dashboard
            </Link>
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        <div className="status-strip">
          <p>Resultados: {searchedItems.length} | Pagina {currentResultsPage}/{totalResultsPages}</p>
          <div className="map-view-toggle" role="group" aria-label="Cambiar vista del mapa">
            <button
                type="button"
                className={mapViewMode === "map" ? "active" : ""}
                aria-pressed={mapViewMode === "map"}
                onClick={() => setMapViewMode("map")}
            >
              Mapa
            </button>
            <button
                type="button"
                className={mapViewMode === "satellite" ? "active" : ""}
                aria-pressed={mapViewMode === "satellite"}
                onClick={() => setMapViewMode("satellite")}
            >
              Satelite
            </button>
          </div>
        </div>

        {loading && <p className="floating-message">Cargando datos internos...</p>}
        {error && <p className="floating-message error">{error}</p>}

        <aside className={isFilterDrawerOpen ? "filters-drawer open" : "filters-drawer"}
        onKeyDown={(e) => { if (e.key === "Escape") setIsFilterDrawerOpen(false); }}>
          <div className="filters-header-row">
            <h2>Filtros</h2>
            <button type="button" className="ghost" onClick={() => setIsFilterDrawerOpen(false)}>
              Cerrar
            </button>
          </div>
          <div className="filters-actions">
            <button type="button" className="ghost" onClick={clearAllFilters}>
              Limpiar
            </button>
          </div>
          <details className="filter-group" open>
            <summary>Personas</summary>
            <div className="options-grid">
              {["usuaria", "potencial", "recurso"].map((type) => (
                  <button
                      key={type}
                      type="button"
                      className={peopleTypeFilter[type] ? "option active" : "option"}
                      aria-pressed={peopleTypeFilter[type]}
                      onClick={() => togglePeopleType(type)}
                  >
                    {PEOPLE_LABELS[type] || type}
                  </button>
              ))}
            </div>
          </details>
          {filterConfig.map((filterItem) => (
              <details key={filterItem.key} className="filter-group">
                <summary>
                  {filterItem.label}
                  <span className="chip">{(resourceFilters[filterItem.key] ?? []).length}</span>
                </summary>
                <div className="options-grid">
                  {(filterOptions[filterItem.key] ?? []).map((value) => (
                      <button
                          key={value}
                          type="button"
                          className={(resourceFilters[filterItem.key] ?? []).includes(typeof value === 'object' ? value.value : value) ? "option active" : "option"}
                          aria-pressed={(resourceFilters[filterItem.key] ?? []).includes(typeof value === 'object' ? value.value : value)}
                          onClick={() => toggleResourceFilter(filterItem.key, typeof value === 'object' ? value.value : value)}
                      >
                        {typeof value === 'object' ? value.label : value}
                      </button>
                  ))}
                </div>
              </details>
          ))}
        </aside>

        {isFilterDrawerOpen && <div
          className="drawer-overlay"
          role="button"
          tabIndex={0}
          aria-label="Cerrar filtros"
          onClick={() => setIsFilterDrawerOpen(false)}
          onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setIsFilterDrawerOpen(false); }}
        />}

        {isResultsPanelOpen && (
            <aside className="results-panel">
              <ul className="resource-list">
                {pagedItems.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => handleSelectItem(item)}>
                        {item.label}
                        <br />
                        <small>{item.subtitle}</small>
                      </button>
                    </li>
                ))}
              </ul>
              <div className="pagination">
                <button
                    type="button"
                    onClick={() => setCurrentResultsPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentResultsPage <= 1}
                >
                  Anterior
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentResultsPage((prev) => Math.min(totalResultsPages, prev + 1))}
                    disabled={currentResultsPage >= totalResultsPages}
                >
                  Siguiente
                </button>
              </div>
            </aside>
        )}

        <main className="map-wrapper" style={{ position: "relative" }}>
          {/* Leyenda flotante sobre el mapa */}
          <MapLegend />
          <MapContainer center={defaultCenter} zoom={11} className="map">
            <TileLayer
                attribution={tileLayers[mapViewMode].attribution}
                url={tileLayers[mapViewMode].url}
                maxZoom={tileLayers[mapViewMode].maxZoom}
            />
            {filteredResources.map((resource) => {
                // Omitir marcadores con coordenadas inválidas
                if (typeof resource.lat !== "number" || typeof resource.lng !== "number" ||
                    isNaN(resource.lat) || isNaN(resource.lng)) return null;
                return (
                <Marker
                    key={`resource-${resource.id}`}
                    position={[resource.lat, resource.lng]}
                    icon={L.icon({
                      iconUrl: normalizeMarkerIcon(resource.map_marker_icon),
                      iconSize: [32, 37],
                      iconAnchor: [16, 37],
                    })}
                    eventHandlers={{
                      click: () =>
                          setSelectedTarget({
                            kind: "resource",
                            lat: resource.lat,
                            lng: resource.lng,
                            data: resource,
                          }),
                    }}
                >
                  <Popup>
                    <strong>{resource.tit}</strong>
                    <br />
                    Recurso
                  </Popup>
                </Marker>
                );
            })}

            {filteredPeople.map((person) => (
                <Marker
                    key={`person-${person.id}`}
                    position={[person.lat, person.lng]}
                    icon={normalizePersonIcon(person.tipo)}
                    zIndexOffset={1000}
                    eventHandlers={{
                      click: () =>
                          setSelectedTarget({
                            kind: "person",
                            lat: person.lat,
                            lng: person.lng,
                            data: person,
                          }),
                    }}
                >
                  <Popup>
                    <strong>{person.nombre}</strong>
                    <br />
                    {PEOPLE_LABELS[person.tipo] || person.tipo} · {person.zona}
                  </Popup>
                </Marker>
            ))}

            <FlyToTarget target={selectedTarget} />
          </MapContainer>

          {selectedTarget && (
              <aside className="resource-sheet" role="dialog">
                <div className="resource-sheet-header">
                  <h2>{selectedTarget.kind === "person" ? selectedTarget.data.nombre : selectedTarget.data.tit}</h2>
                  <button type="button" onClick={() => setSelectedTarget(null)}>
                    Cerrar
                  </button>
                </div>

                {selectedTarget.kind === "person" ? (
                    <>
                      <section>
                        <h3>Datos basicos</h3>
                        <div className="sheet-row"><strong>Tipo:</strong><p>{PEOPLE_LABELS[selectedTarget.data.tipo] || selectedTarget.data.tipo}</p></div>
                        <div className="sheet-row"><strong>Zona:</strong><p>{selectedTarget.data.zona}</p></div>
                        <div className="sheet-row"><strong>Telefono:</strong><p>{selectedTarget.data.telefono || "Sin telefono"}</p></div>
                        <div className="sheet-row"><strong>Email:</strong><p>{selectedTarget.data.email || "Sin email"}</p></div>
                        <div className="sheet-row"><strong>Geolocalizacion:</strong><p>{selectedTarget.data.lat}, {selectedTarget.data.lng}</p></div>
                      </section>
                      <section>
                        <h3>Relaciones activas</h3>
                        {renderArrayItems(selectedTarget.data.relacionesActivas, "Sin relaciones activas")}
                      </section>
                      <section>
                        <h3>Relaciones inactivas</h3>
                        {renderArrayItems(selectedTarget.data.relacionesInactivas, "Sin relaciones inactivas")}
                      </section>
                      <section>
                        <h3>Historial acuerdos y colaboraciones</h3>
                        {renderArrayItems(selectedTarget.data.historialAcuerdos, "Sin historial")}
                      </section>
                    </>
                ) : (
                    <>
                      <section>
                        <h3>Ficha del recurso</h3>
                        <div className="sheet-row"><strong>Nombre:</strong><p>{selectedTarget.data.tit}</p></div>
                        <div className="sheet-row"><strong>Direccion:</strong><p>{selectedTarget.data.dir || "Sin direccion"}</p></div>
                        <div className="sheet-row"><strong>Ambito:</strong><p>{selectedTarget.data.amb || "Sin ambito"}</p></div>
                        <div className="sheet-row"><strong>Tipo:</strong><p>{selectedTarget.data.tip || "Sin tipo"}</p></div>
                        <div className="sheet-row"><strong>¿Cómo acceder?:</strong>{renderArrayItems(selectedTarget.data.req_acc, "Sin requisitos")}</div>
                        <div className="sheet-row"><strong>Geolocalizacion:</strong><p>{selectedTarget.data.lat}, {selectedTarget.data.lng}</p></div>
                      </section>
                      <section>
                        <h3>Descripcion del servicio</h3>
                        {renderArrayItems(selectedTarget.data.des_ser, "Sin descripcion")}
                      </section>
                    </>
                )}
              </aside>
          )}
        </main>
      </div>
  );
}

export default InternalMapPage;