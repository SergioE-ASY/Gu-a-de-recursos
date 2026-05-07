import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "../App.css";
import { fetchResources } from "../services/resourcesApi";

const defaultCenter = [27.74216081251307, -18.008738423478977];
const NEEDS_FILTER_KEY = "need";
const NEEDS_FILTER_OPTIONS = [
  { value: "salud", label: "Salud" },
  { value: "salud-mental-adicciones", label: "Salud mental y adicciones" },
  { value: "servicios-sociales", label: "Servicios sociales" },
  { value: "dependencia", label: "Dependencia" },
  { value: "discapacidad", label: "Discapacidad" },
  { value: "apoyo-cuidadoras", label: "Apoyo a personas cuidadoras" },
  { value: "infancia-adolescencia-familia", label: "Infancia, adolescencia y familia" },
  { value: "educacion", label: "Educación" },
  { value: "empleo-formacion", label: "Empleo y formación" },
  { value: "vivienda", label: "Vivienda" },
  { value: "igualdad-violencia-genero", label: "Igualdad y violencia de género" },
  { value: "migracion-extranjeria", label: "Migración y extranjería" },
  { value: "mayores", label: "Mayores" },
  { value: "juventud", label: "Juventud" },
  { value: "cultura-ocio-deporte", label: "Cultura, ocio y deporte" },
  { value: "transporte", label: "Transporte" },
  { value: "seguridad-justicia", label: "Seguridad y justicia" },
  { value: "participacion-ciudadana", label: "Participación ciudadana" },
];
const NEED_KEYWORDS = {
  salud: [
    "salud",
    "centro",
    "consultorio",
    "médico",
    "medico",
    "primaria",
    "odontología",
    "odontologia",
    "enfermería",
    "enfermeria",
    "pediatría",
    "pediatria",
    "analítica",
    "analitica",
    "urgencia",
    "urgencias",
  ],
  "salud-mental-adicciones": [
    "salud mental",
    "psicología",
    "psicologia",
    "psiquiatría",
    "psiquiatria",
    "adicción",
    "adicciones",
    "prevención",
    "prevencion",
    "unidad de salud mental",
    "unidades de salud mental",
  ],
  "servicios-sociales": [
    "servicios sociales",
    "municipal",
    "ayudas de emergencia",
    "alimentos",
    "bono social",
    "orientación social",
    "orientacion social",
    "trabajo social",
  ],
  dependencia: [
    "ayuda a domicilio",
    "teleasistencia",
    "centros de día",
    "centros de dia",
    "atención residencial",
    "atencion residencial",
    "promoción de la autonomía personal",
    "promocion de la autonomia personal",
  ],
  discapacidad: [
    "atención especializada",
    "atencion especializada",
    "logopedia",
    "fisioterapia",
    "terapia ocupacional",
    "ayudas técnicas",
    "ayudas tecnicas",
    "certificados de discapacidad",
    "discapacidad",
  ],
  "apoyo-cuidadoras": [
    "respiro familiar",
    "formación para personas cuidadoras",
    "formacion para personas cuidadoras",
    "grupos de apoyo",
    "acompañamiento psicológico",
    "acompanamiento psicologico",
    "orientación sobre cuidados",
    "orientacion sobre cuidados",
    "programas de apoyo a cuidadoras",
    "programas de apoyo a personas cuidadoras",
  ],
  "infancia-adolescencia-familia": [
    "guarderías",
    "guarderias",
    "colegios",
    "apoyo familiar",
    "intervención con menores",
    "intervencion con menores",
    "prevención",
    "prevencion",
    "orientación a familias",
    "orientacion a familias",
  ],
  educacion: [
    "colegios",
    "formación reglada",
    "formacion reglada",
    "educación infantil",
    "educacion infantil",
    "primaria",
    "secundaria",
    "formación complementaria",
    "formacion complementaria",
    "idiomas",
  ],
  "empleo-formacion": [
    "orientación laboral",
    "orientacion laboral",
    "cursos",
    "planes de empleo",
    "inserción laboral",
    "insercion laboral",
    "formación ocupacional",
    "formacion ocupacional",
  ],
  vivienda: [
    "ayudas al alquiler",
    "alquiler",
    "vivienda social",
    "rehabilitación",
    "rehabilitacion",
    "asesoramiento en vivienda",
  ],
  "igualdad-violencia-genero": [
    "violencia de género",
    "violencia de genero",
    "atención a mujeres",
    "atencion a mujeres",
    "recursos para víctimas",
    "recursos para victimas",
    "asesoramiento",
    "apoyo psicológico",
    "apoyo psicologico",
    "apoyo social",
  ],
  "migracion-extranjeria": [
    "asesoramiento legal",
    "arraigo",
    "trámites de extranjería",
    "tramites de extranjeria",
    "personas migrantes",
    "migrantes",
  ],
  mayores: [
    "personas mayores",
    "envejecimiento activo",
    "actividades",
    "centros de mayores",
  ],
  juventud: [
    "programas juveniles",
    "actividades juveniles",
    "formación juvenil",
    "formacion juvenil",
    "ocio juvenil",
    "participación juvenil",
    "participacion juvenil",
  ],
  "cultura-ocio-deporte": [
    "actividades culturales",
    "talleres",
    "deportes",
    "ocio comunitario",
    "actividades físicas",
    "actividades fisicas",
  ],
  transporte: [
    "transporte público",
    "transporte publico",
    "transporte adaptado",
    "traslado a recursos",
    "transporte escolar",
  ],
  "seguridad-justicia": [
    "servicios policiales",
    "asesoramiento jurídico",
    "asesoramiento juridico",
    "recursos de protección",
    "recursos de proteccion",
    "trámites legales",
    "tramites legales",
  ],
  "participacion-ciudadana": [
    "asociaciones",
    "voluntariado",
    "actividades comunitarias",
    "dinamización social",
    "dinamizacion social",
  ],
};

const WHO_FILTER_KEY = "audience";
const WHO_FILTER_OPTIONS = [
  { value: "toda-la-poblacion", label: "Toda la población" },
  { value: "infancia", label: "Infancia (0–12)" },
  { value: "adolescencia", label: "Adolescencia (13–17)" },
  { value: "juventud", label: "Juventud (18–30)" },
  { value: "adultas", label: "Personas adultas" },
  { value: "mayores", label: "Personas mayores" },
  { value: "discapacidad", label: "Personas con discapacidad" },
  { value: "dependencia", label: "Personas en situación de dependencia" },
  { value: "cuidadoras", label: "Personas cuidadoras" },
  { value: "familias", label: "Familias" },
  { value: "migrantes", label: "Personas migrantes" },
  { value: "vulnerabilidad-social", label: "Personas en situación de vulnerabilidad social" },
  { value: "mujeres", label: "Mujeres" },
];

const WHERE_FILTER_KEY = "location";
const WHERE_FILTER_OPTIONS = [
  { value: "toda-la-isla", label: "Toda la isla" },
  { value: "valverde", label: "Valverde" },
  { value: "la-frontera", label: "La Frontera" },
  { value: "el-pinar", label: "El Pinar" },
  { value: "cerca-de-mi", label: "Cerca de mí" },
];

const LOCATION_KEYWORDS = {
  valverde: ["valverde"],
  "la-frontera": ["la frontera", "frontera"],
  "el-pinar": ["el pinar", "pinar"],
};

const ENTITY_TYPE_FILTER_KEY = "tip";
const ENTITY_TYPE_OPTIONS = [
  { value: "publica", label: "Pública" },
  { value: "privada", label: "Privada" },
  { value: "tercer-sector", label: "Tercer sector" },
];

const ENTITY_TYPE_KEYWORDS = {
  publica: [
    "pública",
    "publica",
    "administraciones públicas",
    "administraciones publicas",
    "servicios gestionados por administraciones públicas",
    "servicios gestionados por administraciones publicas",
  ],
  privada: [
    "privada",
    "empresa privada",
    "empresas privadas",
    "servicios ofrecidos por empresas privadas",
  ],
  "tercer-sector": [
    "tercer sector",
    "terceros sector",
    "asociación",
    "asociaciones",
    "ong",
    "ONG",
    "entidades sociales",
    "sin ánimo de lucro",
    "sin animo de lucro",
    "recursos gestionados por entidades sociales",
  ],
};

const ACCESS_FILTER_KEY = "req_acc";
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

const AUDIENCE_KEYWORDS = {
  "toda-la-poblacion": [
    "toda la población",
    "cualquier persona",
    "abierto a cualquier persona",
    "público",
  ],
  infancia: [
    "guarderías",
    "guarderias",
    "colegios",
    "atención temprana",
    "atencion temprana",
    "actividades infantiles",
  ],
  adolescencia: [
    "programas educativos",
    "prevención",
    "prevencion",
    "ocio juvenil",
    "apoyo psicosocial",
  ],
  juventud: [
    "formación",
    "formacion",
    "empleo",
    "vivienda joven",
    "actividades juveniles",
  ],
  adultas: [
    "servicios generales",
    "formación",
    "formacion",
    "empleo",
    "atención social",
    "atencion social",
  ],
  mayores: [
    "mayores",
    "centros de día",
    "centros de dia",
    "programas de envejecimiento activo",
    "envejecimiento activo",
  ],
  discapacidad: [
    "servicios especializados",
    "terapias",
    "integración",
    "integracion",
    "apoyo técnico",
    "apoyo tecnico",
    "discapacidad",
  ],
  dependencia: [
    "ayuda a domicilio",
    "teleasistencia",
    "atención personal",
    "atencion personal",
  ],
  cuidadoras: [
    "cuidadoras",
    "respiro familiar",
    "formación para personas cuidadoras",
    "formacion para personas cuidadoras",
    "grupos de apoyo",
    "acompañamiento psicológico",
    "acompanamiento psicologico",
    "orientación sobre cuidados",
    "orientacion sobre cuidados",
  ],
  familias: [
    "apoyo familiar",
    "orientación",
    "orientacion",
    "intervención social",
    "intervencion social",
    "conciliación",
  ],
  migrantes: [
    "asesoramiento",
    "integración",
    "integracion",
    "trámites administrativos",
    "tramites administrativos",
  ],
  "vulnerabilidad-social": [
    "vulnerabilidad social",
    "ayudas económicas",
    "ayudas economicas",
    "alimentos",
    "intervención social",
    "intervencion social",
    "acompañamiento",
  ],
  mujeres: [
    "mujeres",
    "igualdad",
    "violencia de género",
    "violencia de genero",
  ],
};

const filterConfig = [
  { key: NEEDS_FILTER_KEY, label: "¿Qué necesitas?", options: NEEDS_FILTER_OPTIONS },
  { key: WHO_FILTER_KEY, label: "¿Para quién es?", options: WHO_FILTER_OPTIONS },
  { key: WHERE_FILTER_KEY, label: "¿Dónde?", options: WHERE_FILTER_OPTIONS },
  { key: ENTITY_TYPE_FILTER_KEY, label: "Tipo de entidad", options: ENTITY_TYPE_OPTIONS },
  { key: ACCESS_FILTER_KEY, label: "¿Cómo acceder?", options: ACCESS_FILTER_OPTIONS },
  { key: "des_ser", label: "Servicios" },
  { key: "per", label: "Personal" },
];
const resultsPerPage = 12;
const tileLayers = {
  map: {
    label: "Mapa",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
  },
  satellite: {
    label: "Satelite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 20,
  },
};

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 980px)").matches;
}

function createEmptyFilters() {
  return filterConfig.reduce((acc, item) => {
    acc[item.key] = [];
    return acc;
  }, {});
}

function getOptionValue(option) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option) {
  return typeof option === "string" ? option : option.label;
}

function getFilterOptionLabel(filterItem, value) {
  if (!filterItem.options) return value;
  const option = filterItem.options.find((item) => getOptionValue(item) === value);
  return option ? getOptionLabel(option) : value;
}

function getFilterOptions(filterItem, resources) {
  if (filterItem.options) return filterItem.options;
  const values = resources.flatMap((resource) => getValuesFromResource(resource, filterItem.key));
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "es"));
}

function getNormalizedResourceText(resource) {
  const searchableFields = [
    resource.tit,
    resource.amb,
    resource.tip,
    resource.des_ser,
    resource.pob_ate,
    resource.req_acc,
    resource.dir,
  ];

  return searchableFields
      .flatMap((field) => getValuesFromResource({field}, "field"))
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
}

function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function resourceMatchesNeedCategory(resource, category, userPosition) {
  if (category === "toda-la-isla") {
    return true;
  }

  if (category === "cerca-de-mi") {
    if (!userPosition) return false;
    if (typeof resource.lat !== "number" || typeof resource.lng !== "number") return false;
    return getDistanceInMeters(userPosition.lat, userPosition.lng, resource.lat, resource.lng) <= 15000;
  }

  const keywords =
    NEED_KEYWORDS[category] ||
    AUDIENCE_KEYWORDS[category] ||
    LOCATION_KEYWORDS[category] ||
    ENTITY_TYPE_KEYWORDS[category] ||
    ACCESS_KEYWORDS[category];
  if (!keywords) return false;
  const normalizedText = getNormalizedResourceText(resource);
  return keywords.some((keyword) => normalizedText.includes(keyword));
}

function normalizeMarkerIcon(iconName) {
  if (!iconName) return "/assets/icons/map_markers/salud.png";
  return `/assets/icons/map_markers/${iconName}.png`;
}

// Comprueba que lat y lng sean números válidos antes de usarlos en Leaflet
function isValidCoord(lat, lng) {
  return typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
}

function getValuesFromResource(resource, key) {
  const value = resource[key];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

function renderListItems(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <ul>
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return null;
    return (
      <ul>
        {entries.map(([label, link]) => (
          <li key={label}>
            {/* Si el valor contiene @ es un email, si no se trata como teléfono */}
            <a href={link.includes("@") ? `mailto:${link}` : `tel:${link}`}>{label}</a>
          </li>
        ))}
      </ul>
    );
  }

  return <p>{value}</p>;
}

function ResourceSheet({ resource, onClose }) {
  if (!resource) return null;

  return (
    <aside className="resource-sheet" role="dialog" aria-label="Ficha del recurso">
      <div className="resource-sheet-header">
        <h2>{resource.tit}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar ficha">
          Cerrar
        </button>
      </div>

      <section>
        <h3>Datos generales</h3>
        {resource.dir && (
          <div className="sheet-row">
            <strong>Direccion:</strong>
            <p>{resource.dir}</p>
          </div>
        )}
        {resource.tlf && (
          <div className="sheet-row">
            <strong>Telefono:</strong>
            {renderListItems(resource.tlf)}
          </div>
        )}
        {resource.ema && (
          <div className="sheet-row">
            <strong>Correo:</strong>
            {renderListItems(resource.ema)}
          </div>
        )}
        {resource.web && (
          <div className="sheet-row">
            <strong>Sitio web:</strong>
            <p>
              <a href={resource.web} target="_blank" rel="noreferrer">
                {resource.web}
              </a>
            </p>
          </div>
        )}
        {resource.hor && (
          <div className="sheet-row">
            <strong>Horario:</strong>
            {renderListItems(resource.hor)}
          </div>
        )}
      </section>

      <section>
        <h3>Caracterizacion</h3>
        <div className="sheet-grid">
          {resource.amb && (
            <div className="sheet-row">
              <strong>Ambito:</strong>
              <p>{resource.amb}</p>
            </div>
          )}
          {resource.tip && (
            <div className="sheet-row">
              <strong>Tipo:</strong>
              <p>{resource.tip}</p>
            </div>
          )}
          {resource.are_int && (
            <div className="sheet-row">
              <strong>Area de intervencion:</strong>
              {renderListItems(resource.are_int)}
            </div>
          )}
          {resource.req_acc && (
            <div className="sheet-row">
              <strong>¿Cómo acceder?:</strong>
              {renderListItems(resource.req_acc)}
            </div>
          )}
          {resource.pob_ate && (
            <div className="sheet-row">
              <strong>Poblacion atendida:</strong>
              {renderListItems(resource.pob_ate)}
            </div>
          )}
          {resource.per && (
            <div className="sheet-row">
              <strong>Personal:</strong>
              {renderListItems(resource.per)}
            </div>
          )}
          {resource.col_ali && (
            <div className="sheet-row">
              <strong>Colaboraciones o alianzas:</strong>
              <p>{resource.col_ali}</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3>Informacion descriptiva</h3>
        {resource.fin && (
          <div className="sheet-row">
            <strong>Finalidad:</strong>
            {renderListItems(resource.fin)}
          </div>
        )}
        {resource.des_ser && (
          <div className="sheet-row">
            <strong>Descripcion del servicio:</strong>
            {renderListItems(resource.des_ser)}
          </div>
        )}
        {resource.acc_pre_pro && (
          <div className="sheet-row">
            <strong>Acciones de prevencion y/o promocion:</strong>
            {renderListItems(resource.acc_pre_pro)}
          </div>
        )}
      </section>

      <section>
        <h3>Evaluacion y transparencia</h3>
        {resource.eva_rec && (
          <div className="sheet-row">
            <strong>Evaluacion del recurso:</strong>
            <p>{resource.eva_rec}</p>
          </div>
        )}
        {resource.inf_est_dis && (
          <div className="sheet-row">
            <strong>Informes o estadisticas disponibles:</strong>
            <p>{resource.inf_est_dis}</p>
          </div>
        )}
        {resource.tra_cor && (
          <div className="sheet-row">
            <strong>Transparencia corporativa:</strong>
            <p>{resource.tra_cor}</p>
          </div>
        )}
        {resource.mas_dat_int && (
          <div className="sheet-row">
            <strong>Mas datos de interes:</strong>
            <p>{resource.mas_dat_int}</p>
          </div>
        )}
      </section>
    </aside>
  );
}

function FlyToResource({ resource }) {
  const map = useMap();

  useEffect(() => {
    if (!resource) return;
    // No volar si las coordenadas no son válidas
    if (!isValidCoord(resource.lat, resource.lng)) return;
    map.setView([resource.lat, resource.lng], 15, { animate: true });
  }, [map, resource]);

  return null;
}

function PublicMapPage() {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceLabel, setSourceLabel] = useState("api");
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(() => !isMobileViewport());
  const [currentResultsPage, setCurrentResultsPage] = useState(1);
  const [mapViewMode, setMapViewMode] = useState("map");
  const [userPosition, setUserPosition] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationRequesting, setLocationRequesting] = useState(false);

  useEffect(() => {
    const hasLocationFilter = (appliedFilters[WHERE_FILTER_KEY] ?? []).includes("cerca-de-mi");
    if (!hasLocationFilter || userPosition) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocalización no disponible");
      return;
    }

    setLocationRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError("");
        setLocationRequesting(false);
      },
      () => {
        setLocationError("No se pudo obtener la ubicación");
        setLocationRequesting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [appliedFilters, userPosition]);

  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        setLoading(true);
        setError("");
        const response = await fetchResources();

        if (!active) return;
        setResources(response.data);
        setSourceLabel(response.source);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Error cargando datos");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResources();
    return () => {
      active = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    return filterConfig.reduce((acc, filterItem) => {
      acc[filterItem.key] = getFilterOptions(filterItem, resources);
      return acc;
    }, {});
  }, [resources]);

  const resourcesAfterCategoryFilter = useMemo(() => {
    return resources.filter((resource) => {
      return filterConfig.every((filterItem) => {
        const selectedValues = appliedFilters[filterItem.key] ?? [];
        if (selectedValues.length === 0) return true;
        if (
          filterItem.key === NEEDS_FILTER_KEY ||
          filterItem.key === WHO_FILTER_KEY ||
          filterItem.key === WHERE_FILTER_KEY ||
          filterItem.key === ENTITY_TYPE_FILTER_KEY ||
          filterItem.key === ACCESS_FILTER_KEY
        ) {
          return selectedValues.some((value) => resourceMatchesNeedCategory(resource, value, userPosition));
        }
        const resourceValues = getValuesFromResource(resource, filterItem.key);
        if (resourceValues.length === 0) return false;
        return resourceValues.some((value) => selectedValues.includes(value));
      });
    });
  }, [resources, appliedFilters, userPosition]);

  const filteredResources = useMemo(() => {
    // Normaliza quitando tildes y pasando a minúsculas
    const normalize = (str) => str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";
    const term = normalize(search.trim());
    if (!term) return resourcesAfterCategoryFilter;
    return resourcesAfterCategoryFilter.filter((item) => normalize(item.tit).includes(term));
  }, [resourcesAfterCategoryFilter, search]);

  const selectedResource = useMemo(() => {
    if (selectedResourceId === null) return null;
    return filteredResources.find((item) => item.id === selectedResourceId) ?? null;
  }, [filteredResources, selectedResourceId]);

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).reduce((total, values) => total + values.length, 0),
    [appliedFilters]
  );

  const activeFilterChips = useMemo(() => {
    return filterConfig.flatMap((filterItem) =>
      (appliedFilters[filterItem.key] ?? []).map((value) => ({
        key: filterItem.key,
        label: filterItem.label,
        value,
        valueLabel: getFilterOptionLabel(filterItem, value),
      }))
    );
  }, [appliedFilters]);

  const totalResultsPages = useMemo(
    () => Math.max(1, Math.ceil(filteredResources.length / resultsPerPage)),
    [filteredResources.length]
  );

  const pagedResources = useMemo(() => {
    const currentPageSafe = Math.min(currentResultsPage, totalResultsPages);
    const start = (currentPageSafe - 1) * resultsPerPage;
    return filteredResources.slice(start, start + resultsPerPage);
  }, [filteredResources, currentResultsPage, totalResultsPages]);

  useEffect(() => {
    if (currentResultsPage > totalResultsPages) {
      setCurrentResultsPage(totalResultsPages);
    }
  }, [currentResultsPage, totalResultsPages]);

  useEffect(() => {
    setCurrentResultsPage(1);
  }, [search, appliedFilters]);

  function toggleFilter(filterKey, value) {
    setAppliedFilters((prev) => {
      const currentValues = prev[filterKey] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prev, [filterKey]: nextValues };
    });
  }

  function clearFilters() {
    setAppliedFilters(createEmptyFilters());
  }

  function removeActiveFilter(filterKey, value) {
    setAppliedFilters((prev) => ({
      ...prev,
      [filterKey]: (prev[filterKey] ?? []).filter((item) => item !== value),
    }));
  }

  function handleResourceSelect(resourceId) {
    setSelectedResourceId(resourceId);
    if (isMobileViewport()) setIsResultsPanelOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <h1>Guia de Recursos El Hierro</h1>
          <p className="meta">Origen de datos: {sourceLabel}</p>
        </div>
        <div className="search-block">
          <input
            type="text"
            placeholder="Buscar recurso..."
            aria-label="Buscar recurso por nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="actions-block">
          <button
            type="button"
            aria-label={`Abrir filtros. ${activeFilterCount} activos`}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            Filtros ({activeFilterCount})
          </button>
          <button
            type="button"
            aria-label={isResultsPanelOpen ? "Ocultar panel de resultados" : "Mostrar panel de resultados"}
            onClick={() => setIsResultsPanelOpen((prev) => !prev)}
          >
            {isResultsPanelOpen ? "Ocultar resultados" : "Ver resultados"}
          </button>
          <Link className="admin-link" to="/admin">
            Acceso interno
          </Link>
        </div>
      </header>

      <div className="status-strip">
        <p>Resultados: {filteredResources.length} | Pagina {currentResultsPage}/{totalResultsPages}</p>
        <div className="map-view-toggle" role="group" aria-label="Cambiar vista del mapa">
          <button
            type="button"
            className={mapViewMode === "map" ? "active" : ""}
            onClick={() => setMapViewMode("map")}
          >
            Mapa
          </button>
          <button
            type="button"
            className={mapViewMode === "satellite" ? "active" : ""}
            onClick={() => setMapViewMode("satellite")}
          >
            Satelite
          </button>
        </div>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="active-chips-bar">
          {activeFilterChips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              className="active-chip"
              onClick={() => removeActiveFilter(chip.key, chip.value)}
            >
              {chip.label}: {chip.valueLabel} ×
            </button>
          ))}
        </div>
      )}

      {loading && <p className="floating-message">Cargando recursos...</p>}
      {locationRequesting && <p className="floating-message">Obteniendo ubicación...</p>}
      {locationError && <p className="floating-message error">{locationError}</p>}
      {error && <p className="floating-message error">{error}</p>}

      <aside className={isFilterDrawerOpen ? "filters-drawer open" : "filters-drawer"}>
        <div className="filters-header-row">
          <h2>Filtros</h2>
          <button type="button" className="ghost" onClick={() => setIsFilterDrawerOpen(false)}>
            Cerrar
          </button>
        </div>
        <p className="meta">{activeFilterCount} seleccionados</p>
        <div className="filters-actions">
          <button type="button" aria-label="Limpiar todos los filtros" onClick={clearFilters} className="ghost">
            Limpiar
          </button>
        </div>
        {filterConfig.map((filterItem) => (
          <details key={filterItem.key} className="filter-group">
            <summary>
              {filterItem.label}
              <span className="chip">{(appliedFilters[filterItem.key] ?? []).length}</span>
            </summary>
            <div className="options-grid">
              {(filterOptions[filterItem.key] ?? []).map((option) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                return (
                  <button
                    key={optionValue}
                    type="button"
                    className={(appliedFilters[filterItem.key] ?? []).includes(optionValue) ? "option active" : "option"}
                    onClick={() => toggleFilter(filterItem.key, optionValue)}
                  >
                    {optionLabel}
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </aside>

      {isFilterDrawerOpen && <div className="drawer-overlay" onClick={() => setIsFilterDrawerOpen(false)} />}

      {isResultsPanelOpen && (
        <aside className="results-panel">
          <ul className="resource-list">
            {pagedResources.map((resource) => (
              <li key={resource.id}>
                <button type="button" onClick={() => handleResourceSelect(resource.id)}>
                  {resource.tit}
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

      <main className="map-wrapper">
        <MapContainer center={defaultCenter} zoom={11} className="map">
          <TileLayer
            attribution={tileLayers[mapViewMode].attribution}
            url={tileLayers[mapViewMode].url}
            maxZoom={tileLayers[mapViewMode].maxZoom}
          />
          {filteredResources.map((resource) => {
            // Omitir marcadores con coordenadas inválidas
            if (!isValidCoord(resource.lat, resource.lng)) return null;

            const icon = L.icon({
              iconUrl: normalizeMarkerIcon(resource.map_marker_icon),
              iconSize: [32, 37],
              iconAnchor: [16, 37],
            });

            return (
              <Marker
                key={resource.id}
                position={[resource.lat, resource.lng]}
                icon={icon}
                eventHandlers={{ click: () => setSelectedResourceId(resource.id) }}
              >
                <Popup>
                  <strong>{resource.tit}</strong>
                  <br />
                  {resource.dir}
                </Popup>
              </Marker>
            );
          })}
          <FlyToResource resource={selectedResource} />
        </MapContainer>
        <ResourceSheet resource={selectedResource} onClose={() => setSelectedResourceId(null)} />
      </main>
    </div>
  );
}

export default PublicMapPage;
