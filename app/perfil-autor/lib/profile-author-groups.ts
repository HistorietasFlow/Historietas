import type {
  AutorPerfil,
  ObraLocal,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import {
  obterTotalComentariosObraPerfilAutor,
  obterTotalCurtidasObraPerfilAutor,
} from "./data-normalizers";
import { criarChaveAutorPerfil } from "./profile-formatters";

export function montarPerfisAutoresPorObras(
  obras: ObraLocal[],
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor,
): AutorPerfil[] {
  const mapa = new Map<
    string,
    { autorId: string; nome: string; obras: ObraLocal[] }
  >();

  obras.forEach((obra) => {
    const nomeAutor = obra.autor.trim() || "Autor não informado";
    const autorId = obra.autorId.trim();
    const chaveAutor = criarChaveAutorPerfil(autorId, nomeAutor);
    const autorExistente = mapa.get(chaveAutor);

    if (autorExistente) {
      mapa.set(chaveAutor, {
        ...autorExistente,
        autorId: autorExistente.autorId || autorId,
        obras: [...autorExistente.obras, obra],
      });
      return;
    }

    mapa.set(chaveAutor, {
      autorId,
      nome: nomeAutor,
      obras: [obra],
    });
  });

  return Array.from(mapa.values())
    .map((grupoAutor) => {
      const obrasDoAutor = grupoAutor.obras;

      return {
        autorId: grupoAutor.autorId,
        nome: grupoAutor.nome,
        obras: obrasDoAutor,
        totalCapitulos: obrasDoAutor.reduce(
          (total, obra) => total + obra.capitulos.length,
          0,
        ),
        totalPublicadas: obrasDoAutor.filter((obra) => obra.publicado).length,
        totalCurtidas: obrasDoAutor.reduce(
          (total, obra) =>
            total +
            obterTotalCurtidasObraPerfilAutor(obra, totaisInteracoesObras),
          0,
        ),
        totalComentarios: obrasDoAutor.reduce(
          (total, obra) =>
            total +
            obterTotalComentariosObraPerfilAutor(
              obra,
              totaisInteracoesObras,
            ),
          0,
        ),
      };
    })
    .sort((autorA, autorB) => autorA.nome.localeCompare(autorB.nome));
}
