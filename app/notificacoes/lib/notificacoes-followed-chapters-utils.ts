import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { dataNotificacao, notificacaoEhCapitulo } from "./notificacoes-filter-utils";
import { criarHrefLeituraCapitulo } from "./notificacoes-navigation-utils";
import type { NotificacaoLocal, ObraLocal } from "./notificacoes-models";

export function criarChavesObraParaNotificacao(obra: ObraLocal) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((chave) => Boolean(chave.trim()))
    )
  );
}

export function obraEstaNaListaSeguida(
  obra: ObraLocal,
  idsSeguidos: Set<string>
) {
  if (idsSeguidos.size === 0) {
    return false;
  }

  return criarChavesObraParaNotificacao(obra).some((chave) =>
    idsSeguidos.has(chave)
  );
}

export function notificacaoCapituloPertenceAObraSeguida(
  notificacao: NotificacaoLocal,
  obrasPorId: Map<string, ObraLocal>,
  idsSeguidos: Set<string>,
  usuarioAtualId: string
) {
  if (!notificacaoEhCapitulo(notificacao)) {
    return true;
  }

  if (idsSeguidos.size === 0) {
    return false;
  }

  const obra = obrasPorId.get(notificacao.obraId) || null;

  if (!obra) {
    return idsSeguidos.has(notificacao.obraId);
  }

  if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
    return false;
  }

  return obraEstaNaListaSeguida(obra, idsSeguidos);
}

export function criarNotificacoesDeCapitulos(
  obrasParaCriar: ObraLocal[],
  obrasSeguidasIds: string[],
  notificacoesLidasIds: string[],
  usuarioAtualId: string
) {
  const idsSeguidos = new Set(
    obrasSeguidasIds
      .filter((id) => Boolean(id.trim()))
      .map((id) => id.trim())
  );
  const idsLidos = new Set(notificacoesLidasIds);
  const notificacoesCriadas: NotificacaoLocal[] = [];

  obrasParaCriar.forEach((obra) => {
    if (!obraEstaNaListaSeguida(obra, idsSeguidos)) {
      return;
    }

    if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId) {
      return;
    }

    const indiceCapitulo = obra.capitulos.length - 1;
    const capitulo = indiceCapitulo >= 0 ? obra.capitulos[indiceCapitulo] : null;

    if (!capitulo) {
      return;
    }

    const id = `capitulo-${obra.id}-${capitulo.id}`;
    const idCanonico = `novo-capitulo:${capitulo.id}`;

    notificacoesCriadas.push({
      id,
      obraId: obra.id,
      capituloId: capitulo.id,
      link: criarHrefLeituraCapitulo(obra, capitulo.id, indiceCapitulo + 1),
      titulo: "Novo capítulo publicado",
      mensagem: `${capitulo.titulo} chegou em ${obra.titulo}.`,
      tipo: "novo-capitulo",
      lida: idsLidos.has(id) || idsLidos.has(idCanonico),
      criadaEm: capitulo.criadoEm || obra.criadaEm || new Date().toISOString(),
      autorId: obra.autorId || "",
      autorNome: obra.autor,
      autorAvatar: "",
    });
  });

  return notificacoesCriadas.sort(
    (a, b) => dataNotificacao(b) - dataNotificacao(a)
  );
}
