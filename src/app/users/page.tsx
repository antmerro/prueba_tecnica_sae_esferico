import { getUsuarios } from "../../lib/queries/usuarios";
import UserCard from "./UserCard";

export default async function UsersPage() {
    const users = await getUsuarios();

    return (
        <main className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-8">Usuarios</h1>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        id={user.id}
                        nombre={user.nombre}
                        email={user.email}
                        imagen={user.perfil?.imagen ?? null}
                        parcelasCount={user._count.parcelas}
                    />
                ))}
            </div>
        </main>
    );
}
