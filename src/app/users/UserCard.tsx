"use client";

import Link from "next/link";

interface UserCardProps {
    id: number;
    nombre: string;
    email: string;
    parcelasCount: number;
}

export default function UserCard({ id, nombre, email, parcelasCount }: UserCardProps) {
    return (
        <Link
            href={`/user/${id}`}
            className="flex flex-col gap-1 p-5 border border-slate-200 rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 no-underline text-inherit"
        >
            <h2 className="text-lg font-semibold m-0">{nombre}</h2>
            <p className="text-sm text-slate-500 m-0">{email}</p>
            <span className="mt-2 self-start text-xs font-medium text-white bg-blue-500 rounded-full px-3 py-0.5">
                {parcelasCount} {parcelasCount === 1 ? "parcela" : "parcelas"}
            </span>
        </Link>
    );
}
