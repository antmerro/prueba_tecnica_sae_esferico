import { prisma } from "../../../prisma/prisma_client";

/**
 * Returns all users ordered by id, including their profile image
 * and the number of associated parcelas.
 *
 * @returns Array of users with name, email, profile image and parcela count.
 */
export async function getUsuarios() {
    return prisma.usuario.findMany({
        select: {
            id: true,
            nombre: true,
            email: true,
            perfil: { select: { imagen: true } },
            _count: {
                select: { parcelas: true },
            },
        },
        orderBy: { id: "asc" },
    });
}
