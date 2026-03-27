export type ParcelaData = {
    id: number;
    geom: string; // GeoJSON string from ST_AsGeoJSON
    municipio: string;
    provincia: string;
    recintos_count: number;
};

export type RecintoData = {
    id: number;
    geom: string; // GeoJSON string from ST_AsGeoJSON
    cultivo: string;
    fechaSiembra: string; // ISO string
    fechaCosecha: string | null;
    parcelaId: number;
};
