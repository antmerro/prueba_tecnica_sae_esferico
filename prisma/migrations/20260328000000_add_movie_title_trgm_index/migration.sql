-- Habilita la extensión pg_trgm necesaria para índices GIN de trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN sobre el título de las películas para acelerar búsquedas ILIKE
-- con wildcards (% prefijo y sufijo), que no pueden usar índices B-tree estándar
CREATE INDEX "Movie_title_idx" ON "Movie" USING GIN (title gin_trgm_ops);
