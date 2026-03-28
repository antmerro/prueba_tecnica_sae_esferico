import { render, screen } from "@testing-library/react";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma/prisma_client";
import UserCard from "../src/app/users/UserCard";

type TestUser = { id: number; nombre: string; email: string; password: string };

let user: TestUser;

// Crea un usuario en la BD de test antes de que arranque ningún test
beforeAll(async () => {
    user = await prisma.usuario.create({
        data: {
            nombre: "Ana García",
            email: `test-usercard-${Date.now()}@test.com`,
            password: bcrypt.hashSync("password123", 10),
        },
        select: { id: true, nombre: true, email: true, password: true },
    });
});

// Elimina el usuario de prueba y cierra la conexión con la BD al terminar todos los tests
afterAll(async () => {
    await prisma.usuario.delete({ where: { id: user.id } });
    await prisma.$disconnect();
});

describe("UserCard", () => {
    // Comprueba que la tarjeta muestra los tres campos visibles que el usuario espera ver
    it("renders the user's name, email and parcela count", () => {
        render(<UserCard id={user.id} nombre={user.nombre} email={user.email} imagen={null} parcelasCount={2} />);

        expect(screen.getByRole("heading", { name: user.nombre })).toBeInTheDocument();
        expect(screen.getByText(user.email)).toBeInTheDocument();
        expect(screen.getByText(/2 parcelas/)).toBeInTheDocument();
    });

    // Comprueba que el hash almacenado en la BD nunca aparece en el renderizado
    it("does not expose the hashed password from the database", () => {
        const { container } = render(
            <UserCard id={user.id} nombre={user.nombre} email={user.email} imagen={null} parcelasCount={0} />
        );

        expect(container.innerHTML).not.toContain(user.password);
    });

    // Comprueba que al hacer clic en la tarjeta se navega a la página de mapa correcta del usuario
    it("links to the correct user map route", () => {
        render(<UserCard id={user.id} nombre={user.nombre} email={user.email} imagen={null} parcelasCount={0} />);

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", `/user/${user.id}`);
    });

    // Comprueba la etiqueta singular/plural: "1 parcela" vs "N parcelas"
    it("renders singular 'parcela' when count is 1", () => {
        render(<UserCard id={user.id} nombre={user.nombre} email={user.email} imagen={null} parcelasCount={1} />);

        expect(screen.getByText(/1 parcela$/)).toBeInTheDocument();
    });
});
