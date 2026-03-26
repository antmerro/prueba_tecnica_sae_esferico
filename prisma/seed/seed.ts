// Este archivo contendrá (AD: contiene) el script que hará el seed de la base de datos
import { prisma } from "../prisma_client";
import { pipeline } from "@xenova/transformers";
import bcrypt from "bcryptjs";


/*
AD:
Peliculas de ejemplo para probar el vector search. 
No tienen relación con el dominio agrícola, pero sirven para ilustrar 
cómo almacenar y consultar vectores de embedding en la base de datos. 
Las descripciones son breves resúmenes de la trama, 
ideales para generar embeddings que capturen el tema general de cada película.
*/
const movies = [
    { title: "Alien", description: "A spaceship crew is hunted by a deadly alien creature." },
    { title: "The Thing", description: "Researchers in Antarctica face a shape shifting monster." },
    { title: "The Shining", description: "A writer loses his mind in an isolated haunted hotel." },
    { title: "Get Out", description: "A young man uncovers a disturbing secret while visiting his partner family." },
    { title: "The Godfather", description: "The son of a mafia boss is pulled into organized crime." },
    { title: "Pulp Fiction", description: "Interconnected stories of crime, violence, and dark humor in Los Angeles." },
    { title: "The Dark Knight", description: "Batman faces a chaotic criminal mastermind called the Joker." },
    { title: "Inception", description: "A team enters dreams to plant an idea in a target mind." },
    { title: "Interstellar", description: "Astronauts travel through space to find a new home for humanity." },
    { title: "Blade Runner 2049", description: "A replicant hunter uncovers secrets that could change society." },
    { title: "Arrival", description: "A linguist tries to communicate with mysterious alien visitors." },
    { title: "The Matrix", description: "A hacker discovers reality is a simulation controlled by machines." },
    { title: "Mad Max Fury Road", description: "A high speed escape across the desert against a warlord army." },
    { title: "Gladiator", description: "A Roman general seeks revenge after betrayal and slavery." },
    { title: "Braveheart", description: "A Scottish warrior leads a rebellion for freedom." },
    { title: "Saving Private Ryan", description: "Soldiers risk everything to rescue a paratrooper during war." },
    { title: "Dunkirk", description: "Allied troops attempt evacuation while trapped on French beaches." },
    { title: "1917", description: "Two soldiers race against time to deliver a life saving message." },
    { title: "The Lord of the Rings The Fellowship of the Ring", description: "A group begins a perilous quest to destroy a cursed ring." },
    { title: "The Lord of the Rings The Two Towers", description: "The fellowship is split while war rises across Middle Earth." },
    { title: "The Lord of the Rings The Return of the King", description: "Final battles decide the fate of Middle Earth." },
    { title: "Harry Potter and the Prisoner of Azkaban", description: "A young wizard returns to school and faces dark revelations." },
    { title: "Fantastic Beasts and Where to Find Them", description: "A magizoologist chases magical creatures loose in a city." },
    { title: "Pan's Labyrinth", description: "A girl finds a dark fantasy world during a brutal conflict." },
    { title: "Spirited Away", description: "A girl enters a spirit world to save her parents." },
    { title: "The Exorcist", description: "A young girl is possessed by a demonic entity, and her mother seeks the help of two priests to save her." },
    { title: "Toy Story", description: "Toys come to life and deal with friendship and jealousy." },
    { title: "Finding Nemo", description: "A timid fish crosses the ocean to rescue his son." },
    { title: "Coco", description: "A boy enters the land of the dead through music and memory." },
    { title: "Ratatouille", description: "A rat with culinary talent dreams of becoming a chef." },
    { title: "The Grand Budapest Hotel", description: "A concierge and his apprentice become involved in a mystery." },
    { title: "Forrest Gump", description: "A kind man witnesses key moments of modern history." },
    { title: "The Social Network", description: "The rise of a social platform brings ambition and legal conflict." },
    { title: "Whiplash", description: "A young drummer faces extreme pressure from a ruthless instructor." },
    { title: "La La Land", description: "Two artists chase dreams while their romance evolves." },
    { title: "Amelie", description: "A shy woman in Paris quietly improves the lives of others." },
    { title: "Her", description: "A lonely writer falls in love with an intelligent operating system." },
    { title: "Eternal Sunshine of the Spotless Mind", description: "A couple erases memories of each other and confronts love." },
    { title: "Parasite", description: "A poor family infiltrates a wealthy household with hidden motives." },
    { title: "Prisoners", description: "A father takes desperate actions after his daughter disappears." },
    { title: "Zodiac", description: "Journalists and detectives obsess over a mysterious serial killer." },
    { title: "Gone Girl", description: "A husband becomes suspect when his wife vanishes." },
    { title: "Se7en", description: "Two detectives hunt a killer inspired by deadly sins." },
    { title: "No Country for Old Men", description: "A hunter finds money and is chased by a relentless assassin." },
    { title: "Sicario", description: "An idealistic agent joins a covert war against drug cartels." },
    { title: "John Wick", description: "A retired hitman returns for revenge after personal loss." },
    { title: "Mission Impossible Fallout", description: "An agent races to stop a global catastrophe." },
    { title: "Top Gun Maverick", description: "A veteran pilot trains a new generation for a dangerous mission." },
    { title: "Ford v Ferrari", description: "A designer and a driver challenge a racing giant at Le Mans." },
    { title: "A Quiet Place", description: "A family survives in silence while monsters hunt by sound." }
];

async function main() {
    // Log inicial
    console.log("Seeding database...");

    // -- Provincias
    console.log("   Inserting provinces...");
    const [murcia, almeria] = await Promise.all([
        prisma.provincia.create({ data: { nombre: "Murcia" } }),
        prisma.provincia.create({ data: { nombre: "Almería" } }),
    ]);

    // -- Municipios
    console.log("   Inserting municipalities...");
    const [
        municipioMurcia,
        municipioCartagena,
        municipioLorca,
        municipioAlmeria,
        municipioHuercalOvera,
        municipioElEjido,
    ] = await Promise.all([
        prisma.municipio.create({ data: { nombre: "Murcia",     provinciaId: murcia.id  } }),
        prisma.municipio.create({ data: { nombre: "Cartagena",  provinciaId: murcia.id  } }),
        prisma.municipio.create({ data: { nombre: "Lorca",      provinciaId: murcia.id  } }),
        prisma.municipio.create({ data: { nombre: "Almería",    provinciaId: almeria.id } }),
        prisma.municipio.create({ data: { nombre: "Huércal-Overa", provinciaId: almeria.id } }),
        prisma.municipio.create({ data: { nombre: "El Ejido",   provinciaId: almeria.id } }),
    ]);

    // -- Cultivos
    console.log("   Inserting crops...");
    const [trigo, maiz, olivo, almendro, vid, tomate, pimiento] = await Promise.all([
        prisma.cultivo.create({ data: { nombre: "Trigo"    } }),
        prisma.cultivo.create({ data: { nombre: "Maíz"     } }),
        prisma.cultivo.create({ data: { nombre: "Olivo"    } }),
        prisma.cultivo.create({ data: { nombre: "Almendro" } }),
        prisma.cultivo.create({ data: { nombre: "Vid"      } }),
        prisma.cultivo.create({ data: { nombre: "Tomate"   } }),
        prisma.cultivo.create({ data: { nombre: "Pimiento" } }),
    ]);

    // -- Usuarios
    console.log("   Inserting users...");
    const [u1, u2, u3, u4, u5, u6, u7] = await Promise.all([
        prisma.usuario.create({ data: { nombre: "Carlos García",    email: "carlos@example.com",   password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "María López",      email: "maria@example.com",    password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "Pedro Martínez",   email: "pedro@example.com",    password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "Ana Sánchez",      email: "ana@example.com",      password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "Luis Fernández",   email: "luis@example.com",     password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "Isabel Rodríguez", email: "isabel@example.com",   password: bcrypt.hashSync("password123", 10) } }),
        prisma.usuario.create({ data: { nombre: "Fernando Torres",  email: "fernando@example.com", password: bcrypt.hashSync("password123", 10) } }),
    ]);
    void u7; // Fernando  no tiene parcelas - util para probar test del filtro "no tiene parcelas"

    // -- Parcelas (raw queries with ST_GeomFromGeoJSON)
    console.log("   Inserting plots...");
    // Todos los polígonos se dibujan alrededor de la región de Murcia / Almería.
    // Cada recinto debe estar geométricamente contenido (ST_Within) dentro de su parcela.
    // Coordenadas: [longitud, latitud] - EPSG:4326

    // Parcela 1 — Carlos, Murcia
    const [p1] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.1300, 37.9800],
                [-1.1240, 37.9800],
                [-1.1240, 37.9850],
                [-1.1300, 37.9850],
                [-1.1300, 37.9800]
            ]]}'),
            ${u1.id},
            ${municipioMurcia.id}
        )
        RETURNING id
    `;

    // Parcela 2 — Carlos, Cartagena
    const [p2] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-0.9900, 37.6050],
                [-0.9840, 37.6050],
                [-0.9840, 37.6100],
                [-0.9900, 37.6100],
                [-0.9900, 37.6050]
            ]]}'),
            ${u1.id},
            ${municipioCartagena.id}
        )
        RETURNING id
    `;

    // Parcela 3 — María, Lorca
    const [p3] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.7060, 37.6700],
                [-1.6990, 37.6700],
                [-1.6990, 37.6760],
                [-1.7060, 37.6760],
                [-1.7060, 37.6700]
            ]]}'),
            ${u2.id},
            ${municipioLorca.id}
        )
        RETURNING id
    `;

    // Parcela 4 — María, Murcia
    const [p4] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.1500, 37.9700],
                [-1.1430, 37.9700],
                [-1.1430, 37.9760],
                [-1.1500, 37.9760],
                [-1.1500, 37.9700]
            ]]}'),
            ${u2.id},
            ${municipioMurcia.id}
        )
        RETURNING id
    `;

    // Parcela 5 — Pedro, Almería  (contains two recintos side by side)
    const [p5] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.4630, 36.8400],
                [-2.4530, 36.8400],
                [-2.4530, 36.8470],
                [-2.4630, 36.8470],
                [-2.4630, 36.8400]
            ]]}'),
            ${u3.id},
            ${municipioAlmeria.id}
        )
        RETURNING id
    `;

    // Parcela 6 — Ana, Huércal-Overa
    const [p6] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.9530, 37.5220],
                [-1.9460, 37.5220],
                [-1.9460, 37.5280],
                [-1.9530, 37.5280],
                [-1.9530, 37.5220]
            ]]}'),
            ${u4.id},
            ${municipioHuercalOvera.id}
        )
        RETURNING id
    `;

    // Parcela 7 — Ana, El Ejido
    const [p7] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.7810, 36.7750],
                [-2.7730, 36.7750],
                [-2.7730, 36.7820],
                [-2.7810, 36.7820],
                [-2.7810, 36.7750]
            ]]}'),
            ${u4.id},
            ${municipioElEjido.id}
        )
        RETURNING id
    `;

    // Parcela 8 — Luis, Cartagena
    const [p8] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-0.9720, 37.5950],
                [-0.9650, 37.5950],
                [-0.9650, 37.6010],
                [-0.9720, 37.6010],
                [-0.9720, 37.5950]
            ]]}'),
            ${u5.id},
            ${municipioCartagena.id}
        )
        RETURNING id
    `;

    // Parcela 9 — Luis, Lorca
    const [p9] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.6910, 37.6600],
                [-1.6840, 37.6600],
                [-1.6840, 37.6660],
                [-1.6910, 37.6660],
                [-1.6910, 37.6600]
            ]]}'),
            ${u5.id},
            ${municipioLorca.id}
        )
        RETURNING id
    `;

    // Parcela 10 — Isabel, Almería
    const [p10] = await prisma.$queryRaw<{ id: number }[]>`
        INSERT INTO "Parcela" ("geom", "usuarioId", "municipioId")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.4730, 36.8500],
                [-2.4640, 36.8500],
                [-2.4640, 36.8570],
                [-2.4730, 36.8570],
                [-2.4730, 36.8500]
            ]]}'),
            ${u6.id},
            ${municipioAlmeria.id}
        )
        RETURNING id
    `;

    // -- Recintos (Hay un check constraint en la tabla que comprueba con ST_Within si se encuentra dentro de la parcela)
    console.log("   Inserting enclosures...");
    // Recinto 1 — trigo, dentro de p1
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.1290, 37.9810],
                [-1.1250, 37.9810],
                [-1.1250, 37.9840],
                [-1.1290, 37.9840],
                [-1.1290, 37.9810]
            ]]}'),
            ${p1.id}, ${trigo.id},
            '2025-11-01', '2026-07-15'
        )
    `;

    // Recinto 2 — maíz, dentro de p2
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-0.9890, 37.6060],
                [-0.9850, 37.6060],
                [-0.9850, 37.6090],
                [-0.9890, 37.6090],
                [-0.9890, 37.6060]
            ]]}'),
            ${p2.id}, ${maiz.id},
            '2026-04-01', '2026-09-30'
        )
    `;

    // Recinto 3 — olivo, dentro de p3
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.7050, 37.6710],
                [-1.7000, 37.6710],
                [-1.7000, 37.6750],
                [-1.7050, 37.6750],
                [-1.7050, 37.6710]
            ]]}'),
            ${p3.id}, ${olivo.id},
            '2024-03-01', NULL
        )
    `;

    // Recinto 4 — almendro, dentro de p4
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.1490, 37.9710],
                [-1.1440, 37.9710],
                [-1.1440, 37.9750],
                [-1.1490, 37.9750],
                [-1.1490, 37.9710]
            ]]}'),
            ${p4.id}, ${almendro.id},
            '2024-02-15', '2025-08-30'
        )
    `;

    // Recinto 5a — tomate (mitad izquierda de p5)
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.4620, 36.8410],
                [-2.4590, 36.8410],
                [-2.4590, 36.8460],
                [-2.4620, 36.8460],
                [-2.4620, 36.8410]
            ]]}'),
            ${p5.id}, ${tomate.id},
            '2026-02-01', '2026-06-30'
        )
    `;

    // Recinto 5b — pimiento (mitad derecha de p5)
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.4575, 36.8410],
                [-2.4540, 36.8410],
                [-2.4540, 36.8460],
                [-2.4575, 36.8460],
                [-2.4575, 36.8410]
            ]]}'),
            ${p5.id}, ${pimiento.id},
            '2026-03-01', '2026-07-15'
        )
    `;

    // Recinto 6 — tomate, dentro de p6 (Huércal-Overa)
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.9520, 37.5230],
                [-1.9470, 37.5230],
                [-1.9470, 37.5270],
                [-1.9520, 37.5270],
                [-1.9520, 37.5230]
            ]]}'),
            ${p6.id}, ${tomate.id},
            '2026-01-15', '2026-05-30'
        )
    `;

    // Recinto 7 — pimiento, dentro de p7
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.7800, 36.7760],
                [-2.7740, 36.7760],
                [-2.7740, 36.7810],
                [-2.7800, 36.7810],
                [-2.7800, 36.7760]
            ]]}'),
            ${p7.id}, ${pimiento.id},
            '2026-02-15', '2026-06-15'
        )
    `;

    // Recinto 8 — vid, dentro de p8
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-0.9710, 37.5960],
                [-0.9660, 37.5960],
                [-0.9660, 37.6000],
                [-0.9710, 37.6000],
                [-0.9710, 37.5960]
            ]]}'),
            ${p8.id}, ${vid.id},
            '2025-04-01', NULL
        )
    `;

    // Recinto 9 — almendro, dentro de p9
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-1.6900, 37.6610],
                [-1.6850, 37.6610],
                [-1.6850, 37.6650],
                [-1.6900, 37.6650],
                [-1.6900, 37.6610]
            ]]}'),
            ${p9.id}, ${almendro.id},
            '2024-02-01', '2025-09-15'
        )
    `;

    // Recinto 10 — olivo, dentro de p10
    await prisma.$executeRaw`
        INSERT INTO "Recinto" ("geom", "parcelaId", "cultivoId", "fechaSiembra", "fechaCosecha")
        VALUES (
            ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[
                [-2.4720, 36.8510],
                [-2.4650, 36.8510],
                [-2.4650, 36.8560],
                [-2.4720, 36.8560],
                [-2.4720, 36.8510]
            ]]}'),
            ${p10.id}, ${olivo.id},
            '2023-11-01', NULL
        )
    `;

    console.log("Agricultural data seeded successfully.");

    // -- Movies with embeddings
    console.log("Generating movie embeddings (this may take a moment)...");

    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

    for (const movie of movies) {
        const output = await extractor(movie.description, { pooling: "mean", normalize: true });
        const embedding: number[] = Array.from(output.data as Float32Array);
        const vectorLiteral = `[${embedding.join(",")}]`;

        await prisma.$executeRawUnsafe(
            `INSERT INTO "Movie" ("title", "description", "embedding") VALUES ($1, $2, $3::vector)`,
            movie.title,
            movie.description,
            vectorLiteral
        );
    }

    console.log("Movies seeded successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
