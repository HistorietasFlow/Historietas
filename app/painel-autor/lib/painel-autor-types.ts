import type {
  ObraComMetricasPainel,
} from "./painel-autor-work-metrics";

export type CapituloLocal = {
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

export type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria:
    | "texto"
    | "documento"
    | "imagem"
    | "outro";
  criadoEm: string;
};

export type ObraLocal = {
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
  arquivoObra?:
    | ArquivoObraLocal
    | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  slug: string;
  link: string;
  totalCurtidasPainel?: number;
  totalComentariosPainel?: number;
  totalSalvosPainel?: number;
  totalLidosPainel?: number;
};

export type ObraComMetricas =
  ObraComMetricasPainel<ObraLocal>;
