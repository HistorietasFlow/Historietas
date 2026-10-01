import type { AvisoConteudo18 } from "../../../../lib/historietasAdultContent";
import { criarSlugBase } from "../../../../lib/utils";
import {
  totalComentariosObraPublica,
  totalCurtidasObraPublica,
  totalVisualizacoesObraPublica,
} from "./obra-metric-utils";
import {
  calcularProgressoLeitura,
  obraLocalEstaDisponivelParaLeitura,
} from "./obra-reading-utils";
import type { ArquivoObraLocal } from "./obra-file-utils";
import type { CapituloDinamico, CapituloLocal } from "./obra-reading-utils";

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
