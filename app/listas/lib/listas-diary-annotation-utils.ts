import { timestampData } from "./listas-format-utils";
import {
  normalizarQuemPodeComentarAnotacaoListas,
  normalizarTipoDiarioListas,
  normalizarVisibilidadeAnotacaoListas,
  normalizarVisibilidadeComentariosAnotacaoListas,
} from "./listas-diary-normalizer-utils";
import { pegarBooleanoListas, pegarTexto } from "./listas-value-utils";

type RegistroGenerico = Record<string, unknown>;
type AnotacaoObraListas = {
  id: string;
  obraId: string;
  tipo: "lendo" | "quero_ler" | "favorita" | "concluida" | "avaliacao" | "review" | "atividade";
  texto: string;
  visibilidade: "publico" | "parcial" | "privado";
  quemPodeComentar: "herdar" | "todos" | "seguidores" | "ninguem";
  visibilidadeComentarios: "herdar" | "publico" | "seguidores" | "somente_eu";
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  atualizadoEm: string;
};

const DIARIO_ANOTACOES_STORAGE_KEY = "historietas-diario-anotacoes";

export function dataRegistro(registro: RegistroGenerico) {
  return pegarTexto(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at,
  );
}

export function criarChaveStorageAnotacoesListas(userId: string) {
  return `${DIARIO_ANOTACOES_STORAGE_KEY}:${userId.trim().toLowerCase()}`;
}

export function carregarAnotacoesLocaisListas(userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return [];
  }

  try {
    const salvo = window.localStorage.getItem(
      criarChaveStorageAnotacoesListas(userId),
    );
    const registros = salvo ? JSON.parse(salvo) : [];

    return Array.isArray(registros)
      ? registros.filter(
          (registro): registro is RegistroGenerico =>
            Boolean(registro) &&
            typeof registro === "object" &&
            !Array.isArray(registro),
        )
      : [];
  } catch {
    return [];
  }
}

export function salvarAnotacaoLocalListas(
  userId: string,
  registro: RegistroGenerico,
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const obraId = pegarTexto(registro.obra_id ?? registro.obraId);

    if (!obraId) {
      return;
    }

    const registros = carregarAnotacoesLocaisListas(userId).filter(
      (item) => pegarTexto(item.obra_id ?? item.obraId) !== obraId,
    );

    registros.push(registro);
    window.localStorage.setItem(
      criarChaveStorageAnotacoesListas(userId),
      JSON.stringify(registros),
    );
  } catch {
    // O Supabase continua sendo a fonte principal.
  }
}

export function removerAnotacaoLocalListas(userId: string, obraId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    const obraIdLimpo = obraId.trim();
    const registros = carregarAnotacoesLocaisListas(userId).filter(
      (item) => pegarTexto(item.obra_id ?? item.obraId) !== obraIdLimpo,
    );

    window.localStorage.setItem(
      criarChaveStorageAnotacoesListas(userId),
      JSON.stringify(registros),
    );
  } catch {
    // Ignora somente a cópia local.
  }
}

export function montarMapaAnotacoesPorObraListas(
  registros: RegistroGenerico[],
) {
  const mapa = new Map<string, AnotacaoObraListas>();

  registros.forEach((registro) => {
    const obraId = pegarTexto(registro.obra_id ?? registro.obraId);
    const tipo = normalizarTipoDiarioListas(registro.tipo);
    const textoAnotacao = pegarTexto(registro.texto);
    const atualizadoEm = dataRegistro(registro);

    if (!obraId || !tipo || !textoAnotacao) {
      return;
    }

    const chave = obraId.toLowerCase();
    const existente = mapa.get(chave);

    if (
      existente &&
      timestampData(existente.atualizadoEm) >= timestampData(atualizadoEm)
    ) {
      return;
    }

    mapa.set(chave, {
      id: pegarTexto(registro.id),
      obraId,
      tipo,
      texto: textoAnotacao,
      visibilidade: normalizarVisibilidadeAnotacaoListas(
        registro.visibilidade,
        "publico",
      ),
      quemPodeComentar: normalizarQuemPodeComentarAnotacaoListas(
        registro.quem_pode_comentar ?? registro.quemPodeComentar,
      ),
      visibilidadeComentarios: normalizarVisibilidadeComentariosAnotacaoListas(
        registro.visibilidade_comentarios ?? registro.visibilidadeComentarios,
      ),
      permitirCurtidas: pegarBooleanoListas(
        registro.permitir_curtidas ?? registro.permitirCurtidas,
        true,
      ),
      contemSpoiler: pegarBooleanoListas(
        registro.contem_spoiler ?? registro.contemSpoiler,
      ),
      atualizadoEm,
    });
  });

  return mapa;
}

export function aplicarAnotacoesAosItensListas<T extends { obra: { id: string } }>(
  itens: T[],
  anotacoesPorObra: Map<string, AnotacaoObraListas>,
) {
  return itens.map((item) => {
    const anotacao = anotacoesPorObra.get(item.obra.id.toLowerCase());

    if (!anotacao) {
      return item;
    }

    return {
      ...item,
      anotacao: anotacao.texto,
      anotacaoId: anotacao.id,
      anotacaoTipo: anotacao.tipo,
      anotacaoVisibilidade: anotacao.visibilidade,
      anotacaoQuemPodeComentar: anotacao.quemPodeComentar,
      anotacaoVisibilidadeComentarios: anotacao.visibilidadeComentarios,
      anotacaoPermitirCurtidas: anotacao.permitirCurtidas,
      anotacaoSpoiler: anotacao.contemSpoiler,
    };
  });
}
