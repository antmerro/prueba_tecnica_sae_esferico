import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { suggestMovies } from "../../../lib/queries/movies";

// Esquema de validación: 'q' obligatorio y acotado a 200 caracteres.
// No se lanza un error 400 si falla — se devuelve lista vacía para no interrumpir el autocompletado.
const querySchema = z.object({
    q: z.string().min(1).max(200),
});

/**
 * GET /api/movie-suggest
 *
 * Devuelve hasta 6 películas cuyos títulos contienen el texto recibido (sin distinción de mayúsculas).
 * No genera embeddings — usa ILIKE para que la respuesta sea instantánea y apta para caché.
 *
 * @param q - Texto parcial a buscar en los títulos
 */
export async function GET(req: NextRequest) {
    const parsed = querySchema.safeParse({
        q: req.nextUrl.searchParams.get("q"),
    });

    // Si la query está vacía o supera el límite, devolvemos lista vacía en lugar de un error
    if (!parsed.success) {
        return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await suggestMovies(parsed.data.q);

    // Los títulos de películas son datos estáticos: se cachea la respuesta 1 hora en el navegador
    // para evitar peticiones repetidas con el mismo prefijo
    return NextResponse.json(
        { suggestions },
        { headers: { "Cache-Control": "public, max-age=3600" } }
    );
}
