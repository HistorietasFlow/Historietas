export type SupabaseComentarioRow = {
  id: string;
  post_id: string;
  autor_id: string;
  autor_nome: string;
  texto: string;
  comentario_pai_id: string | null;
  criado_em: string;
};
