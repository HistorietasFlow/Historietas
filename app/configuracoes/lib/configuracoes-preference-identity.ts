import type { RefObject } from "react";

export type IdentidadePreferenciasConfiguracoes = { usuarioId: string; versao: number };
export type ReferenciaIdentidadePreferenciasConfiguracoes = RefObject<IdentidadePreferenciasConfiguracoes>;

export function preferenciasDaContaEstaoAtuais(
  referencia: ReferenciaIdentidadePreferenciasConfiguracoes,
  esperada: IdentidadePreferenciasConfiguracoes,
) {
  return referencia.current.usuarioId === esperada.usuarioId &&
    referencia.current.versao === esperada.versao;
}
