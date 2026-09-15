import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import type {
  DiarioPerfilItem,
  ItemBibliotecaPerfil,
  ObraLocal,
} from "../types";
import { obterTimestampData } from "./profile-formatters";
import { encontrarCapituloParaContinuar } from "./work-normalizers";

export function obterIdentificadoresObraPerfilBiblioteca(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter(
        (valor): valor is string =>
          typeof valor === "string" && Boolean(valor.trim()),
      ),
    ),
  );
}

export function colecaoTemObraPerfilBiblioteca(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  const idsColecao = new Set(colecao.filter((id) => typeof id === "string"));

  return obterIdentificadoresObraPerfilBiblioteca(obra).some((identificador) =>
    idsColecao.has(identificador),
  );
}

export function removerObraDaColecaoPerfilBiblioteca(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">,
) {
  const identificadores = new Set(
    obterIdentificadoresObraPerfilBiblioteca(obra),
  );

  return colecao.filter((id) => !identificadores.has(id));
}

export function encontrarObraPorIdentificadorTopFivePerfil(
  obrasDisponiveis: ObraLocal[],
  identificador: string,
) {
  const identificadorLimpo = identificador.trim();

  if (!identificadorLimpo) {
    return null;
  }

  return (
    obrasDisponiveis.find((obra) =>
      obterIdentificadoresObraPerfilBiblioteca(obra).includes(
        identificadorLimpo,
      ),
    ) || null
  );
}

export function criarChaveCurtidaTopFivePerfil(perfilUserId: string) {
  return perfilUserId.trim().toLowerCase();
}

export function normalizarCurtidasTopFiveLocais(valor: unknown) {
  const curtidasNormalizadas: Record<string, string[]> = {};

  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return curtidasNormalizadas;
  }

  Object.entries(valor as Record<string, unknown>).forEach(
    ([perfilId, curtidas]) => {
      if (!perfilId.trim() || !Array.isArray(curtidas)) {
        return;
      }

      curtidasNormalizadas[criarChaveCurtidaTopFivePerfil(perfilId)] =
        Array.from(
          new Set(
            curtidas
              .filter(
                (usuarioId): usuarioId is string =>
                  typeof usuarioId === "string" && Boolean(usuarioId.trim()),
              )
              .map((usuarioId) => usuarioId.trim().toLowerCase()),
          ),
        );
    },
  );

  return curtidasNormalizadas;
}

function obterTempoAtividadeBibliotecaPerfil(obra: ObraLocal) {
  const tempos = [
    obterTimestampData(obra.ultimaLeituraEm),
    obterTimestampData(obra.criadaEm),
    ...obra.capitulos.map((capitulo) =>
      Math.max(
        obterTimestampData(capitulo.lidoEm),
        obterTimestampData(capitulo.criadoEm),
      ),
    ),
  ];

  return Math.max(0, ...tempos);
}

function obterCapituloBibliotecaPerfil(obra: ObraLocal) {
  return (
    obra.capitulos.find((capitulo) => capitulo.salvo) ||
    encontrarCapituloParaContinuar(obra) ||
    obra.capitulos.find((capitulo) => capitulo.lido) ||
    obra.capitulos[0] ||
    null
  );
}

export function converterItensDiarioParaBiblioteca(
  itens: DiarioPerfilItem[],
  prefixo: string,
): ItemBibliotecaPerfil[] {
  const itensPorObra = new Map<string, ItemBibliotecaPerfil>();

  [...itens]
    .sort(
      (itemA, itemB) =>
        obterTimestampData(itemB.data) - obterTimestampData(itemA.data),
    )
    .forEach((item) => {
      const obra = item.obra;

      if (!obra) {
        return;
      }

      const chaveObra =
        obra.id.trim() || obra.slug.trim() || normalizarTexto(obra.titulo);

      if (!chaveObra || itensPorObra.has(chaveObra)) {
        return;
      }

      const capitulo =
        item.tipo === "lendo"
          ? encontrarCapituloParaContinuar(obra)
          : obterCapituloBibliotecaPerfil(obra);
      const numeroCapitulo = capitulo
        ? obra.capitulos.findIndex(
            (capituloObra) => capituloObra.id === capitulo.id,
          ) + 1
        : 0;

      itensPorObra.set(chaveObra, {
        chave: `${prefixo}-${item.chave}`,
        obra,
        capitulo,
        numeroCapitulo: Math.max(0, numeroCapitulo),
        tempoAtividade:
          obterTimestampData(item.data) ||
          obterTempoAtividadeBibliotecaPerfil(obra),
        tipoDiario: item.tipo,
        descricao: item.descricao,
      });
    });

  return Array.from(itensPorObra.values()).sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}

export function converterCapitulosSalvosParaBiblioteca(
  obrasDisponiveis: ObraLocal[],
): ItemBibliotecaPerfil[] {
  const itens: ItemBibliotecaPerfil[] = [];

  obrasDisponiveis.forEach((obra) => {
    obra.capitulos.forEach((capitulo, capituloIndex) => {
      if (!capitulo.salvo) {
        return;
      }

      itens.push({
        chave: `salvo-${obra.id || obra.slug}-${capitulo.id}`,
        obra,
        capitulo,
        numeroCapitulo: capituloIndex + 1,
        tempoAtividade:
          obterTimestampData(capitulo.lidoEm) ||
          obterTimestampData(capitulo.criadoEm) ||
          obterTempoAtividadeBibliotecaPerfil(obra),
        tipoDiario: "quero_ler",
        descricao: "Capítulo salvo na Biblioteca",
      });
    });
  });

  return itens.sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}

export function mesclarItensBibliotecaPerfil(
  ...listas: ItemBibliotecaPerfil[][]
): ItemBibliotecaPerfil[] {
  const itensPorChave = new Map<string, ItemBibliotecaPerfil>();

  listas.flat().forEach((item) => {
    const chave = item.capitulo?.id.trim()
      ? `${item.obra.id || item.obra.slug}::${item.capitulo.id}`
      : item.obra.id || item.obra.slug || normalizarTexto(item.obra.titulo);

    if (!chave || itensPorChave.has(chave)) {
      return;
    }

    itensPorChave.set(chave, item);
  });

  return Array.from(itensPorChave.values()).sort(
    (itemA, itemB) => itemB.tempoAtividade - itemA.tempoAtividade,
  );
}
