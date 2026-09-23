export type SupabasePostRow = {
  id: string;
  autor_id: string;
  autor_nome: string;
  categoria: string;
  tipo_publicacao: string | null;
  tem_spoiler: boolean | null;
  texto: string;
  obra_relacionada: string | null;
  criado_em: string;
  fixado: boolean | null;
  fixado_em: string | null;
  fixado_por: string | null;
  visibilidade: string | null;
};
