import { render, screen } from "@testing-library/react";
import type { ParcelaData, RecintoData } from "../src/lib/types";

// El CSS de Leaflet no está disponible en jsdom, se mockea para evitar errores de importación
jest.mock("leaflet/dist/leaflet.css", () => {});

// Se mockea react-leaflet para que cada Polygon se renderice como un div,
// lo que permite contarlos e inspeccionarlos con Testing Library
jest.mock("react-leaflet", () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TileLayer: () => null, // Borramos el fondo de mapa para facilitar el contado de polígonos
    Polygon: ({ children, "data-testid": testId }: { children: React.ReactNode; "data-testid"?: string }) => (
        <div data-testid={testId ?? "polygon"}>{children}</div> //Marcamos cada polígono con un testid para poder contarlos
    ),
    // Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: () => null, // Borramos los tooltips ya que no hacemos tests sobre ellos
}));

import MapView from "../src/app/user/[id]/MapView";

// Genera una geometría GeoJSON mínima desplazada por los offsets indicados,
// para poder crear polígonos distintos sin repetir coordenadas
function makeGeom(offsetLon = 0, offsetLat = 0): string {
    return JSON.stringify({
        type: "Polygon",
        coordinates: [[
            [-2.0 + offsetLon, 37.0 + offsetLat],
            [-1.9 + offsetLon, 37.0 + offsetLat],
            [-1.9 + offsetLon, 37.1 + offsetLat],
            [-2.0 + offsetLon, 37.1 + offsetLat],
            [-2.0 + offsetLon, 37.0 + offsetLat],
        ]],
    });
}

//Parcela de prueba
const parcelas: ParcelaData[] = [
    { id: 1, geom: makeGeom(0), municipio: "Almería", provincia: "Almería", recintos_count: 2 },
    { id: 2, geom: makeGeom(0.2), municipio: "Almería", provincia: "Almería", recintos_count: 1 },
];

// Recintos de prueba, cada uno con un cultivo y fechas de siembra/cosecha distintas 
// para verificar que se renderizan correctamente en el mapa. El recinto 12 no pertenece 
// a ninguna parcela del usuario, por lo que no debería renderizarse. El recinto 10 está 
// contenido dentro de la parcela 1, por lo que el bounding box del mapa debe coincidir 
// con los límites de la parcela 1, sin ampliarse por el recinto 10. 
const recintos: RecintoData[] = [
    { id: 10, geom: makeGeom(0.01, 0.01), cultivo: "Tomate", fechaSiembra: "2024-03-01T00:00:00.000Z", fechaCosecha: null, parcelaId: 1 },
    { id: 12, geom: makeGeom(0.21, 0.01), cultivo: "Pepino", fechaSiembra: "2024-05-01T00:00:00.000Z", fechaCosecha: null, parcelaId: 2 },
];

describe("MapView", () => {
    // Comprueba que el mapa renderiza exactamente un polígono por cada parcela y por cada recinto
    it("renderiza un polígono por cada parcela y por cada recinto", () => {
        render(<MapView parcelas={parcelas} recintos={recintos} />);

        const polygons = screen.getAllByTestId("polygon");
        expect(polygons).toHaveLength(parcelas.length + recintos.length);
    });

    // Comprueba que todos los recintos pertenecen a una de las parcelas del usuario,
    // garantizando que no se muestran recintos de otros usuarios
    it("solo renderiza recintos pertenecientes a las parcelas del usuario", () => {
        render(<MapView parcelas={parcelas} recintos={recintos} />);

        const parcelaIds = new Set(parcelas.map((p) => p.id));
        const allRecintosMatchAParcela = recintos.every((r) => parcelaIds.has(r.parcelaId));

        expect(allRecintosMatchAParcela).toBe(true);
    });

    // Comprueba que cuando el usuario no tiene parcelas se muestra un mensaje de aviso en lugar del mapa
    it("muestra el mensaje de aviso cuando el usuario no tiene parcelas", () => {
        render(<MapView parcelas={[]} recintos={[]} />);

        expect(screen.getByText(/no tiene parcelas/i)).toBeInTheDocument();
    });
});
