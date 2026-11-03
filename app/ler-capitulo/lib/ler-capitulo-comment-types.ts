export type ComentarioCapituloPublico = {
  id: string;
  userId: string;
  nome: string;
  avatar: string;
  texto: string;
  criadoEm: string;
  comentarioPaiId: string;
  meuComentario: boolean;
  curtidas: string[];
};

export type ComentariosCapituloPost = {
  id: string;
  comentarios: ComentarioCapituloPublico[];
};
