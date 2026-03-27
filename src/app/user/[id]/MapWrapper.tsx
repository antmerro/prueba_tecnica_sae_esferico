"use client";

import dynamic from "next/dynamic";
import type { ParcelaData, RecintoData } from "./types";

const MapView = dynamic(() => import("./MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full text-slate-500">
            Cargando mapa...
        </div>
    ),
});

interface MapWrapperProps {
    parcelas: ParcelaData[];
    recintos: RecintoData[];
}

export default function MapWrapper({ parcelas, recintos }: MapWrapperProps) {
    return <MapView parcelas={parcelas} recintos={recintos} />;
}
