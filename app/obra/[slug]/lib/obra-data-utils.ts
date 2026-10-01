import { normalizarAvisosConteudo18, type AvisoConteudo18 } from "../../../../lib/historietasAdultContent";
import { criarSlugBase } from "../../../../lib/utils";
import {
  normalizarContadorObraPublica,
  totalComentariosObraPublica,
  totalCurtidasObraPublica,
  totalVisualizacoesObraPublica,
} from "./obra-metric-utils";
import {
  calcularProgressoLeitura,
  normalizarCapituloLocal,
  obraLocalEstaDisponivelParaLeitura,
} from "./obra-reading-utils";
import { normalizarArquivoObra, normalizarCategoriaArquivoSupabase, obterChavesBackupObra, type ArquivoObraLocal, type ArquivosObrasBackup } from "./obra-file-utils";
import type { CapituloDinamico, CapituloLocal, SupabaseCapituloRow } from "./obra-reading-utils";

export type SupabaseObraRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  avisos_conteudo: string[] | null;
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
  views?: number | null;
  total_visualizacoes?: number | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

export type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalFavoritos?: number;
  totalConcluidas?: number;
  slug: string;
  link: string;
};

export type ResultadoCarregamentoObraPublica = {
  obras: ObraLocal[];
  status: "carregada" | "nao_encontrada" | "erro" | "cancelada";
};

export type ObraDinamica = {
  id: string;
  origem: "local";
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: AvisoConteudo18[];
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  disponivel: boolean;
  slug: string;
  link: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra: ArquivoObraLocal | null;
  capitulos: CapituloDinamico[];
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
};

export function restaurarArquivoObraComBackup(
  obraLocal: ObraLocal,
  backup: ArquivosObrasBackup
): ObraLocal {
  if (obraLocal.arquivoObra) {
    return obraLocal;
  }

  const arquivoBackup = obterChavesBackupObra(obraLocal)
    .map((chave) => normalizarArquivoObra(backup[chave]))
    .find((arquivo): arquivo is ArquivoObraLocal => Boolean(arquivo));

  if (!arquivoBackup) {
    return obraLocal;
  }

  return {
    ...obraLocal,
    arquivoObra: arquivoBackup,
  };
}

export function normalizarObraLocal(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizadosTodos: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloLocal(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];
  const capitulosNormalizados = capitulosNormalizadosTodos.filter(
    (capitulo) => capitulo.publicado !== false
  );

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.userId === "string" && obra.userId.trim()
            ? obra.userId.trim()
            : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    avisosConteudo: normalizarAvisosConteudo18(
      obra.avisosConteudo,
      obra.classificacaoIndicativa,
    ),
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: normalizarArquivoObra(obra.arquivoObra),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ??
        obra.views ??
        obra.visualizacoesTotal ??
        obra.totalVisualizacoes ??
        obra.total_visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(
      obra.totalCurtidas ?? obra.total_curtidas
    ),
    totalComentarios: normalizarContadorObraPublica(
      obra.totalComentarios ?? obra.total_comentarios
    ),
    totalFavoritos: normalizarContadorObraPublica(
      obra.totalFavoritos ?? obra.total_favoritos
    ),
    totalConcluidas: normalizarContadorObraPublica(
      obra.totalConcluidas ?? obra.total_concluidas
    ),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

export function normalizarObraSupabase(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos = capitulosSupabase.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
      publicado: true,
      totalCurtidas: normalizarContadorObraPublica(capituloLocal?.totalCurtidas),
      totalComentarios: normalizarContadorObraPublica(capituloLocal?.totalComentarios),
      totalSalvos: normalizarContadorObraPublica(capituloLocal?.totalSalvos),
      totalLidos: normalizarContadorObraPublica(capituloLocal?.totalLidos),
    } satisfies CapituloLocal;
  });

  const capitulosMesclados = capitulosRemotos;
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    obraLocal?.arquivoObra?.tipo ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
      ? "image/*"
      : arquivoCategoria === "texto"
      ? "text/plain"
      : "");

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    avisosConteudo: normalizarAvisosConteudo18(
      obra.avisos_conteudo ?? obraLocal?.avisosConteudo,
      obra.classificacao_indicativa ?? obraLocal?.classificacaoIndicativa,
    ),
    sinopse:
      obra.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    visualizacoes: normalizarContadorObraPublica(
      obra.visualizacoes ?? obra.views ?? obra.total_visualizacoes ?? obraLocal?.visualizacoes
    ),
    totalCurtidas: normalizarContadorObraPublica(obraLocal?.totalCurtidas),
    totalComentarios: normalizarContadorObraPublica(
      obraLocal?.totalComentarios
    ),
    totalFavoritos: normalizarContadorObraPublica(obraLocal?.totalFavoritos),
    totalConcluidas: normalizarContadorObraPublica(obraLocal?.totalConcluidas),
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

export function converterObraLocalParaDinamica(obra: ObraLocal): ObraDinamica {
  const obraDisponivel = obraLocalEstaDisponivelParaLeitura(obra);

  return {
    id: obra.id,
    origem: "local",
    titulo: obra.titulo,
    autor: obra.autor,
    autorId: obra.autorId || "",
    genero: obra.genero,
    formato: obra.formato,
    classificacaoIndicativa: obra.classificacaoIndicativa,
    avisosConteudo: obra.avisosConteudo,
    status: obra.publicado ? "Publicado" : "Rascunho",
    views: String(totalVisualizacoesObraPublica(obra)),
    likes: String(totalCurtidasObraPublica(obra)),
    comentarios: String(totalComentariosObraPublica(obra)),
    disponivel: obraDisponivel,
    slug: obra.slug,
    link: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
    sinopse: obra.sinopse,
    tags: obra.tags,
    capa: obra.capa,
    arquivoObra: obra.arquivoObra || null,
    capitulos: obra.capitulos.map((capitulo, index) => ({
      id: capitulo.id,
      numero: String(index + 1).padStart(2, "0"),
      titulo: capitulo.titulo,
      descricao: "",
      href: `/obra/${encodeURIComponent(
        obra.slug || criarSlugBase(obra.titulo)
      )}/capitulo/${index + 1}`,
      disponivel: obraDisponivel,
      lido: capitulo.lido,
      lidoEm: capitulo.lidoEm,
    })),
    ultimoCapituloLidoId: obra.ultimoCapituloLidoId,
    ultimaLeituraEm: obra.ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(obra.capitulos),
  };
}
