import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../prisma/prisma_client";
import type { ParcelaData, RecintoData } from "./types";
import MapWrapper from "./MapWrapper";

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

export default async function UserMapPage({ params }: { params: Promise<{ id: string }> }) {
    //Validacion del usuario
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) notFound();

    const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombre: true },
    });
    if (!usuario) notFound();

    //Consulta de parcelas y recintos del usuario
    const parcelas = await prisma.$queryRaw<ParcelaRaw[]>`
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

    const recintos = await prisma.$queryRaw<RecintoRaw[]>`
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

    //Transformacion de datos para el frontend
    const parcelasData: ParcelaData[] = parcelas.map((p) => ({
        id: p.id,
        geom: p.geom,
        municipio: p.municipio,
        provincia: p.provincia,
        recintos_count: p.recintos_count,
    }));

    const recintoData: RecintoData[] = recintos.map((r) => ({
        id: r.id,
        geom: r.geom,
        cultivo: r.cultivo,
        fechaSiembra: r.fechaSiembra.toISOString(),
        fechaCosecha: r.fechaCosecha?.toISOString() ?? null,
        parcelaId: r.parcelaId,
    }));
    
    // Renderizado de la pagina
    return (
        <div className="h-screen flex flex-col">
            <header className="flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
                <Link href="/users" className="text-sm text-slate-500 hover:text-slate-800">
                    ← Usuarios
                </Link>
                <h1 className="text-lg font-semibold">{usuario.nombre}</h1>
            </header>
            <div className="flex-1 min-h-0">
                <MapWrapper parcelas={parcelasData} recintos={recintoData} />
            </div>
        </div>
    );
}
