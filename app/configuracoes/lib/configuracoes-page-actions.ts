import { criarAcoesConteudoConfiguracoes } from "./configuracoes-content-actions";
import { criarAcoesCamposOverlayConfiguracoes } from "./configuracoes-overlay-field-actions";

type AcoesCamposOverlayConfiguracoes = Parameters<
  typeof criarAcoesCamposOverlayConfiguracoes
>[0];
type AcoesConteudoConfiguracoes = Parameters<
  typeof criarAcoesConteudoConfiguracoes
>[0];

type AcoesPaginaConfiguracoes = AcoesCamposOverlayConfiguracoes &
  AcoesConteudoConfiguracoes;

export function criarAcoesPaginaConfiguracoes({
  router,
  setErroUsername,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setErroSenha,
  setSenhaExclusaoConta,
  setConfirmacaoExclusaoConta,
  setErroExclusaoConta,
  setMensagemAcao,
}: AcoesPaginaConfiguracoes) {
  const acoesCamposOverlay = criarAcoesCamposOverlayConfiguracoes({
    setSenhaAtual,
    setNovaSenha,
    setConfirmarNovaSenha,
    setErroSenha,
    setSenhaExclusaoConta,
    setConfirmacaoExclusaoConta,
    setErroExclusaoConta,
    setMensagemAcao,
  });
  const acoesConteudo = criarAcoesConteudoConfiguracoes({
    router,
    setErroUsername,
  });

  return {
    ...acoesCamposOverlay,
    ...acoesConteudo,
  };
}
