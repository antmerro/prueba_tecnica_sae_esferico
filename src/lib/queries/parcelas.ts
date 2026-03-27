import { prisma } from "../../../prisma/prisma_client";
import type { ParcelaData, RecintoData } from "../types";

type ParcelaRaw = {
    id: number;
    geom: string;
    municipio: string;
    provincia: string;
    recintos_count: number;
};

type RecintoRaw = {
    id: number;
    geom: string;
    cultivo: string;
    fechaSiembra: Date;
    fechaCosecha: Date | null;
    parcelaId: number;
};

/**
 * Returns all parcelas belonging to a user, including their geographic data
 * (municipio, provincia) and the number of recintos they contain.
 * Geometry is serialized as GeoJSON via ST_AsGeoJSON so it can be consumed
 * directly on the client.
 *
 * @param userId - ID of the user who owns the parcelas.
 * @returns Array of parcelas with GeoJSON geometry, location data and recinto count.
 */
export async function getParcelasByUsuario(userId: number): Promise<ParcelaData[]> {
    const rows = await prisma.$queryRaw<ParcelaRaw[]>`
        SELECT
            p.id,
            ST_AsGeoJSON(p.geom) AS geom,
            m.nombre                AS municipio,
            pr.nombre               AS provincia,
            COUNT(r.id)::int        AS recintos_count
        FROM "Parcela" p
        JOIN "Municipio" m  ON m.id  = p."municipioId"
        JOIN "Provincia" pr ON pr.id = m."provinciaId"
        LEFT JOIN "Recinto" r ON r."parcelaId" = p.id
        WHERE p."usuarioId" = ${userId}
        GROUP BY p.id, m.nombre, pr.nombre
    `;

    return rows.map((p) => ({
        id: p.id,
        geom: p.geom,
        municipio: p.municipio,
        provincia: p.provincia,
        recintos_count: p.recintos_count,
    }));
}

/**
 * Returns all recintos belonging to a user's parcelas, including the associated
 * crop and the sowing and harvest dates.
 * Dates are converted to ISO strings so they can be serialized from a
 * Server Component to the client.
 *
 * @param userId - ID of the user whose parcelas are used as the filter.
 * @returns Array of recintos with GeoJSON geometry, crop name and ISO-formatted dates.
 */
export async function getRecintosByUsuario(userId: number): Promise<RecintoData[]> {
    const rows = await prisma.$queryRaw<RecintoRaw[]>`
        SELECT
            r.id,
            ST_AsGeoJSON(r.geom) AS geom,
            c.nombre             AS cultivo,
            r."fechaSiembra",
            r."fechaCosecha",
            r."parcelaId"
        FROM "Recinto" r
        JOIN "Cultivo" c ON c.id = r."cultivoId"
        JOIN "Parcela" p ON p.id = r."parcelaId"
        WHERE p."usuarioId" = ${userId}
    `;

    return rows.map((r) => ({
        id: r.id,
        geom: r.geom,
        cultivo: r.cultivo,
        fechaSiembra: r.fechaSiembra.toISOString(),
        fechaCosecha: r.fechaCosecha?.toISOString() ?? null,
        parcelaId: r.parcelaId,
    }));
}
