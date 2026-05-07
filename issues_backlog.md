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
- **Estado**: Pendiente
- **Prioridad**: Alta

#### 6.2 Token mock predecible
- **Descripción**: El token `mock-token-${username}` es trivialmente falsificable.
- **Estado**: Pendiente
- **Prioridad**: Alta

#### 6.3 Datos personales en localStorage sin protección
- **Descripción**: Nombres, teléfonos y emails de usuarias se guardan en texto plano en localStorage.
- **Estado**: Pendiente
- **Prioridad**: Alta

---

### 7. Mejoras propuestas

#### 7.1 Colores de tipos de persona todos en negro
- **Descripción**: `peopleTypeColors` tiene #000000 para los tres tipos, la leyenda del mapa es inútil.
- **Estado**: Completado
- **Prioridad**: Media

#### 7.2 Código duplicado entre páginas
- **Descripción**: Funciones como `normalizePersonIcon`, `getValuesFromResource`, `isMobileViewport` están copiadas en múltiples páginas. Extraer a módulos compartidos.
- **Estado**: Completada
- **Prioridad**: Baja

#### 7.3 FlyToResource sin validación de coordenadas
- **Descripción**: Si el recurso seleccionado no tiene coordenadas válidas, `map.setView` recibe undefined y Leaflet puede fallar.
- **Estado**: Pendiente
- **Prioridad**: Media

#### 7.4 Búsqueda en admin sin normalización de tildes
- **Descripción**: El filtro de búsqueda en `AdminPortalPage.jsx` no normaliza tildes, a diferencia del resto de la app.
- **Estado**: Completado
- **Prioridad**: Media