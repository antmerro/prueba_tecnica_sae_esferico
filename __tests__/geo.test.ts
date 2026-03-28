import { parseCoords, computeBounds } from "../src/lib/geo";
import type { ParcelaData, RecintoData } from "../src/lib/types";

// Utilidad para construir un GeoJSON de polígono a partir de un array de coordenadas
function makeGeom(coords: [number, number][]): string {
    return JSON.stringify({ type: "Polygon", coordinates: [coords] });
}

describe("parseCoords", () => {
    // Comprueba que la función invierte el orden de las coordenadas:
    // PostGIS devuelve [longitud, latitud] y Leaflet espera [latitud, longitud]
    it("invierte [longitud, latitud] del GeoJSON a [latitud, longitud] para Leaflet", () => {
        const geom = makeGeom([
            [-2.5, 37.2],
            [-2.4, 37.2],
            [-2.4, 37.3],
            [-2.5, 37.3],
            [-2.5, 37.2],
        ]);

        const result = parseCoords(geom);

        expect(result).toEqual([
            [37.2, -2.5],
            [37.2, -2.4],
            [37.3, -2.4],
            [37.3, -2.5],
            [37.2, -2.5],
        ]);
    });
});

describe("computeBounds", () => {
    // Comprueba que el bounding box calculado engloba todos los vértices
    // de las parcelas y los recintos pasados como entrada.
    // El recinto está contenido dentro de la parcela, por lo que los límites
    // exteriores deben coincidir con los de la parcela
    it("devuelve el bounding box que engloba todas las parcelas y recintos", () => {
        // Límites geográficos de la parcela de prueba (coordenadas en grados decimales)
        const parcelaLatMin = 37.0; // borde sur
        const parcelaLatMax = 37.1; // borde norte
        const parcelaLonMin = -2.0; // borde oeste
        const parcelaLonMax = -1.9; // borde este

        // GeoJSON en formato PostGIS: cada vértice es [longitud, latitud]
        // El polígono cierra repitiendo el primer vértice al final
        const parcelas: ParcelaData[] = [
            {
                id: 1,
                geom: makeGeom([
                    [parcelaLonMin, parcelaLatMin], // esquina suroeste
                    [parcelaLonMax, parcelaLatMin], // esquina sureste
                    [parcelaLonMax, parcelaLatMax], // esquina noreste
                    [parcelaLonMin, parcelaLatMax], // esquina noroeste
                    [parcelaLonMin, parcelaLatMin], // cierre del polígono
                ]),
                municipio: "Almería",
                provincia: "Almería",
                recintos_count: 1,
            },
        ];

        const recintos: RecintoData[] = [
            {
                id: 10,
                // Este recinto está contenido dentro de la parcela, no amplía el bounding box
                geom: makeGeom([[-1.95, 37.02], [-1.92, 37.02], [-1.92, 37.08], [-1.95, 37.08], [-1.95, 37.02]]),
                cultivo: "Tomate",
                fechaSiembra: "2024-03-01T00:00:00.000Z",
                fechaCosecha: null,
                parcelaId: 1,
            },
        ];

        // computeBounds devuelve [[latMin, lonMin], [latMax, lonMax]]
        const [[latMin, lonMin], [latMax, lonMax]] = computeBounds(parcelas, recintos);

        // El bounding box debe coincidir con los límites exteriores de la parcela
        expect(latMin).toBeCloseTo(parcelaLatMin);
        expect(lonMin).toBeCloseTo(parcelaLonMin);
        expect(latMax).toBeCloseTo(parcelaLatMax);
        expect(lonMax).toBeCloseTo(parcelaLonMax);
    });
});
