import type { ExecutarAcaoConfiguracoes } from "./configuracoes-callback-primitives";

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

export type VoltarConfiguracoes = ExecutarAcaoConfiguracoes;
