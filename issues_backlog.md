# Backlog de Tareas - Guía de Recursos

Este documento centraliza las tareas pendientes y en curso para la mejora de la Guía de Recursos.

## Tareas

### 1. Estandarización de Filtros de Acceso
- **Descripción**: Renombrar "Requisitos de acceso" a "¿Cómo acceder?" y estandarizar las opciones (Libre acceso, Cita previa, Derivación profesional, Valoración técnica, Requisitos administrativos).
- **Estado**: Completada
- **Prioridad**: Alta

---

### 2. Mejora y Personalización de Iconos de Mapa
- **Descripción**: Equilibrar el tamaño de los iconos, proponer un nuevo tipo de icono para las "Personas Recurso" (evitando que sean solo puntos de color) e integrar nuevos iconos según la propuesta de la coordinadora.
- **Estado**: Completada
- **Prioridad**: Media

---

### 3. Corrección de búsqueda sin tildes
- **Descripción**: El filtro de búsqueda no encontraba recursos al escribir sin tildes (ej: "medico" no encontraba "médico"). Se normaliza el texto eliminando diacríticos antes de comparar.
- **Estado**: Completada
- **Prioridad**: Media

---

### 4. Bugs críticos detectados por análisis de código

#### 4.1 CircleMarker no importado
- **Descripción**: `<CircleMarker>` se usa en `InternalPeopleGuidePage.jsx` pero no está importado. Rompe la página cuando una trabajadora accede al mapa interno.
- **Estado**: Completada
- **Prioridad**: Alta

#### 4.2 Marcadores sin validación de coordenadas
- **Descripción**: `position={[resource.lat, resource.lng]}` sin comprobar si son null/undefined. Si un recurso no tiene coordenadas Leaflet rompe la página entera.
- **Estado**: Completada
- **Prioridad**: Alta

#### 4.3 Email renderizado como tel:
- **Descripción**: En `PublicMapPage.jsx` los enlaces de contacto usan siempre `href="tel:"` aunque el valor sea un email.
- **Estado**: Completada
- **Prioridad**: Alta

---

### 5. Bugs de lógica incorrecta

#### 5.1 Keyword "no" en libre-acceso
- **Descripción**: La keyword `"no"` en el filtro de libre acceso genera falsos positivos en cualquier texto que contenga "no" (contacto, información...).
- **Estado**: Completada
- **Prioridad**: Media

#### 5.2 selectedResource se busca en filteredResources
- **Descripción**: Si el usuario selecciona un recurso y cambia los filtros, la ficha lateral desaparece. Debería buscarse en todos los recursos.
- **Estado**: Completada
- **Prioridad**: Media

#### 5.3 Fallback silencioso a mock en login
- **Descripción**: Si la API real falla, el login cae al mock sin avisar. Un usuario puede autenticarse con credenciales de demo con API real configurada.
- **Estado**: Completada
- **Prioridad**: Media

#### 5.4 Array vacío de API tratado como fallo
- **Descripción**: En `internalPeopleApi.js`, si la API devuelve 0 resultados (válido), cae al mock como si fuera un error.
- **Estado**: Completada
- **Prioridad**: Media

---

### 6. Problemas de seguridad

#### 6.1 Credenciales hardcodeadas en bundle
- **Descripción**: Contraseñas de usuarios mock incluidas en el bundle JavaScript público. Cualquiera puede leerlas inspeccionando el bundle.
- **Estado**: Pendiente (consultar con Sergio, posiblemente pdt x bd mas back)
- **Prioridad**: Alta

#### 6.2 Token mock predecible
- **Descripción**: El token `mock-token-${username}` es trivialmente falsificable.
- **Estado**: Pendiente (consultar con Sergio, posiblemente pdt x bd mas back)
- **Prioridad**: Alta

#### 6.3 Datos personales en localStorage sin protección
- **Descripción**: Nombres, teléfonos y emails de usuarias se guardan en texto plano en localStorage.
- **Estado**: Pendiente (consultar con Sergio, posiblemente pdt x bd mas back) 
- **Prioridad**: Alta

---

### 7. Mejoras propuestas

#### 7.1 Colores de tipos de persona todos en negro
- **Descripción**: `peopleTypeColors` tiene #000000 para los tres tipos, la leyenda del mapa es inútil.
- **Estado**: Completada
- **Prioridad**: Media

#### 7.2 Código duplicado entre páginas
- **Descripción**: Funciones como `normalizePersonIcon`, `getValuesFromResource`, `isMobileViewport` están copiadas en múltiples páginas. Extraer a módulos compartidos.
- **Estado**: Completada
- **Prioridad**: Baja

#### 7.3 FlyToResource sin validación de coordenadas
- **Descripción**: Si el recurso seleccionado no tiene coordenadas válidas, `map.setView` recibe undefined y Leaflet puede fallar.
- **Estado**: Completada
- **Prioridad**: Media

#### 7.4 Búsqueda en admin sin normalización de tildes
- **Descripción**: El filtro de búsqueda en `AdminPortalPage.jsx` no normaliza tildes, a diferencia del resto de la app.
- **Estado**: Completada
- **Prioridad**: Media

---

### 8. Mejoras visuales en Guía Interna de Personas
- **Descripción**: Corrección de colores en leyenda del mapa (usaban negro en lugar de los colores reales por tipo), límite de ancho en formulario de persona-recurso y ajuste de layout del grid interno.
- **Estado**: Completada
- **Prioridad**: Media

---

### 9. Layout mapa junto al formulario en InternalPeopleGuidePage
- **Descripción**: El mapa aparecía debajo del formulario en lugar de al lado. Se rediseñó el grid a 3 columnas (lista | formulario | mapa) con el mapa sticky y altura fija para que Leaflet lo renderice correctamente.
- **Estado**: Completada
- **Prioridad**: Media

---

### 10. Agente de Matchmaking con IA
- **Descripción**: Sugerir recursos cercanos a una usuaria usando la API de Claude. Implementado en `src/services/matchmakingApi.js` con cálculo de distancia Haversine (radio 20 km) y panel de resultados integrado en la ficha de persona, disponible en ambos modos (consulta y gestión). La llamada a la API pasa por el proxy de Vite para evitar CORS.
- **Estado**: Implementada (pendiente de activar en producción la API) .
- **Prioridad**: Media
- **Pendiente**: Configurar `VITE_ANTHROPIC_API_KEY` en `.env` (nunca subir al repo). En producción mover la llamada a un endpoint de backend para no exponer la key en el bundle. Mientras tanto muestra mensaje informativo al usuario.

---

### 11. Regresión bug 5.1: keyword "no" sigue en InternalMapPage.jsx

- **Descripción**: `ACCESS_KEYWORDS["libre-acceso"]` en `InternalMapPage.jsx` (línea 22) sigue incluyendo `"no"` como keyword, generando los mismos falsos positivos del bug 5.1. El fix se aplicó en `PublicMapPage.jsx` pero no se propagó a `InternalMapPage.jsx`.
- **Estado**: Completada
- **Prioridad**: Media

---

### 12. InternalMapPage: marcadores de recursos sin validación de coordenadas

- **Descripción**: En `InternalMapPage.jsx` los `<Marker>` de recursos (líneas 425–450) se renderizan sin comprobar `isValidCoord(resource.lat, resource.lng)`. Si un recurso carece de coordenadas válidas, Leaflet lanza un error y rompe la página. El mismo patrón ya se corrigió en las otras páginas (bug 4.2), pero quedó sin aplicar aquí.
- **Estado**: Completada
- **Prioridad**: Alta

---

### 13. MatchmakingPanel definido dentro del componente padre

- **Descripción**: `MatchmakingPanel` se declara como función dentro de `InternalPeopleGuidePage` (línea 253). React crea una referencia de componente nueva en cada render del padre, forzando un remount completo del panel en cada interacción. Debe extraerse fuera del componente padre como componente de nivel módulo, recibiendo los estados necesarios por props.
- **Estado**: Completada
- **Prioridad**: Media

---

### 14. Estado de matchmaking no se limpia al cambiar de persona

- **Descripción**: Al abrir la ficha de una persona distinta (`openPersonSheet`), `matchSuggestions` y `matchError` del estado anterior permanecen visibles. El usuario ve sugerencias de IA de la persona anterior hasta que lanza una nueva consulta. Debería limpiarse al cambiar de persona seleccionada.
- **Estado**: Completada
- **Prioridad**: Media

---

### 15. Botones toggle sin aria-pressed

- **Descripción**: Los botones de filtro tipo toggle (filtros de recursos, vista mapa/satélite, tipos de persona) indican su estado activo solo mediante clase CSS. Sin `aria-pressed="true/false"`, los lectores de pantalla no comunican si el botón está activado o desactivado. Afecta a `PublicMapPage.jsx`, `InternalMapPage.jsx` e `InternalPeopleGuidePage.jsx`.
- **Estado**: Completada
- **Prioridad**: Media

---

### 16. Drawer overlay inaccesible desde teclado

- **Descripción**: El `<div className="drawer-overlay">` solo responde a eventos `onClick`. Usuarios de teclado no pueden cerrar el drawer con Escape ni haciendo clic en el fondo. Falta añadir `role="button"`, `aria-label="Cerrar filtros"` y un listener `onKeyDown` para la tecla Escape (o manejar el foco correctamente con un trap de foco dentro del drawer). Afecta a `PublicMapPage.jsx` e `InternalMapPage.jsx`.
- **Estado**: Completada
- **Prioridad**: Media

---

### 17. Funciones helper duplicadas pendientes de extraer a mapUtils.js

- **Descripción**: Tras el refactor de la tarea 7.2 quedan duplicaciones sin resolver:
  - `normalizeMarkerIcon`: copiada en `PublicMapPage.jsx` e `InternalMapPage.jsx` (no existe en `mapUtils.js`).
  - `isValidCoord`: copiada en `PublicMapPage.jsx` e `InternalPeopleGuidePage.jsx` (no existe en `mapUtils.js`).
  - `getValuesFromResource`: copiada en `PublicMapPage.jsx` e `InternalMapPage.jsx` (no existe en `mapUtils.js`).
  - `renderArrayItems`: copiada en `InternalMapPage.jsx` e `InternalPeopleGuidePage.jsx`.
  - `PEOPLE_LABELS`: duplicada en `InternalMapPage.jsx` e `InternalPeopleGuidePage.jsx`.
- **Estado**: Pendiente
- **Prioridad**: Baja

---

### 18. L.icon() instanciado en cada render del mapa

- **Descripción**: En `PublicMapPage.jsx` (línea 1051) e `InternalMapPage.jsx` (línea 429), `L.icon({...})` se crea dentro del `.map()` del JSX, generando un nuevo objeto por marcador en cada render del componente. Con un catálogo grande de recursos esto supone trabajo innecesario. Los iconos deberían memoizarse (por ejemplo con un `Map<iconName, L.Icon>` o `useMemo`).
- **Estado**: Pendiente
- **Prioridad**: Baja

---

### 19. Validación de lat/lng antes de submit en formularios de edición

- **Descripción**: En `handleSave` de `InternalPeopleGuidePage.jsx` y `AdminPortalPage.jsx`, `Number(form.lat)` devuelve `0` si el campo está vacío y `NaN` si contiene texto no numérico — ambos son inválidos para Leaflet y para la API. Los atributos `required` de HTML no previenen todos los casos (p. ej., valor `0` pasa la validación nativa). Falta añadir una comprobación explícita de que las coordenadas son números finitos en rango válido antes de enviar.
- **Estado**: Completada
- **Prioridad**: Media

---

### 20. resource.web renderizado sin validación de protocolo

- **Descripción**: En `PublicMapPage.jsx` (línea 595), `<a href={resource.web}>` se renderiza directamente sin verificar que la URL sea segura. Si el dato contiene `javascript:` u otro protocolo peligroso, es un vector XSS. Debería validarse que `resource.web` comience por `https://` o `http://` antes de usarlo como href (o usar `rel="noreferrer noopener"` y filtrar protocolos no-http).
- **Estado**: Completada
- **Prioridad**: Media

---

### 21. isMobileViewport() no se actualiza al redimensionar la ventana

- **Descripción**: `isResultsPanelOpen` se inicializa una vez con `isMobileViewport()` pero no hay ningún listener de `resize`/`matchMedia` que lo actualice. Si el usuario rota el dispositivo o redimensiona la ventana entre móvil y escritorio, el panel de resultados queda en un estado inconsistente. Debería suscribirse al cambio de media query o recalcular en el efecto adecuado.
- **Estado**: Pendiente
- **Prioridad**: Baja

---

### 22. ID de modelo Claude desactualizado en matchmakingApi.js

- **Descripción**: `matchmakingApi.js` (línea 86) usa `"claude-sonnet-4-20250514"`, que no es un ID de modelo válido en la API de Anthropic. El identificador correcto para Claude Sonnet 4.5 es `"claude-sonnet-4-5-20251001"`. Con el ID incorrecto las llamadas a la API fallarán con un error 404/400 en producción.
- **Estado**: Completada
- **Prioridad**: Alta

---

### 23. activeFilterCount en InternalMapPage cuenta filtros de persona incorrectamente

- **Descripción**: `InternalMapPage.jsx` (líneas 226–230) suma los tipos de persona cuyo filtro es `true` (activos/visibles). En el estado inicial los tres están a `true`, por lo que el contador arranca en 3 aunque no haya ningún filtro aplicado. Debería contar los tipos desactivados (los que no se muestran), o bien excluir el conteo de personas del indicador de filtros activos.
- **Estado**: Pendiente
- **Prioridad**: Baja

### 24. Leyenda de iconos en mapa interno (InternalMapPage)
**Descripción:** Añadido panel de leyenda flotante en la esquina inferior derecha del mapa interno. Muestra el icono y la etiqueta de cada tipo de marcador (personas y recursos). El panel es plegable para no tapar el mapa. Solicitado por la coordinadora vía ClickUp ("LEYENDA EN MAPA INTERNO").
**Estado:** Completada
**Prioridad:** Media
**Archivos modificados:** `src/pages/InternalMapPage.jsx`
**Nota:** Los nombres de archivo de los iconos de recursos (salud.png, educacion.png, etc.) deben coincidir exactamente con los que existan en `/public/assets/icons/map_markers/`. Verificar en despliegue y ajustar LEGEND_ITEMS si algún icono no carga.