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
};

export type ArquivoObraLocal = {
  nome: string;
  tipo: "imagem" | "documento" | "texto" | "outro";
  tamanho: number;
  conteudo: string;
  enviadoEm: string;
};

export type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  autorAvatarRanking?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
  arquivoObra: ArquivoObraLocal | null;
  totalCurtidasRanking?: number;
  totalComentariosRanking?: number;
  totalSalvosRanking?: number;
  totalViewsRanking?: number;
  totalSeguidoresRanking?: number;
  totalSeguidoresAutorRanking?: number;
  totalAvaliacoesRanking?: number;
  mediaAvaliacoesRanking?: number;
};

export type SupabaseObraRow = {
  id: string;
  user_id: string | null;
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
  atualizado_em: string | null;
};

export type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string | null;
  titulo: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export type SupabaseProgressoLeituraEmAltaRow = {
  obra_id: string | null;
  capitulo_id: string | null;
  lido: boolean | null;
  atualizado_em: string | null;
};

export type SupabaseProfileAutorRankingRow = {
  id: string | null;
  user_id: string | null;
  nome: string | null;
  avatar_url: string | null;
};

export type AvaliacaoRankingObra = {
  total: number;
  media: number;
};

export type ObraRanking = {
  id: string;
  storageId: string;
  tipo: "local";
  titulo: string;
  autor: string;
  autorId?: string;
  autorAvatar: string;
  seguidoresAutor: number;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  status: string;
  href: string;
  disponivel: boolean;
  capa: string;
  capaNome: string;
  capitulos: number;
  capitulosLidos: number;
  progressoLeitura: number;
  ultimoCapituloLidoTitulo: string;
  ultimoCapituloLidoHref: string;
  ultimaLeituraEm: string;
  curtidas: number;
  comentarios: number;
  salvos: number;
  views: number;
  avaliacoes: number;
  mediaAvaliacao: number;
  pontuacao: number;
  criadaEmTimestamp: number;
};

export type AutorRanking = {
  id: string;
  nome: string;
  autorId: string;
  avatar: string;
  href: string;
  obras: number;
  capitulos: number;
  seguidores: number;
  seguidoresObras: number;
  views: number;
  curtidas: number;
  comentarios: number;
  avaliacoes: number;
  mediaAvaliacao: number;
  pontuacao: number;
};

export type TipoRanking =
  | "geral"
  | "lidas"
  | "curtidas"
  | "comentadas"
  | "salvas"
  | "recentes"
  | "capitulos";
