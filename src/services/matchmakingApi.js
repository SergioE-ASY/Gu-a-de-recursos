// Calcula distancia en km entre dos puntos (fórmula de Haversine)
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Filtra y ordena recursos con coordenadas válidas por distancia a la persona
function resourcesNearPerson(person, resources, maxKm = 20) {
    return resources
        .filter(
            (r) =>
                typeof r.lat === "number" &&
                typeof r.lng === "number" &&
                !isNaN(r.lat) &&
                !isNaN(r.lng)
        )
        .map((r) => ({
            ...r,
            distanciaKm: haversineKm(person.lat, person.lng, r.lat, r.lng),
        }))
        .filter((r) => r.distanciaKm <= maxKm)
        .sort((a, b) => a.distanciaKm - b.distanciaKm)
        .slice(0, 15); // máximo 15 para no saturar el prompt
}

/**
 * Pide a Claude que sugiera recursos cercanos para una persona.
 * @param {object} person - Objeto persona de la guía interna
 * @param {object[]} resources - Array completo de recursos de la guía pública
 * @returns {Promise<string>} Texto de sugerencias en markdown
 */
export async function suggestMatchingResources(person, resources) {
    // Si no hay API key configurada, avisamos sin hacer el fetch
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
        return "⚠️ Funcionalidad pendiente de configurar. Para activar las sugerencias de IA es necesario configurar una API key de Anthropic (VITE_ANTHROPIC_API_KEY en el archivo .env). Consultar con el equipo técnico.";
    }

    // Sólo usamos recursos cercanos para no exceder el contexto
    const nearbyResources = resourcesNearPerson(person, resources);

    if (nearbyResources.length === 0) {
        return "No se encontraron recursos con coordenadas válidas en un radio de 20 km.";
    }

    // Construimos un resumen compacto de cada recurso para el prompt
    const resourceSummary = nearbyResources
        .map(
            (r, i) =>
                `${i + 1}. "${r.tit}" (${r.distanciaKm.toFixed(1)} km) — Tipo: ${r.tip || "N/A"}, Ámbito: ${r.amb || "N/A"}. ${Array.isArray(r.des_ser) ? r.des_ser.slice(0, 2).join("; ") : ""}`
        )
        .join("\n");

    const prompt = `Eres un asistente de trabajo social en El Hierro (Canarias). 
Tu tarea es sugerir los recursos más adecuados para una persona atendida.

PERSONA:
- Nombre: ${person.nombre}
- Tipo: ${person.tipo}
- Zona: ${person.zona}
- Datos básicos: ${person.datosBasicos || "Sin datos"}
- Relaciones activas: ${(person.relacionesActivas || []).join(", ") || "Ninguna"}

RECURSOS CERCANOS (máx 20 km, ordenados por distancia):
${resourceSummary}

Selecciona los 3-5 recursos más adecuados para esta persona y explica brevemente (1-2 frases cada uno) por qué los recomiendas. 
Responde en español, en formato de lista numerada. Sé conciso y práctico.`;

    const response = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error API (${response.status})`);
    }

    const data = await response.json();

    // Extraemos el texto de la respuesta
    const text = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

    return text;
}