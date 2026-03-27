"use client";

import { MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ParcelaData, RecintoData } from "../../../lib/types";
import { parseCoords, computeBounds } from "../../../lib/geo";

interface MapViewProps {
    parcelas: ParcelaData[];
    recintos: RecintoData[];
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function MapView({ parcelas, recintos }: MapViewProps) {
    if (parcelas.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Este usuario no tiene parcelas registradas.
            </div>
        );
    }

    const bounds = computeBounds(parcelas, recintos);

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [40, 40] }}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {parcelas.map((parcela) => (
                <Polygon
                    key={`parcela-${parcela.id}`}
                    positions={parseCoords(parcela.geom)}
                    pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.2, weight: 2 }}
                >
                    <Tooltip sticky>
                        <div className="text-sm space-y-0.5">
                            <p className="font-semibold">Parcela #{parcela.id}</p>
                            <p>Municipio: {parcela.municipio}</p>
                            <p>Provincia: {parcela.provincia}</p>
                            <p>Recintos: {parcela.recintos_count}</p>
                        </div>
                    </Tooltip>
                </Polygon>
            ))}

            {recintos.map((recinto) => (
                <Polygon
                    key={`recinto-${recinto.id}`}
                    positions={parseCoords(recinto.geom)}
                    pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.35, weight: 2 }}
                >
                    <Tooltip sticky>
                        <div className="text-sm space-y-0.5">
                            <p className="font-semibold">Recinto #{recinto.id}</p>
                            <p>Cultivo: {recinto.cultivo}</p>
                            <p>Siembra: {formatDate(recinto.fechaSiembra)}</p>
                            <p>Cosecha: {recinto.fechaCosecha ? formatDate(recinto.fechaCosecha) : "—"}</p>
                        </div>
                    </Tooltip>
                </Polygon>
            ))}
        </MapContainer>
    );
}
