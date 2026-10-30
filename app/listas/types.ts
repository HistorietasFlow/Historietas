import { type TipoAlvoDenuncia } from "../../components/DenunciaModal";

export type ModoLista = "perfil" | "obras" | "autores";
export type OrigemPerfil = "diario" | "biblioteca";
export type CategoriaPerfil =
  | "tudo"
  | "lendo"
  | "quero-ler"
  | "favoritas"
  | "concluidas"
  | "avaliacoes"
  | "historico";
export type OrdenacaoLista = "recentes" | "titulo" | "avaliacao" | "popularidade";
export type VisibilidadeAnotacaoListas = "publico" | "parcial" | "privado";
export type QuemPodeComentarAnotacaoListas =
  | "herdar"
  | "todos"
  | "seguidores"
  | "ninguem";
export type VisibilidadeComentariosAnotacaoListas =
  | "herdar"
  | "publico"
  | "seguidores"
  | "somente_eu";
export type TipoDiarioListas =
  | "lendo"
  | "quero_ler"
  | "favorita"
  | "concluida"
  | "avaliacao"
  | "review"
  | "atividade";

export type CapituloLista = {
  id: string;
  obraId: string;
  titulo: string;
  ordem: number;
  criadoEm: string;
};

export type ObraLista = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: CapituloLista[];
  notaMedia: number;
  totalAvaliacoes: number;
};

export type PerfilLista = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

export type ItemObraLista = {
  chave: string;
  obra: ObraLista;
  categorias: CategoriaPerfil[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
  anotacao?: string;
  anotacaoId?: string;
  anotacaoTipo?: TipoDiarioListas;
  anotacaoVisibilidade?: VisibilidadeAnotacaoListas;
  anotacaoQuemPodeComentar?: QuemPodeComentarAnotacaoListas;
  anotacaoVisibilidadeComentarios?: VisibilidadeComentariosAnotacaoListas;
  anotacaoPermitirCurtidas?: boolean;
  anotacaoSpoiler?: boolean;
};

export type AutorLista = {
  id: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  notaMedia: number;
  totalAvaliacoes: number;
  generos: string[];
  criadaEm: string;
};

export type ListasPerfilEstado = Record<CategoriaPerfil, ItemObraLista[]>;

export type EditorAnotacaoListasEstado = {
  aberto: boolean;
  obraId: string;
  anotacaoId: string;
  tipo: TipoDiarioListas;
  texto: string;
  visibilidade: VisibilidadeAnotacaoListas;
  quemPodeComentar: QuemPodeComentarAnotacaoListas;
  visibilidadeComentarios: VisibilidadeComentariosAnotacaoListas;
  permitirCurtidas: boolean;
  contemSpoiler: boolean;
  salvando: boolean;
  erro: string;
};

export type AlvoDenunciaDiarioListas = {
  tipo: Extract<
    TipoAlvoDenuncia,
    "diario_anotacao" | "comentario_diario"
  >;
  id: string;
  titulo: string;
};
