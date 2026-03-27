import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../prisma/prisma_client";
import { getParcelasByUsuario, getRecintosByUsuario } from "../../../lib/queries/parcelas";
import MapWrapper from "./MapWrapper";

export default async function UserMapPage({ params }: { params: Promise<{ id: string }> }) {
    // Validacion del usuario
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) notFound();

    const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombre: true },
    });
    if (!usuario) notFound();

    // Obtencion de parcelas y recintos del usuario
    const parcelas = await getParcelasByUsuario(userId);
    const recintos = await getRecintosByUsuario(userId);

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
                <MapWrapper parcelas={parcelas} recintos={recintos} />
            </div>
        </div>
    );
}
