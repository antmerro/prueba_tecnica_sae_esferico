-- CreateTable
CREATE TABLE "Perfil" (
    "id" SERIAL NOT NULL,
    "imagen" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_usuarioId_key" ON "Perfil"("usuarioId");

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
