import { criarSlugBase } from "../../../lib/utils";
import { normalizarCategoriaArquivoSupabase } from "./painel-autor-file-category-utils";
import { obterTimestamp } from "./painel-autor-format-utils";
import { criarChaveInteracao } from "./painel-autor-interaction-utils";
import { calcularProgressoLeitura } from "./painel-autor-reading-progress-utils";

type CapituloLocalPainel = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type ArquivoObraLocalPainel = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocalPainel = {
  id: string;
  autorId?: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocalPainel | null;
  publicado: boolean;
  capitulos: CapituloLocalPainel[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  slug: string;
  link: string;
};

type SupabaseObraPainel = {
  id: string;
  user_id?: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  visualizacoes: number | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

type SupabaseCapituloPainel = {
  id: string;
  titulo: string | null;
  texto: string | null;
  publicado: boolean | null;
  criado_em: string | null;
};

export function converterObraSupabaseParaLocalPainel({
  obraBanco,
  capitulosBanco,
  obraLocal,
  capitulosSalvos,
  capitulosCurtidos,
  progressoPorCapitulo,
  progressoCarregado,
  capitulosComMetricas,
  comentariosCapitulos,
  index,
}: {
  obraBanco: SupabaseObraPainel;
  capitulosBanco: SupabaseCapituloPainel[];
  obraLocal?: ObraLocalPainel;
  capitulosSalvos: Set<string>;
  capitulosCurtidos: Set<string>;
  progressoPorCapitulo: Map<string, string>;
  progressoCarregado: boolean;
  capitulosComMetricas: ReadonlySet<string>;
  comentariosCapitulos: Map<string, string>;
  index: number;
}): ObraLocalPainel {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  let ultimoCapituloLidoId = progressoCarregado
    ? ""
    : obraLocal?.ultimoCapituloLidoId || "";
  let ultimaLeituraEm = progressoCarregado
    ? ""
    : obraLocal?.ultimaLeituraEm || "";

  function aplicarProgressoCapitulo(
    capitulo: CapituloLocalPainel,
    obraId: string
  ): CapituloLocalPainel {
    const chaveInteracao = criarChaveInteracao(obraId, capitulo.id);
    const temProgressoRemoto =
      progressoPorCapitulo.has(chaveInteracao) ||
      progressoPorCapitulo.has(capitulo.id);
    const progressoRemotoDisponivel =
      progressoCarregado && capitulosComMetricas.has(capitulo.id);
    const lido = progressoRemotoDisponivel
      ? temProgressoRemoto
      : capitulo.lido;
    const lidoEmRemoto =
      progressoPorCapitulo.get(chaveInteracao) ||
      progressoPorCapitulo.get(capitulo.id) ||
      "";
    const lidoEm = lido ? lidoEmRemoto || capitulo.lidoEm : "";

    if (lido) {
      const tempoAtual = obterTimestamp(lidoEm);
      const tempoUltimo = obterTimestamp(ultimaLeituraEm);

      if (!ultimoCapituloLidoId || tempoAtual >= tempoUltimo) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      ...capitulo,
      lido,
      lidoEm,
    };
  }

  const capitulosRemotos = capitulosBanco.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);
    const chaveInteracao = criarChaveInteracao(obraBanco.id, capitulo.id);
    const comentarioSupabase =
      comentariosCapitulos.get(chaveInteracao) ||
      comentariosCapitulos.get(capitulo.id) ||
      "";

    return aplicarProgressoCapitulo(
      {
        id: capitulo.id,
        titulo:
          capitulo.titulo?.trim() ||
          capituloLocal?.titulo ||
          `Capítulo ${capituloIndex + 1}`,
        texto:
          typeof capitulo.texto === "string"
            ? capitulo.texto
            : capituloLocal?.texto || "",
        curtiu:
          Boolean(capituloLocal?.curtiu) ||
          capitulosCurtidos.has(chaveInteracao) ||
          capitulosCurtidos.has(capitulo.id),
        salvo:
          Boolean(capituloLocal?.salvo) ||
          capitulosSalvos.has(chaveInteracao) ||
          capitulosSalvos.has(capitulo.id),
        comentario: comentarioSupabase || capituloLocal?.comentario || "",
        criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
        lido: Boolean(capituloLocal?.lido),
        lidoEm: capituloLocal?.lidoEm || "",
        publicado: capitulo.publicado !== false,
      },
      obraBanco.id
    );
  });

  const idsRemotos = new Set(capitulosRemotos.map((capitulo) => capitulo.id));
  const capitulosApenasLocais = (obraLocal?.capitulos || [])
    .filter((capitulo) => !idsRemotos.has(capitulo.id))
    .map((capitulo) =>
      aplicarProgressoCapitulo(
        capitulo,
        obraBanco.id || obraLocal?.id || ""
      )
    );
  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];

  const tituloObra =
    obraBanco.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obraBanco.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obraBanco.arquivo_url?.trim() || "";

  return {
    id: obraBanco.id || obraLocal?.id || `obra-${index + 1}`,
    autorId: obraBanco.user_id?.trim() || obraLocal?.autorId || "",
    titulo: tituloObra,
    autor: obraBanco.autor?.trim() || obraLocal?.autor || "Autor não informado",
    genero: obraBanco.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obraBanco.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obraBanco.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obraBanco.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obraBanco.tags) && obraBanco.tags.length > 0
        ? obraBanco.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obraBanco.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obraBanco.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obraBanco.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: obraBanco.arquivo_tipo?.trim() || obraLocal?.arquivoObra?.tipo || "",
          tamanho:
            typeof obraBanco.arquivo_tamanho === "number" &&
            Number.isFinite(obraBanco.arquivo_tamanho)
              ? obraBanco.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: normalizarCategoriaArquivoSupabase(
            obraBanco.arquivo_categoria,
            obraBanco.arquivo_tipo
          ),
          criadoEm: obraBanco.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obraBanco.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obraBanco.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes:
      typeof obraBanco.visualizacoes === "number" &&
      Number.isFinite(obraBanco.visualizacoes)
        ? Math.max(0, Math.round(obraBanco.visualizacoes))
        : obraLocal?.visualizacoes || 0,
    slug: slugObra,
    link: obraBanco.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}
