"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../../lib/historietasTheme";
import { useNotificacoes } from "../../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { useAdminComunidadeDesktopMode } from "./hooks/use-admin-comunidade-desktop-mode";
import { AdminComunidadeFiltersSheet } from "./components/admin-comunidade-filters-sheet";
import { adminComunidadePageCss } from "./lib/admin-comunidade-page-css";
import {
  pageStyle,
  containerStyle,
  desktopContainerStyle,
  titleHeaderStyle,
  desktopTitleHeaderStyle,
  titleHeaderActionsStyle,
  desktopTechnicalSupportButtonStyle,
  mobileTechnicalSupportButtonStyle,
  desktopNotificationButtonStyle,
  desktopNotificationBadgeStyle,
  titleSearchButtonStyle,
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  statsGridStyle,
  statCardStyle,
  statNumberStyle,
  statLabelStyle,
  toolsStyle,
  adminSearchShellStyle,
  adminSearchIconStyle,
  adminSearchInputStyle,
  adminFilterLabelButtonStyle,
  adminFilterActionIconStyle,
  statusFilterWrapStyle,
  filterButtonsStyle,
  filterButtonStyle,
  activeFilterButtonStyle,
  feedbackWrapStyle,
  errorStyle,
  successStyle,
  summaryStyle,
  summaryTitleStyle,
  clearButtonStyle,
  listStyle,
} from "./lib/admin-comunidade-styles";
import { criarLoginHrefAdminModeracao } from "./lib/admin-comunidade-route-utils";
import {
  STATUS_DENUNCIAS,
  STATUS_LABEL,
} from "./lib/admin-comunidade-status-utils";
import {
  criarMensagemErro,
} from "./lib/admin-comunidade-error-utils";
import { conteudoDenunciadoIndisponivel } from "./lib/admin-comunidade-content-utils";
import { buscarReincidenciasModeracao } from "./loaders/carregar-reincidencias-moderacao";
import {
  buscarDenunciasPerfisModeracao,
  type DenunciaPerfilComContexto,
} from "./loaders/carregar-denuncias-perfis-moderacao";
import {
  carregarDenunciasComContextoModeracao,
} from "./loaders/carregar-denuncias-contexto-moderacao";
import {
  type StatusFiltroDenuncia,
  filtrarDenunciasModeracao,
  filtrarDenunciasPerfisModeracao,
  obterDenunciasAtivas,
} from "./lib/admin-comunidade-filter-utils";
import { calcularTotaisModeracao } from "./lib/admin-comunidade-stats-utils";
import { type DenunciaComContexto } from "./lib/admin-comunidade-report-context-utils";
import { sincronizarObservacoesModeracao } from "./lib/admin-comunidade-observation-utils";
import { verificarAcessoModeracao } from "./loaders/verificar-acesso-moderacao";
import { AdminComunidadeLanguageBridge } from "./components/admin-comunidade-language-bridge";
import { AdminComunidadeProfileReportCard } from "./components/admin-comunidade-profile-report-card";
import { AdminComunidadeContentReportCard } from "./components/admin-comunidade-content-report-card";
import { useAdminComunidadeProfileReportActions } from "./hooks/use-admin-comunidade-profile-report-actions";
import { useAdminComunidadeContentReportActions } from "./hooks/use-admin-comunidade-content-report-actions";

export default function AdminComunidadePage() {
  const { language } = useHistorietasLanguage();
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [ehAdmin, setEhAdmin] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [denuncias, setDenuncias] = useState<DenunciaComContexto[]>([]);
  const [denunciasPerfis, setDenunciasPerfis] = useState<DenunciaPerfilComContexto[]>([]);
  const [reincidenciasPorUsuario, setReincidenciasPorUsuario] = useState<Record<string, number>>({});
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroDenuncia>(
    "todas"
  );
  const [busca, setBusca] = useState("");
  const [buscaModeracaoAberta, setBuscaModeracaoAberta] = useState(false);
  const [mostrarFiltrosModeracao, setMostrarFiltrosModeracao] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [menuDenunciaAbertoId, setMenuDenunciaAbertoId] = useState("");
  const isDesktop = useAdminComunidadeDesktopMode();
  const router = useRouter();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();



  async function carregarDenuncias() {
    setErro("");

    const denunciasComContexto =
      await carregarDenunciasComContextoModeracao();

    setDenuncias(denunciasComContexto);
    setObservacoes((observacoesAtuais) =>
      sincronizarObservacoesModeracao(
        observacoesAtuais,
        denunciasComContexto,
      )
    );
  }

  async function carregarReincidenciasModeracao() {
    const proximoMapa = await buscarReincidenciasModeracao();
    setReincidenciasPorUsuario(proximoMapa);
  }

  async function carregarDenunciasPerfis() {
    const denunciasComContexto = await buscarDenunciasPerfisModeracao();
    setDenunciasPerfis(denunciasComContexto);
  }


  useEffect(() => {
    let cancelado = false;

    async function iniciarModeracao() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const { user, adminConfirmado } =
          await verificarAcessoModeracao();

        if (!user) {
          if (!cancelado) {
            setUsuarioId("");
            setEhAdmin(false);
            setDenuncias([]);
            setDenunciasPerfis([]);
            setReincidenciasPorUsuario({});
            router.replace(criarLoginHrefAdminModeracao());
          }

          return;
        }

        if (!cancelado) {
          setUsuarioId(user.id);
          setEhAdmin(adminConfirmado);
        }

        if (adminConfirmado) {
          await Promise.all([
            carregarDenuncias(),
            carregarDenunciasPerfis(),
            carregarReincidenciasModeracao(),
          ]);
        }
      } catch (error) {
        if (!cancelado) {
          setErro(criarMensagemErro("Erro ao carregar moderação", error));
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    iniciarModeracao();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const denunciasAtivas = useMemo(
    () => obterDenunciasAtivas(denuncias),
    [denuncias]
  );

  const denunciasFiltradas = useMemo(
    () => filtrarDenunciasModeracao(denuncias, statusFiltro, busca),
    [busca, denuncias, statusFiltro]
  );

  const denunciasPerfisFiltradas = useMemo(
    () =>
      filtrarDenunciasPerfisModeracao(
        denunciasPerfis,
        statusFiltro,
        busca
      ),
    [busca, denunciasPerfis, statusFiltro]
  );

  useEffect(() => {
    const fecharMenuTimer = window.setTimeout(() => {
      setMenuDenunciaAbertoId("");
    }, 0);

    return () => {
      window.clearTimeout(fecharMenuTimer);
    };
  }, [busca, statusFiltro]);

  const {
    totalPendentes,
    totalEmAnalise,
    totalResolvidas,
    totalRejeitadas,
    totalPerfisPendentes,
  } = calcularTotaisModeracao(denunciasAtivas, denunciasPerfis);

  const {
    atualizarStatusDenunciaPerfil,
    removerDenunciaPerfilResolvida,
  } = useAdminComunidadeProfileReportActions({
    usuarioId,
    ehAdmin,
    acaoEmAndamento,
    denunciasPerfis,
    setDenunciasPerfis,
    setAcaoEmAndamento,
    setErro,
    setSucesso,
    setMenuDenunciaAbertoId,
  });

  const {
    atualizarStatusDenuncia,
    removerConteudoDenunciado,
    arquivarDenuncia,
    restaurarDenunciaArquivada,
    removerDenunciaResolvida,
  } = useAdminComunidadeContentReportActions({
    language,
    usuarioId,
    ehAdmin,
    acaoEmAndamento,
    denuncias,
    observacoes,
    setDenuncias,
    setObservacoes,
    setAcaoEmAndamento,
    setErro,
    setSucesso,
    setMenuDenunciaAbertoId,
  });

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
    setBuscaModeracaoAberta(false);
    setMostrarFiltrosModeracao(false);
  }

  if (carregando) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!usuarioId) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Área restrita
          </p>

          {erro && <span style={errorStyle}>{erro}</span>}
        </section>
      </main>
    );
  }

  if (!ehAdmin) {
    return (
      <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
        <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Acesso negado
          </p>

          {erro && <span style={errorStyle}>{erro}</span>}
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-admin-comunidade-root="true" style={pageThemeStyle}>
        <AdminComunidadeLanguageBridge />
      <style>{`${historietasThemeCss}${adminComunidadePageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <button
            type="button"
            onClick={() => setMostrarFiltrosModeracao(true)}
            style={adminFilterLabelButtonStyle}
          >
            <span>Moderação</span>
            <span style={adminFilterActionIconStyle}>⇅</span>
          </button>

          <div style={titleHeaderActionsStyle}>
            <Link
              href="/admin/problemas-tecnicos"
              style={
                isDesktop
                  ? desktopTechnicalSupportButtonStyle
                  : mobileTechnicalSupportButtonStyle
              }
              aria-label="Abrir problemas técnicos"
              title="Problemas técnicos"
            >
              {isDesktop ? "Problemas técnicos" : "T"}
            </Link>

            <button
              type="button"
              aria-label={buscaModeracaoAberta ? "Fechar busca" : "Abrir busca"}
              aria-expanded={buscaModeracaoAberta || Boolean(busca.trim())}
              onClick={() => setBuscaModeracaoAberta((aberta) => !aberta)}
              style={titleSearchButtonStyle}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {isDesktop ? (
              <Link
                href="/notificacoes"
                style={desktopNotificationButtonStyle}
                aria-label={
                  notificacoesNaoLidas > 0
                    ? `Notificações: ${notificacoesNaoLidas} não lidas`
                    : "Notificações"
                }
              >
                N

                {notificacoesNaoLidas > 0 ? (
                  <span style={desktopNotificationBadgeStyle}>
                    {notificacoesNaoLidas > 99
                      ? "99+"
                      : notificacoesNaoLidas}
                  </span>
                ) : null}
              </Link>
            ) : null}
          </div>
        </header>

        <section style={toolsStyle}>
          {(buscaModeracaoAberta || busca.trim()) && (
            <label style={adminSearchShellStyle}>
              <span style={adminSearchIconStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label="Buscar denúncias..."
                placeholder="Buscar denúncias..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={100}
                style={adminSearchInputStyle}
              />
            </label>
          )}

          <section className="admin-comunidade-stats" style={statsGridStyle}>
            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{denunciasAtivas.length}</strong>
              <span style={statLabelStyle}>total</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalPendentes}</strong>
              <span style={statLabelStyle}>pendentes</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalEmAnalise}</strong>
              <span style={statLabelStyle}>em análise</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalResolvidas}</strong>
              <span style={statLabelStyle}>resolvidas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalRejeitadas}</strong>
              <span style={statLabelStyle}>rejeitadas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{denunciasPerfis.length}</strong>
              <span style={statLabelStyle}>perfis</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{totalPerfisPendentes}</strong>
              <span style={statLabelStyle}>perfis pend.</span>
            </div>
          </section>

          <div style={statusFilterWrapStyle}>
            <div className="admin-comunidade-filter-buttons" style={filterButtonsStyle}>
              {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFiltro(status)}
                  style={
                    statusFiltro === status
                      ? activeFilterButtonStyle
                      : filterButtonStyle
                  }
                >
                  {status === "todas"
                    ? "Todas"
                    : status === "arquivadas"
                      ? "Arquivadas"
                      : STATUS_LABEL[status]}
                </button>
              ))}
            </div>

            {(busca || statusFiltro !== "todas") && (
              <button type="button" onClick={limparFiltros} style={clearButtonStyle}>
                Limpar filtros
              </button>
            )}
          </div>
        </section>

        {mostrarFiltrosModeracao && (
          <AdminComunidadeFiltersSheet
            statusFiltro={statusFiltro}
            busca={busca}
            onFechar={() => setMostrarFiltrosModeracao(false)}
            onSelecionarStatus={(status) => setStatusFiltro(status)}
            onLimparFiltros={limparFiltros}
          />
        )}

        {(erro || sucesso) && (
          <section style={feedbackWrapStyle}>
            {erro && <span style={errorStyle}>{erro}</span>}
            {sucesso && <span style={successStyle}>{sucesso}</span>}
          </section>
        )}

        {denunciasPerfisFiltradas.length > 0 && (
          <section style={listStyle}>
            <section style={summaryStyle}>
              <strong style={summaryTitleStyle}>
                {denunciasPerfisFiltradas.length === 1
                  ? "1 denúncia de perfil encontrada"
                  : `${denunciasPerfisFiltradas.length} denúncias de perfis encontradas`}
              </strong>
            </section>

            {denunciasPerfisFiltradas.map((denuncia) => {
              const totalReincidencias =
                reincidenciasPorUsuario[denuncia.denunciadoId] || 0;

              return (
                <AdminComunidadeProfileReportCard
                  key={denuncia.id}
                  denuncia={denuncia}
                  acaoEmAndamento={acaoEmAndamento}
                  menuDenunciaAbertoId={menuDenunciaAbertoId}
                  totalReincidencias={totalReincidencias}
                  onAlternarMenu={(menuIdPerfil) =>
                    setMenuDenunciaAbertoId((denunciaAbertaId) =>
                      denunciaAbertaId === menuIdPerfil ? "" : menuIdPerfil
                    )
                  }
                  onFecharMenu={() => setMenuDenunciaAbertoId("")}
                  onAtualizarStatus={(denunciaId, status) =>
                    void atualizarStatusDenunciaPerfil(denunciaId, status)
                  }
                  onRemoverDenunciaResolvida={(denunciaId) =>
                    void removerDenunciaPerfilResolvida(denunciaId)
                  }
                />
              );
            })}
          </section>
        )}

        <section style={summaryStyle}>
          <strong style={summaryTitleStyle}>
            {denunciasFiltradas.length === 1
              ? "1 denúncia de conteúdo encontrada"
              : `${denunciasFiltradas.length} denúncias de conteúdo encontradas`}
          </strong>
        </section>

        <section style={listStyle}>
          {denunciasFiltradas.length > 0 ? (
            denunciasFiltradas.map((denuncia) => {
              const acaoAtiva = acaoEmAndamento.startsWith(denuncia.id);
              const observacao = observacoes[denuncia.id] || "";
              const menuAberto = menuDenunciaAbertoId === denuncia.id;
              const denunciaArquivada = denuncia.arquivada;
              const conteudoIndisponivel =
                conteudoDenunciadoIndisponivel(denuncia);
              const denunciaResolvidaComConteudoIndisponivel =
                denuncia.status === "resolvida" && conteudoIndisponivel;
              const totalReincidencias = denuncia.alvoAutorId
                ? reincidenciasPorUsuario[denuncia.alvoAutorId] || 0
                : 0;

              return (
                <AdminComunidadeContentReportCard
                  key={denuncia.id}
                  denuncia={denuncia}
                  acaoEmAndamento={acaoEmAndamento}
                  acaoAtiva={acaoAtiva}
                  observacao={observacao}
                  menuAberto={menuAberto}
                  denunciaArquivada={denunciaArquivada}
                  conteudoIndisponivel={conteudoIndisponivel}
                  denunciaResolvidaComConteudoIndisponivel={
                    denunciaResolvidaComConteudoIndisponivel
                  }
                  totalReincidencias={totalReincidencias}
                  onAlternarMenu={() =>
                    setMenuDenunciaAbertoId((denunciaAbertaId) =>
                      denunciaAbertaId === denuncia.id ? "" : denuncia.id
                    )
                  }
                  onFecharMenu={() => setMenuDenunciaAbertoId("")}
                  onArquivarDenuncia={(denunciaId) =>
                    void arquivarDenuncia(denunciaId)
                  }
                  onRestaurarDenunciaArquivada={(denunciaId) =>
                    void restaurarDenunciaArquivada(denunciaId)
                  }
                  onRemoverDenunciaResolvida={(denunciaId) =>
                    void removerDenunciaResolvida(denunciaId)
                  }
                  onAtualizarStatus={(denunciaId, novoStatus) =>
                    void atualizarStatusDenuncia(denunciaId, novoStatus)
                  }
                  onRemoverConteudoDenunciado={(denunciaAtual) =>
                    void removerConteudoDenunciado(denunciaAtual)
                  }
                  onAlterarObservacao={(novoValor) =>
                    setObservacoes((observacoesAtuais) => ({
                      ...observacoesAtuais,
                      [denuncia.id]: novoValor,
                    }))
                  }
                />
              );
            })
          ) : (
            <p
              style={{
                margin: "10px 0 0",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Nenhuma denúncia encontrada
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
