import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { timestampData } from "./listas-format-utils";
import { criarStorageKeyUsuarioListas } from "./listas-storage-utils";
import { pegarNumero, pegarTexto } from "./listas-value-utils";

type RegistroGenerico = Record<string, unknown>;
type ObraIdentificavelListas = { id: string; slug: string; titulo: string };
const OBRAS_STORAGE_KEY = "historietas-obras";

export function carregarObrasLocaisListas(userId: string) {
  const userIdLimpo = userId.trim();

  if (typeof window === "undefined" || !userIdLimpo) {
    return [];
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioListas(OBRAS_STORAGE_KEY, userIdLimpo),
    );
    const valor = texto ? JSON.parse(texto) : [];

    return Array.isArray(valor)
      ? valor.filter(
          (item): item is RegistroGenerico =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
      : [];
  } catch {
    return [];
  }
}

export function obterProgressoObraLocalListas(registro: RegistroGenerico) {
  const capitulos = Array.isArray(registro.capitulos)
    ? registro.capitulos.filter(
        (item): item is RegistroGenerico =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido === true);
  const progressoCalculado = capitulos.length
    ? Math.round((capitulosLidos.length / capitulos.length) * 100)
    : 0;
  const progressoInformado = pegarNumero(
    registro.progressoLeitura ?? registro.progresso_leitura ?? registro.progresso,
  );
  const progresso = Math.max(
    0,
    Math.min(100, Math.round(Math.max(progressoCalculado, progressoInformado))),
  );
  const capituloMaisRecente = [...capitulosLidos].sort(
    (a, b) =>
      timestampData(pegarTexto(b.lidoEm ?? b.lido_em ?? b.atualizado_em ?? b.criado_em)) -
      timestampData(pegarTexto(a.lidoEm ?? a.lido_em ?? a.atualizado_em ?? a.criado_em)),
  )[0];

  return {
    progresso,
    data:
      pegarTexto(
        registro.ultimaLeituraEm ?? registro.ultima_leitura_em ?? capituloMaisRecente?.lidoEm ?? capituloMaisRecente?.lido_em ?? capituloMaisRecente?.atualizado_em ?? capituloMaisRecente?.criado_em,
      ) || pegarTexto(registro.criadaEm ?? registro.criada_em),
    capituloId:
      pegarTexto(registro.ultimoCapituloLidoId ?? registro.ultimo_capitulo_lido_id) ||
      pegarTexto(capituloMaisRecente?.id),
  };
}

export function obterIdentificadoresObraListas(obra: ObraIdentificavelListas) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)].filter(
        (valor): valor is string => typeof valor === "string" && Boolean(valor.trim()),
      ),
    ),
  );
}

export function colecaoTemObraListas(colecao: string[], obra: ObraIdentificavelListas) {
  const idsColecao = new Set(
    colecao.filter((id): id is string => typeof id === "string"),
  );

  return obterIdentificadoresObraListas(obra).some((identificador) =>
    idsColecao.has(identificador),
  );
}

export function removerObraDaColecaoListas(colecao: string[], obra: ObraIdentificavelListas) {
  const identificadores = new Set(obterIdentificadoresObraListas(obra));

  return colecao.filter((id) => !identificadores.has(id));
}
