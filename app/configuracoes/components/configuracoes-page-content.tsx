import { ConfiguracoesAccountActionsSection } from "./configuracoes-account-actions-section";
import { ConfiguracoesAccountDetailsSection } from "./configuracoes-account-details-section";
import { ConfiguracoesDataSection } from "./configuracoes-data-section";
import { ConfiguracoesDiaryPrivacySection } from "./configuracoes-diary-privacy-section";
import { ConfiguracoesModerationSection } from "./configuracoes-moderation-section";
import { ConfiguracoesPageHeader } from "./configuracoes-page-header";
import { ConfiguracoesPreferencesSection } from "./configuracoes-preferences-section";
import { ConfiguracoesProfileCard } from "./configuracoes-profile-card";
import { ConfiguracoesProfilePrivacySection } from "./configuracoes-profile-privacy-section";
import { ConfiguracoesProfileTabVisibilitySection } from "./configuracoes-profile-tab-visibility-section";
import { ConfiguracoesSearch } from "./configuracoes-search";
import { ConfiguracoesSupportSection } from "./configuracoes-support-section";
import { ConfiguracoesUsageSummarySection } from "./configuracoes-usage-summary-section";
import { containerStyle } from "../lib/configuracoes-shell-styles";
import type { ConfiguracoesPageContentProps } from "./configuracoes-page-content-props";

export function ConfiguracoesPageContent({
  busca,
  onBuscaChange,
  onVoltar,
  traduzirTexto,
  deveMostrar,
  preferencias,
  privacidade,
  resumo,
  totalBiblioteca,
  notificacoesNaoLidas,
  usuarioNome,
  usuarioEmail,
  erroUsername,
  salvando,
  adminLiberado,
  mostrarUsuariosBloqueados,
  usuariosBloqueados,
  carregandoUsuariosBloqueados,
  desbloqueandoUsuarioId,
  erroUsuariosBloqueados,
  onAtualizarPreferencia,
  onLimparErroUsername,
  onSalvar,
  onAbrirSeguranca,
  onAlternarPerfilPrivado,
  onAlternarAprovacaoNovosSeguidores,
  onCarregarUsuariosBloqueados,
  onAlternarUsuariosBloqueados,
  onDesbloquearUsuario,
  onAtualizarPrivacidade,
  onAplicarPrivacidadeAtualizada,
  onAlternarReceberAvisos,
  onCopiarBackup,
  onBaixarBackup,
  onAbrirExclusaoConta,
  onSairDaConta,
}: ConfiguracoesPageContentProps) {
  return (
    <section style={containerStyle}>
      <ConfiguracoesPageHeader
        onVoltar={onVoltar}
        traduzirTexto={traduzirTexto}
      />

      <ConfiguracoesSearch
        busca={busca}
        onBuscaChange={onBuscaChange}
        traduzirTexto={traduzirTexto}
      />

      <ConfiguracoesProfileCard
        nomeExibicao={preferencias.nomeExibicao}
        username={preferencias.username}
        emailContato={preferencias.emailContato}
        usuarioNome={usuarioNome}
        usuarioEmail={usuarioEmail}
        traduzirTexto={traduzirTexto}
      />

      <ConfiguracoesAccountDetailsSection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        preferencias={preferencias}
        erroUsername={erroUsername}
        salvando={salvando}
        onAtualizarPreferencia={onAtualizarPreferencia}
        onLimparErroUsername={onLimparErroUsername}
        onSalvar={onSalvar}
        onAbrirSeguranca={onAbrirSeguranca}
      />

      <ConfiguracoesProfilePrivacySection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        privacidade={privacidade}
        onAlternarPerfilPrivado={onAlternarPerfilPrivado}
        onAlternarAprovacaoNovosSeguidores={onAlternarAprovacaoNovosSeguidores}
        mostrarUsuariosBloqueados={mostrarUsuariosBloqueados}
        usuariosBloqueados={usuariosBloqueados}
        carregandoUsuariosBloqueados={carregandoUsuariosBloqueados}
        desbloqueandoUsuarioId={desbloqueandoUsuarioId}
        erroUsuariosBloqueados={erroUsuariosBloqueados}
        onCarregarUsuariosBloqueados={onCarregarUsuariosBloqueados}
        onAlternarUsuariosBloqueados={onAlternarUsuariosBloqueados}
        onDesbloquearUsuario={onDesbloquearUsuario}
      />

      <ConfiguracoesProfileTabVisibilitySection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        privacidade={privacidade}
        onAtualizarPrivacidade={onAtualizarPrivacidade}
      />

      <ConfiguracoesDiaryPrivacySection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        privacidade={privacidade}
        onAplicarPrivacidadeAtualizada={onAplicarPrivacidadeAtualizada}
        onAtualizarPrivacidade={onAtualizarPrivacidade}
      />

      <ConfiguracoesModerationSection
        adminLiberado={adminLiberado}
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
      />

      <ConfiguracoesUsageSummarySection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        resumo={resumo}
        totalBiblioteca={totalBiblioteca}
        notificacoesNaoLidas={notificacoesNaoLidas}
      />

      <ConfiguracoesPreferencesSection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        preferencias={preferencias}
        onAlternarReceberAvisos={onAlternarReceberAvisos}
      />

      <ConfiguracoesDataSection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        resumo={resumo}
        onCopiarBackup={onCopiarBackup}
        onBaixarBackup={onBaixarBackup}
      />

      <ConfiguracoesSupportSection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
      />

      <ConfiguracoesAccountActionsSection
        deveMostrar={deveMostrar}
        traduzirTexto={traduzirTexto}
        onAbrirExclusaoConta={onAbrirExclusaoConta}
        onSairDaConta={onSairDaConta}
      />
    </section>
  );
}
