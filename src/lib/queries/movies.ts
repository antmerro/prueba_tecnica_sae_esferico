import { pipeline } from "@xenova/transformers";
import { prisma } from "../../../prisma/prisma_client";
import type { MovieResult, MovieSuggestion } from "../types";

// Singleton de la pipeline: la promesa se guarda a nivel de módulo para que
// cargas concurrentes reutilicen la misma instancia en lugar de cargar el modelo varias veces.
// El modelo (~23 MB) solo se descarga una vez; las siguientes llamadas son inmediatas.
let extractorPromise: ReturnType<typeof pipeline> | null = null;

function getExtractor() {
    if (!extractorPromise) {
        extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return extractorPromise;
}

/**
 * Devuelve las N películas más similares semánticamente al texto de búsqueda,
 * usando similitud coseno sobre los embeddings almacenados en pgvector.
 *
 * @param q     - Texto libre de búsqueda
 * @param limit - Número máximo de resultados a devolver
 * @returns Array de películas ordenadas por similitud descendente
 */
export async function searchMovies(q: string, limit: number): Promise<MovieResult[]> {
    // Genera el embedding con el mismo modelo y configuración usados en el seed
    // (pooling mean(media) + normalización) para que los vectores sean comparables
    const extractor = await getExtractor();
    const output = await extractor(q, { pooling: "mean", normalize: true });
    const embedding: number[] = Array.from(output.data as Float32Array);

    // pgvector no admite arrays como parámetro bindable, por lo que necesitaremos construir
    // el literal de vector como string y pasarlo mediante $queryRawUnsafe como $1. 
    // Todo para evitar inyecciones SQL.
    const vectorLiteral = `[${embedding.join(",")}]`;

    // El operador <=> calcula la distancia coseno (0 = idéntico, 2 = opuesto).
    // Se devuelve 1 - distancia como score de similitud clásico ∈ [-1, 1];
    // con embeddings normalizados el rango efectivo es ≈ [0, 1].
    return prisma.$queryRawUnsafe<MovieResult[]>(
        `SELECT id, title, description,
                CAST(1 - (embedding <=> $1::vector) AS FLOAT8) AS score
         FROM "Movie"
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        vectorLiteral,
        limit
    );
}

/**
 * Devuelve hasta 6 películas cuyos títulos contienen el texto recibido (sin distinción de mayúsculas).
 * No genera embeddings — usa ILIKE para que la respuesta sea instantánea y apta para caché.
 *
 * @param q - Texto parcial a buscar en los títulos
 * @returns Array de sugerencias con título y descripción
 */
export async function suggestMovies(q: string): Promise<MovieSuggestion[]> {
    // Búsqueda ILIKE con wildcards a ambos lados para coincidencia parcial en cualquier posición.
    return prisma.$queryRaw<MovieSuggestion[]>`
        SELECT title, description FROM "Movie"
        WHERE title ILIKE ${"%" + q + "%"}
        ORDER BY title
        LIMIT 6
    `;
}
