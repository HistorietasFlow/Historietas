import { registrarDiarioEdicaoObra } from "./editar-obra-diary-action";
import type { ObraLocal } from "../types";

type SincronizarDiarioEdicaoObraParams = {
  userId: string;
  novasObrasDoUsuario: ObraLocal[];
  obraId: string;
  atualizadoEm: string;
};

export async function sincronizarDiarioEdicaoObra({
  userId,
  novasObrasDoUsuario,
  obraId,
  atualizadoEm,
}: SincronizarDiarioEdicaoObraParams) {
  const obraAtualizadaDiario = novasObrasDoUsuario.find(
    (obra) => obra.id === obraId,
  );

  if (obraAtualizadaDiario) {
    await registrarDiarioEdicaoObra({
      userId,
      obra: obraAtualizadaDiario,
      visibilidade: obraAtualizadaDiario.publicado ? "publico" : "privado",
      atualizadoEm,
    });
  }
}
