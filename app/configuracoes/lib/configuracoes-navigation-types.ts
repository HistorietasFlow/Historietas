import type { ExecutarAcaoConfiguracoes } from "./configuracoes-callback-types";

export type NavegarConfiguracoes = (href: string) => void;

export type RouterConfiguracoes = {
  replace: NavegarConfiguracoes;
};

export type RouterConfiguracoesAtualizavel = RouterConfiguracoes & {
  refresh: ExecutarAcaoConfiguracoes;
};

export type RouterConfiguracoesHistorico = {
  back: ExecutarAcaoConfiguracoes;
};

export type RedirecionarLoginConfiguracoes = ExecutarAcaoConfiguracoes;

export type AtualizarRotaConfiguracoes = ExecutarAcaoConfiguracoes;
