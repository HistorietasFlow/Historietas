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
