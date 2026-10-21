import {
  criarPrivacidadeAtualizadaConfiguracoes,
  criarPrivacidadeComAprovacaoAlternadaConfiguracoes,
  criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes,
} from "./configuracoes-privacy-preference-state-utils";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";

export function atualizarPrivacidadeConfiguracoes<
  K extends keyof PreferenciasPrivacidadeHistorietas,
>({
  privacidade,
  campo,
  valor,
  aplicarPrivacidadeAtualizada,
}: {
  privacidade: PreferenciasPrivacidadeHistorietas;
  campo: K;
  valor: PreferenciasPrivacidadeHistorietas[K];
  aplicarPrivacidadeAtualizada: (
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) => void;
}) {
  aplicarPrivacidadeAtualizada(
    criarPrivacidadeAtualizadaConfiguracoes(privacidade, campo, valor),
  );
}

export function alternarPerfilPrivadoConfiguracoes({
  privacidade,
  aplicarPrivacidadeAtualizada,
}: {
  privacidade: PreferenciasPrivacidadeHistorietas;
  aplicarPrivacidadeAtualizada: (
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) => void;
}) {
  aplicarPrivacidadeAtualizada(
    criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes(privacidade),
  );
}

export function alternarAprovacaoNovosSeguidoresConfiguracoes({
  privacidade,
  aplicarPrivacidadeAtualizada,
}: {
  privacidade: PreferenciasPrivacidadeHistorietas;
  aplicarPrivacidadeAtualizada: (
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) => void;
}) {
  aplicarPrivacidadeAtualizada(
    criarPrivacidadeComAprovacaoAlternadaConfiguracoes(privacidade),
  );
}
