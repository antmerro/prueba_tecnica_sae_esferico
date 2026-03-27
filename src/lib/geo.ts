import type { ParcelaData, RecintoData } from "./types";

/**
 * Converts a GeoJSON geometry (returned by PostGIS ST_AsGeoJSON) into a
 * coordinate array compatible with Leaflet.
 * PostGIS returns coordinates as [longitude, latitude], while Leaflet expects
 * [latitude, longitude], so the order is swapped.
 *
 * @param geom - GeoJSON serialized as a string (output of ST_AsGeoJSON).
 * @returns Array of [latitude, longitude] pairs ready for use in Leaflet.
 */
export function parseCoords(geom: string): [number, number][] {
    const g = JSON.parse(geom) as { coordinates: [number, number][][] };
    return g.coordinates[0].map(([lon, lat]) => [lat, lon]);
}

/**
 * Computes the bounding box that encompasses all given parcelas and recintos,
 * returning the [[latMin, lonMin], [latMax, lonMax]] tuple expected by Leaflet's
 * MapContainer `bounds` prop.
 *
 * @param parcelas - Array of parcelas with GeoJSON geometry.
 * @param recintos - Array of recintos with GeoJSON geometry.
 * @returns Tuple [[latMin, lonMin], [latMax, lonMax]] with the map bounds.
 */
export function computeBounds(
    parcelas: ParcelaData[],
    recintos: RecintoData[]
): [[number, number], [number, number]] {
    const all = [...parcelas, ...recintos].flatMap((f) => parseCoords(f.geom));
    const lats = all.map(([lat]) => lat);
    const lons = all.map(([, lon]) => lon);
    return [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
    ];
}
