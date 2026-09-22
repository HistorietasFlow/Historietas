export type ComentariosSheetProps<TPost> = {
  post: TPost | null;
  podeComentar: boolean;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatar: string;
  erroInteracao: string;
  isDesktop: boolean;
  onFechar: () => void;
  onEnviar: (
    postId: string,
    texto: string,
    comentarioPaiId: string
  ) => boolean | Promise<boolean>;
  onCurtirComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onRemoverComentario: (postId: string, comentarioId: string) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};
