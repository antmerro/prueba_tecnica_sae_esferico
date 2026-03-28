# Prueba Técnica - Esférico SAE

## Descripción

Aplicación web desarrollada con Next.js que permite visualizar usuarios y sus parcelas agrícolas en un mapa interactivo, junto con un buscador semántico de películas mediante embeddings y pgvector.

---

## Setup

### Requisitos previos

- Node.js (v20.9 o superior)
- pnpm o npm
- Docker y Docker Compose

### Instalación

1. **Configurar variables de entorno:**

   ```bash
   cp env.development.example .env.development
   cp env.test.example .env.test
   ```

2. **Instalar dependencias:**

   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Levantar la base de datos PostgreSQL con PostGIS y pgvector:**

   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Ejecutar migraciones en la base de datos de desarrollo:**

   ```bash
   pnpm run prisma:migrate:dev
   # o
   npm run prisma:migrate:dev
   ```

5. **Ejecutar migraciones en la base de datos de test:**

   ```bash
   pnpm run prisma:migrate:test
   # o
   npm run prisma:migrate:test
   ```

6. **Generar el cliente de Prisma:**

   ```bash
   pnpm run prisma:generate
   # o
   npm run prisma:generate
   ```

7. **Poblar la base de datos de desarrollo con datos de prueba:**

   ```bash
   pnpm run prisma:seed
   # o
   npm run prisma:seed
   ```

8. **Iniciar el servidor de desarrollo:**

   ```bash
   pnpm run dev
   # o
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`.

---

## Tareas implementadas

### Tarea 1 — Script de seed

**Archivo:** `prisma/seed/seed.ts`

Script que puebla la base de datos con datos de prueba para el dominio agrícola y las películas para el vector search.

- Se insertan 2 provincias (Murcia y Almería) con 6 municipios, 7 usuarios con imagen de avatar, 7 tipos de cultivo, 10 parcelas y 10 recintos con geometrías reales alrededor de la región de Murcia/Almería.
- Las parcelas se insertan con `$queryRaw` y `ST_GeomFromGeoJSON` para recuperar el `id` generado y asociar los recintos. Los recintos se insertan con `$executeRaw` bajo el mismo patrón.
- El séptimo usuario no tiene parcelas asignadas, lo que permite probar el caso "usuario sin parcelas" en tests y en la UI.
- Los recintos están geométricamente contenidos dentro de sus parcelas, validado por el constraint `ST_Within` de la base de datos.
- Se generan embeddings de 384 dimensiones para 50 películas usando `@xenova/transformers` (local) y se insertan en la tabla `Movie` con `$executeRawUnsafe` y el cast `::vector`.

---

### Tarea 2 — Vista de listado de usuarios

**Ruta:** `/users`

Vista con un grid de tarjetas que muestra todos los usuarios de la base de datos.

- Se añade `UsersPage` como Server Component que llama directamente a `getUsuarios()` y renderiza el grid, y `UserCard` como Client Component que envuelve cada tarjeta en un `<Link>` hacia `/user/:id`.
- La query usa `select` explícito que excluye `password` y obtiene el conteo de parcelas con `_count` de Prisma sin consulta adicional.
- Se muestra la imagen de perfil con `<Image>` de Next.js y un badge con el número de parcelas con plural/singular (`"1 parcela"` / `"N parcelas"`).
- Se implementó el modelo `Perfil` para almacenar la URL del avatar; si el usuario no tiene perfil la imagen se omite.

---

### Tarea 3 — Vista de mapa con parcelas y recintos

**Ruta:** `/user/:id`

Vista a pantalla completa con un mapa Leaflet que muestra las parcelas y recintos del usuario seleccionado.

- Se añade la página como Server Component que valida el parámetro `id` y llama a `notFound()` si el usuario no existe, luego pasa los datos a `MapWrapper`.
- Las parcelas se renderizan como polígonos azules y los recintos como polígonos verdes. Al hacer hover aparece un tooltip con municipio, provincia y número de recintos (parcela) o cultivo y fechas de siembra/cosecha (recinto).
- Las geometrías PostGIS se serializan con `ST_AsGeoJSON` en las queries del servidor y se invierten de `[lon, lat]` a `[lat, lon]` para Leaflet mediante `parseCoords`. Las fechas se convierten a ISO string antes de pasar al cliente.
- El mapa se ajusta automáticamente al bounding box de todos los polígonos con `computeBounds`. Si el usuario no tiene parcelas se muestra un mensaje en su lugar.
- Leaflet se carga con `dynamic(..., { ssr: false })` en `MapWrapper` para evitar errores de hidratación.

---

### Tarea 4 — Tests con Jest

**Carpeta:** `__tests__/`

Se implementan 9 tests distribuidos en 3 archivos.

- `UserCard.test.tsx` (4 tests): test de integración que crea y borra un usuario en la BD de test con `beforeAll`/`afterAll`. Verifica que se renderizan nombre, email y contador; que el hash de contraseña no aparece en el HTML; que el link apunta a `/user/:id`; y que el contador usa singular cuando `parcelasCount === 1`.
- `MapView.test.tsx` (3 tests): mockea `react-leaflet` (cada `Polygon` → `<div data-testid="polygon">`) y el CSS de Leaflet para ejecutar en jsdom. Verifica el conteo exacto de polígonos, que todos los recintos pertenecen a parcelas del usuario, y el mensaje de aviso cuando no hay parcelas.
- `geo.test.ts` (2 tests): tests unitarios que verifican la inversión de coordenadas de `parseCoords` (`[lon, lat]` → `[lat, lon]`) y que `computeBounds` calcula el bounding box correcto cuando un recinto está contenido dentro de una parcela.

---

### Tarea 5B — Vector search de películas

**Ruta:** `/movies` | **Endpoints:** `/api/movie-search`, `/api/movie-suggest`

Búsqueda semántica de películas mediante embeddings locales y pgvector.

#### Cómo funciona

Resumen:
- Se añadió la ruta `/movies` para busqueda semantica que ordena las busquedas por un score que aparece a la derecha de los resultados finales.
- Se añade el endpoint `/api/movie-search` que valida la query con Zod, genera el embedding del texto usando `@xenova/transformers` (modelo `all-MiniLM-L6-v2`) y ejecuta la búsqueda vectorial contra pgvector con el operador `<=>`. Devuelve las 8 películas más similares con título, descripción y score.
- Se añade el endpoint `/api/movie-suggest` a modo de mejora de experiencia de usuario con un autocompletado rápido no case sensitive, con caché de 1 hora.
- Se añade un índice GIN de trigramas (`pg_trgm`) sobre `Movie.title` para acelerar las búsquedas `ILIKE` con wildcards.

---

## Arquitectura

```
src/
├── app/
│   ├── users/          # Listado de usuarios (Server Component)
│   ├── user/[id]/      # Mapa de parcelas (Server + Client Components)
│   ├── movies/         # Buscador semántico (Client Component + hook)
│   └── api/
│       ├── movie-search/   # Búsqueda vectorial
│       └── movie-suggest/  # Autocompletado ILIKE
└── lib/
    ├── queries/
    │   ├── usuarios.ts     # Queries de usuarios
    │   ├── parcelas.ts     # Queries geoespaciales
    │   └── movies.ts       # Queries pgvector + singleton de modelo
    ├── geo.ts              # Utilidades de cálculo geoespacial
    └── types.ts            # Tipos compartidos
```

**Decisión de arquitectura — Server Components vs API routes:** Las vistas de usuarios y mapas usan Server Components que llaman directamente a `src/lib/queries/` (sin pasar por HTTP), lo que elimina una capa de latencia y simplifica el código. La página de películas usa una API route porque necesita ejecutar lógica de servidor (generación de embeddings) desde un Client Component.

---

## Modelo de datos

```
Provincia (1) ──── (N) Municipio
                         │
                         │ (1)
                         ▼
Usuario (1) ──── (N) Parcela (1) ──── (N) Recinto (N) ──── (1) Cultivo
   │
   └──── (1) Perfil

Movie (independiente — búsqueda semántica)
```

---

## Tecnologías

- **Framework:** Next.js 15 (App Router, Server Components)
- **ORM:** Prisma 7
- **Base de datos:** PostgreSQL + PostGIS + pgvector
- **Mapas:** Leaflet / react-leaflet
- **Embeddings:** @xenova/transformers (modelo all-MiniLM-L6-v2, local)
- **Validación:** Zod
- **Sanitización:** DOMPurify
- **Estilos:** Tailwind CSS
- **Tests:** Jest

---

## Comandos útiles

### Prisma

| Comando | Descripción |
|---|---|
| `pnpm run prisma:generate` | Regenera el cliente de Prisma después de cambios en el schema |
| `pnpm run prisma:migrate:dev` | Crea y aplica una nueva migración en desarrollo |
| `pnpm run prisma:migrate:test` | Aplica migraciones en la base de datos de test |
| `pnpm run prisma:reset:dev` | Resetea la base de datos de desarrollo (borra datos y re-aplica migraciones + seed) |
| `pnpm run prisma:reset:test` | Resetea la base de datos de test |
| `pnpm run prisma:seed` | Ejecuta solo el seed sin resetear la base de datos |

### Docker

| Comando | Descripción |
|---|---|
| `docker compose up -d` | Levanta los contenedores en segundo plano |
| `docker compose down` | Para y elimina los contenedores |
| `docker compose down -v` | Para los contenedores y elimina los volúmenes (borra datos) |
| `docker compose logs -f` | Muestra los logs en tiempo real |

### Tests

| Comando | Descripción |
|---|---|
| `pnpm run test` | Ejecuta todos los tests |
| `pnpm run test -- --watch` | Ejecuta tests en modo watch |
| `pnpm run test -- --coverage` | Ejecuta tests y genera reporte de cobertura |
