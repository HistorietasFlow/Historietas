import type { PostComunidade } from "./community-post-model";
import type { VisibilidadePostComunidade } from "./community-post-visibility";

export type AcoesPostComunidade = {
  alternarMenu: () => void;
  fecharMenu: () => void;
  salvar: () => void;
  compartilhar: () => void;
  atualizarVisibilidade: (
    visibilidade: VisibilidadePostComunidade
  ) => void;
  alternarFixado: () => void;
  remover: () => void;
  denunciar: () => void;
  votar: (opcao: string) => Promise<void>;
  alternarCurtida: () => Promise<void>;
  abrirComentarios: () => void;
  alternarSpoiler: () => void;
};

type CriarAcoesPostComunidadeParams = {
  post: PostComunidade;
  onAlternarMenu: (postId: string) => void;
  onFecharMenu: () => void;
  onSalvar: (postId: string) => void;
  onCompartilhar: (post: PostComunidade) => void;
  onAtualizarVisibilidade: (
    post: PostComunidade,
    visibilidade: VisibilidadePostComunidade
  ) => Promise<void>;
  onAlternarFixado: (post: PostComunidade) => void;
  onRemover: (postId: string) => void;
  onDenunciar: (postId: string) => void;
  onVotar: (postId: string, opcao: string) => Promise<void>;
  onAlternarCurtida: (postId: string) => Promise<void>;
  onAbrirComentarios: (postId: string) => void;
  onAlternarSpoiler: (postId: string) => void;
};

export function criarAcoesPostComunidade({
  post,
  onAlternarMenu,
  onFecharMenu,
  onSalvar,
  onCompartilhar,
  onAtualizarVisibilidade,
  onAlternarFixado,
  onRemover,
  onDenunciar,
  onVotar,
  onAlternarCurtida,
  onAbrirComentarios,
  onAlternarSpoiler,
}: CriarAcoesPostComunidadeParams): AcoesPostComunidade {
  return {
    alternarMenu: () => onAlternarMenu(post.id),
    fecharMenu: () => onFecharMenu(),
    salvar: () => {
      onFecharMenu();
      onSalvar(post.id);
    },
    compartilhar: () => {
      onFecharMenu();
      onCompartilhar(post);
    },
    atualizarVisibilidade: (visibilidade) => {
      void onAtualizarVisibilidade(post, visibilidade);
    },
    alternarFixado: () => {
      onFecharMenu();
      onAlternarFixado(post);
    },
    remover: () => {
      onFecharMenu();
      onRemover(post.id);
    },
    denunciar: () => {
      onFecharMenu();
      onDenunciar(post.id);
    },
    votar: (opcao) => onVotar(post.id, opcao),
    alternarCurtida: () => onAlternarCurtida(post.id),
    abrirComentarios: () => onAbrirComentarios(post.id),
    alternarSpoiler: () => onAlternarSpoiler(post.id),
  };
}
