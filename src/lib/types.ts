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

export type MovieResult = {
    id: number;
    title: string;
    description: string;
    score: number; // similitud coseno ∈ [0, 1]: cuanto más alto, más parecido
};

export type MovieSuggestion = {
    title: string;
    description: string;
};
