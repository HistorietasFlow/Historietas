import type { ComentarioComunidade } from "./community-comment";

export type PostComunidade<
  TCategoria,
  TTipoPublicacao,
  TVisibilidade,
> = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string;
  categoria: TCategoria;
  tipoPublicacao: TTipoPublicacao;
  temSpoiler: boolean;
  texto: string;
  obraRelacionada: string;
  capituloRelacionado: string;
  criadoEm: string;
  fixado: boolean;
  fixadoEm: string;
  fixadoPor: string;
  curtidas: string[];
  comentarios: ComentarioComunidade[];
  visibilidade: TVisibilidade;
};
