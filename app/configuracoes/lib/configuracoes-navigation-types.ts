export type RouterConfiguracoes = {
  replace: (href: string) => void;
};

export type RouterConfiguracoesAtualizavel = RouterConfiguracoes & {
  refresh: () => void;
};

export type RouterConfiguracoesHistorico = {
  back: () => void;
};
