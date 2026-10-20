export type PreferenciasConta = {
  nomeExibicao: string;
  username: string;
  emailContato: string;
  receberAvisos: boolean;
};

export type ResumoLocal = {
  obras: number;
  notificacoes: number;
  lancamentos: number;
  favoritas: number;
  concluidas: number;
  seguindoObras: number;
  seguindoAutores: number;
};

export type UsuarioConfiguracoes = {
  id: string;
  nome: string;
  username: string;
  email: string;
};

export type ResultadoContagemResumoSupabase = {
  ok: boolean;
  total: number;
};

export type TabelaResumoSupabase =
  | "obras"
  | "favoritos"
  | "concluidas"
  | "seguindo_obras"
  | "seguindo_usuarios";

export type PerfilConfiguracoesSupabase = {
  nome: string;
  username: string;
};

export type UsuarioBloqueadoConfiguracoesRpcRow = {
  user_id: string | null;
  nome: string | null;
  username: string | null;
  avatar_url: string | null;
  bloqueado_em: string | null;
};

export type UsuarioBloqueadoConfiguracoes = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bloqueadoEm: string;
};

export const preferenciasPadrao: PreferenciasConta = {
  nomeExibicao: "",
  username: "",
  emailContato: "",
  receberAvisos: true,
};

export const resumoPadrao: ResumoLocal = {
  obras: 0,
  notificacoes: 0,
  lancamentos: 0,
  favoritas: 0,
  concluidas: 0,
  seguindoObras: 0,
  seguindoAutores: 0,
};
