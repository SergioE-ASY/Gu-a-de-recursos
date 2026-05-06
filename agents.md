# Agentes de IA - Guía de Recursos

Este documento define la arquitectura de agentes de Inteligencia Artificial diseñados para potenciar, mantener y automatizar la gestión de la "Guía de Recursos". Estos agentes están especializados en diferentes áreas del ciclo de vida del dato social.

---

## 1. Agente de Curación y Calidad (Data Curation Agent)

**Misión:** Mantener la base de datos limpia, precisa y geolocalizada correctamente.

### Responsabilidades
- **Validación Geoespacial**: Verificar que las coordenadas (Lat/Lng) coincidan con la zona declarada.
- **Detección de Duplicados**: Identificar recursos o personas duplicadas basándose en similitud semántica de descripciones y datos de contacto.
- **Enriquecimiento de Fichas**: Completar información faltante (email, teléfono, horario) buscando en fuentes públicas cuando sea posible.
- **Detección de Enlaces Rotos**: Validar periódicamente que los sitios web de los recursos sigan activos.

---

## 2. Agente de Descubrimiento (Resource Discovery Agent)

**Misión:** Expandir proactivamente la red de recursos detectando nuevas iniciativas sociales y comunitarias.

### Responsabilidades
- **Scraping Dirigido**: Monitorizar boletines oficiales, sitios web municipales y redes sociales locales en busca de nuevos servicios.
- **Propuesta de Borradores**: Generar automáticamente una ficha de "Recurso Potencial" para que la coordinadora la valide.
- **Categorización Automática**: Clasificar nuevos descubrimientos según el ámbito (Salud, Educación, Ocio, etc.) analizando su descripción.

---

## 3. Agente de Matchmaking Social (Smart Connector Agent)

**Misión:** Conectar las necesidades de las usuarias con los recursos y personas más adecuados.

### Responsabilidades
- **Análisis de Necesidades**: Procesar el campo `datosBasicos` de las usuarias para extraer palabras clave y perfiles de necesidad.
- **Sugerencia de Conexiones**: Recomendar "Personas Recurso" o "Centros" basándose en el historial de acuerdos exitosos y cercanía geográfica.
- **Optimización de Rutas**: Sugerir el recurso más cercano y adecuado para minimizar desplazamientos.

---

## 4. Agente de Análisis e Insights (Network Insights Agent)

**Misión:** Proporcionar una visión macro del estado de la red de recursos para la toma de decisiones estratégicas.

### Responsabilidades
- **Identificación de Silos**: Detectar zonas geográficas con alta demanda (usuarias) pero baja densidad de recursos.
- **Reportes de Evolución**: Generar resúmenes mensuales de crecimiento de la red y efectividad de las relaciones activas.
- **Predicción de Necesidades**: Alertar sobre posibles sobrecargas en recursos críticos según las tendencias de registro.

---

## Flujo de Trabajo Recomendado

1. **Entrada de Datos**: Cualquier nuevo registro (vía formulario o discovery agent) pasa por el **Agente de Curación**.
2. **Alertas de Gestión**: El **Agente de Matchmaking** notifica a la coordinadora si encuentra una conexión ideal para una nueva usuaria.
3. **Revisión Estratégica**: Mensualmente, el **Agente de Insights** prepara un informe para la dirección sobre el impacto social de la guía.
