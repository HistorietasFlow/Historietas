export type ObraStatus = "Em andamento" | "Pausado" | "Completo";

export type Obra = {
  titulo: string;
  autorId?: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: ObraStatus;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
};

/**
 * Catálogo estático desativado.
 *
 * Produto online não deve exibir obras, métricas ou links fictícios
 * como se fossem conteúdo real.
 *
 * Obras públicas devem vir do Supabase com `publicado = true`.
 */
export const obras: Obra[] = [];