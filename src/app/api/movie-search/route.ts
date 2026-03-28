import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchMovies } from "../../../lib/queries/movies";

// Esquema de validación de los parámetros de entrada.
// El límite de 500 caracteres en 'q' protege contra entradas grandes que saturarían el modelo.
const querySchema = z.object({
    q: z.string().min(1, "El parámetro 'q' es obligatorio").max(500, "La consulta no puede superar los 500 caracteres"),
    limit: z.coerce.number().int().min(1).max(20).default(5),
});

/**
 * GET /api/movie-search
 *
 * Devuelve las N películas más similares semánticamente al texto de la consulta,
 * usando similitud coseno sobre los embeddings almacenados en pgvector.
 *
 * @param q     - Texto libre de búsqueda (obligatorio)
 * @param limit - Número de resultados a devolver, 1–20 (por defecto: 5)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;

    const parsed = querySchema.safeParse({
        q: searchParams.get("q"),
        limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues },
            { status: 400 }
        );
    }

    const { q, limit } = parsed.data;
    const results = await searchMovies(q, limit);

    return NextResponse.json({ results });
}
