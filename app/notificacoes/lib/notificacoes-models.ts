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

export type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
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
};

export type NotificacaoLocal = {
  id: string;
  obraId: string;
  capituloId: string;
  link: string;
  titulo: string;
  mensagem: string;
  tipo:
    | "novo-capitulo"
    | "comentario-obra"
    | "curtida-obra"
    | "comentario-capitulo"
    | "curtida-capitulo"
    | "curtida-comentario-capitulo"
    | "comentario-comunidade"
    | "curtida-comunidade"
    | "review-comunidade"
    | "atividade-comunidade"
    | "curtida-diario"
    | "comentario-diario"
    | "atividade-diario"
    | "novo-seguidor"
    | "solicitacao-seguidor"
    | "denuncia-comunidade"
    | "moderacao-comunidade"
    | "problema-tecnico";
  lida: boolean;
  criadaEm: string;
  autorId?: string;
  autorNome?: string;
  autorAvatar?: string;
  solicitacaoId?: string;
};
