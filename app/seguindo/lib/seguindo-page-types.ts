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
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  totalSeguidores?: number;
  totalFavoritas?: number;
  totalConcluidas?: number;
};

export type AutorSeguido = {
  chave: string;
  nome: string;
  autorId: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalPublicadas: number;
  totalRascunhos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  totalFavoritas: number;
  totalConcluidas: number;
  totalComClassificacao: number;
  totalLidos: number;
  totalEmLeitura: number;
  progressoMedio: number;
};

export type UsuarioSeguido = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

export type SolicitacaoSeguidor = {
  id: string;
  usuario: UsuarioSeguido;
  criadoEm: string;
};

export type AtividadeSeguindo = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioHandle: string;
  usuarioAvatar: string;
  tipo: string;
  tipoRotulo: string;
  titulo: string;
  descricao: string;
  data: string;
  href: string;
};


export type FiltroSeguindo =
  | "todos"
  | "obras"
  | "autores"
  | "usuarios"
  | "em-leitura"
  | "favoritas"
  | "concluidas";

export type AbaSeguimentoPagina = "seguidores" | "seguindo";

export type OrdenacaoSeguindo = "padrao" | "recentes" | "antigos" | "titulo" | "progresso" | "capitulos";

export type AbaConteudoSeguindo = "seguidores" | "obras" | "pessoas";
