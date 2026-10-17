"use client";

import Link from "next/link";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type { CapituloLocal, ObraLocal } from "../lib/ler-capitulo-work-normalization";
import {
  criarEstiloTituloCapitulo,
  containerStyle,
  topStyle,
  headerActionsStyle,
  desktopHeaderActionsStyle,
  logoStyle,
  logoMarkStyle,
  logoViewsIconStyle,
  logoViewsCountStyle,
  focusTopSingleSettingsButtonStyle,
  focusChapterHeaderStyle,
  focusSettingsPanelStyle,
  settingsInfoStyle,
  settingsInfoPrimaryStyle,
  settingsInfoSecondaryStyle,
  chapterSelectStyle,
  focusFontScaleBoxStyle,
  fontScaleHeaderStyle,
  fontScaleLabelStyle,
  fontScaleValueStyle,
  fontScaleGridStyle,
  desktopFontScaleGridStyle,
  focusFontScaleButtonStyle,
  fontScaleButtonActiveStyle,
  settingsGridStyle,
  settingsActionActiveStyle,
  focusMutedSettingsActionStyle,
  focusTextCardStyle,
  chapterLikeButtonLayoutStyle,
  chapterHeartIconStyle,
  chapterLikeCountStyle,
  focusReaderActionsStyle,
  focusActionButtonStyle,
  focusActiveActionButtonStyle,
  focusActiveSaveButtonStyle,
  focusActiveCommentButtonStyle,
  commentStatusStyle,
  focusChapterNavigationStyle,
  focusChapterNavButtonStyle,
  focusChapterNavButtonPrimaryStyle,
  focusReturnToWorkButtonStyle,
  focusChapterNavDisabledStyle,
  desktopContainerStyle,
  desktopTopStyle,
  desktopFocusSettingsButtonStyle,
  desktopFocusChapterHeaderStyle,
  desktopFocusSettingsPanelStyle,
  desktopChapterSelectStyle,
  desktopSettingsGridStyle,
  desktopFocusTextCardStyle,
  desktopFocusReaderActionsStyle,
  desktopFocusChapterNavigationStyle,
} from "../lib/ler-capitulo-layout-styles";

export type TamanhoFonte = 1 | 2 | 3 | 4 | 5;

type Props = {
  obraAtual: ObraLocal;
  capituloAtual: CapituloLocal;
  isDesktop: boolean;
  mostrarAjustes: boolean;
  setMostrarAjustes: Dispatch<SetStateAction<boolean>>;
  language: HistorietasLanguage;
  metricasCapitulo: {
    totalVisualizacoes: number;
    totalCurtidas: number;
    totalSalvos: number;
    totalComentarios: number;
    curtiu: boolean;
    salvo: boolean;
  };
  tamanhoFonte: TamanhoFonte;
  setTamanhoFonte: Dispatch<SetStateAction<TamanhoFonte>>;
  mostrarLinhaProgresso: boolean;
  setMostrarLinhaProgresso: Dispatch<SetStateAction<boolean>>;
  usuarioIdLogado: string;
  obterAutorIdSeguro: (obra: Pick<ObraLocal, "autorId">) => string;
  statusLeituraTexto: string;
  totalPalavras: number;
  trocarCapitulo: (id: string) => void;
  abrirDenunciaCapituloAtual: () => Promise<void>;
  criarTextoLeituraDesktopStyle: (tamanhoFonte: TamanhoFonte) => CSSProperties;
  criarTextoLeituraStyle: (tamanhoFonte: TamanhoFonte) => CSSProperties;
  curtidaCapituloSalvando: boolean;
  alternarCurtida: () => Promise<void>;
  salvoCapituloSalvando: boolean;
  alternarSalvo: () => Promise<void>;
  alternarComentarioVisivel: () => Promise<void>;
  mostrarComentario: boolean;
  lidoCapituloSalvando: boolean;
  alternarLido: () => Promise<void>;
  mensagemAcao: string;
  capituloAnterior: CapituloLocal | null;
  proximoCapitulo: CapituloLocal | null;
  voltarHref: string;
  formatarContadorCapituloLeitor: (valor: number) => string;
  FONT_SCALE_VALUES: TamanhoFonte[];
};

export default function LerCapituloReaderContent({
  obraAtual,
  capituloAtual,
  isDesktop,
  mostrarAjustes,
  setMostrarAjustes,
  language,
  metricasCapitulo,
  tamanhoFonte,
  setTamanhoFonte,
  mostrarLinhaProgresso,
  setMostrarLinhaProgresso,
  usuarioIdLogado,
  obterAutorIdSeguro,
  statusLeituraTexto,
  totalPalavras,
  trocarCapitulo,
  abrirDenunciaCapituloAtual,
  criarTextoLeituraDesktopStyle,
  criarTextoLeituraStyle,
  curtidaCapituloSalvando,
  alternarCurtida,
  salvoCapituloSalvando,
  alternarSalvo,
  alternarComentarioVisivel,
  mostrarComentario,
  lidoCapituloSalvando,
  alternarLido,
  mensagemAcao,
  capituloAnterior,
  proximoCapitulo,
  voltarHref,
  formatarContadorCapituloLeitor,
  FONT_SCALE_VALUES,
}: Props) {
  return (
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : topStyle}>
          <Link
            href="/"
            style={logoStyle}
            aria-label={`${formatarContadorCapituloLeitor(
              metricasCapitulo.totalVisualizacoes
            )} ${
              metricasCapitulo.totalVisualizacoes === 1
                ? "visualização"
                : "visualizações"
            }`}
          >
            <span style={logoMarkStyle} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                style={logoViewsIconStyle}
              >
                <path
                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="2.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </span>

            <span
              data-historietas-i18n-ignore="true"
              style={logoViewsCountStyle}
            >
              {formatarContadorCapituloLeitor(
                metricasCapitulo.totalVisualizacoes
              )}
            </span>
          </Link>

          <div
            style={
              isDesktop
                ? desktopHeaderActionsStyle
                : headerActionsStyle
            }
          >
            <button
              type="button"
              onClick={() => setMostrarAjustes((valorAtual) => !valorAtual)}
              style={
                isDesktop
                  ? desktopFocusSettingsButtonStyle
                  : focusTopSingleSettingsButtonStyle
              }
            >
              {mostrarAjustes ? "Fechar" : "Ajustes"}
            </button>
          </div>
        </header>

        <section
          style={
            isDesktop
              ? desktopFocusChapterHeaderStyle
              : focusChapterHeaderStyle
          }
        >
          <h1
            style={criarEstiloTituloCapitulo(
              capituloAtual.titulo,
              isDesktop
            )}
          >
            <span data-historietas-i18n-ignore="true">
              {capituloAtual.titulo}
            </span>
          </h1>
        </section>

        {mostrarAjustes && (
          <section
            style={
              isDesktop
                ? desktopFocusSettingsPanelStyle
                : focusSettingsPanelStyle
            }
          >
            <div style={settingsInfoStyle}>
              <p
                data-historietas-i18n-ignore="true"
                style={settingsInfoPrimaryStyle}
              >
                {obraAtual.titulo} · {obraAtual.autor}
              </p>

              <p style={settingsInfoSecondaryStyle}>
                {statusLeituraTexto} · {totalPalavras}{" "}
                {totalPalavras === 1 ? "palavra" : "palavras"}
              </p>
            </div>

            <select
              aria-label={
                language === "en"
                  ? "Select chapter"
                  : language === "es"
                    ? "Seleccionar capítulo"
                    : "Selecionar capítulo"
              }
              data-historietas-i18n-ignore="true"
              value={capituloAtual.id}
              onChange={(event) => trocarCapitulo(event.target.value)}
              style={isDesktop ? desktopChapterSelectStyle : chapterSelectStyle}
            >
              {obraAtual.capitulos.map((capitulo, index) => (
                <option key={capitulo.id} value={capitulo.id}>
                  {language === "en" ? "Chapter" : "Capítulo"} {index + 1} - {capitulo.titulo}
                </option>
              ))}
            </select>

            <div style={focusFontScaleBoxStyle}>
              <div style={fontScaleHeaderStyle}>
                <span style={fontScaleLabelStyle}>Tamanho da fonte</span>
                <span style={fontScaleValueStyle}>Fonte {tamanhoFonte}</span>
              </div>

              <div style={isDesktop ? desktopFontScaleGridStyle : fontScaleGridStyle}>
                {FONT_SCALE_VALUES.map((valorFonte) => (
                  <button
                    key={valorFonte}
                    type="button"
                    onClick={() => setTamanhoFonte(valorFonte)}
                    style={
                      tamanhoFonte === valorFonte
                        ? fontScaleButtonActiveStyle
                        : focusFontScaleButtonStyle
                    }
                    aria-label={`Usar fonte ${valorFonte}`}
                  >
                    {valorFonte}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                ...(isDesktop ? desktopSettingsGridStyle : settingsGridStyle),
                gridTemplateColumns: !(
                  usuarioIdLogado &&
                  obterAutorIdSeguro(obraAtual) === usuarioIdLogado
                )
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(1, minmax(0, 1fr))",
              }}
            >
              <button
                type="button"
                onClick={() => setMostrarLinhaProgresso((valorAtual) => !valorAtual)}
                style={
                  mostrarLinhaProgresso
                    ? settingsActionActiveStyle
                    : focusMutedSettingsActionStyle
                }
              >
                {mostrarLinhaProgresso ? "Barra ativa" : "Barra de progresso"}
              </button>

              {!(
                usuarioIdLogado &&
                obterAutorIdSeguro(obraAtual) === usuarioIdLogado
              ) ? (
                <button
                  type="button"
                  onClick={() => void abrirDenunciaCapituloAtual()}
                  style={focusMutedSettingsActionStyle}
                >
                  Denunciar
                </button>
              ) : null}
            </div>
          </section>
        )}

        <article style={isDesktop ? desktopFocusTextCardStyle : focusTextCardStyle}>
          <p style={isDesktop ? criarTextoLeituraDesktopStyle(tamanhoFonte) : criarTextoLeituraStyle(tamanhoFonte)}>
            {capituloAtual.texto ? (
              <span data-historietas-i18n-ignore="true">
                {capituloAtual.texto}
              </span>
            ) : (
              "Este capítulo ainda não possui texto."
            )}
          </p>
        </article>

        <section
          style={
            isDesktop
              ? desktopFocusReaderActionsStyle
              : focusReaderActionsStyle
          }
        >
          <button
            type="button"
            data-historietas-reader-like="chapter"
            onClick={() => void alternarCurtida()}
            disabled={curtidaCapituloSalvando}
            aria-pressed={metricasCapitulo.curtiu}
            aria-label={`${
              metricasCapitulo.curtiu
                ? "Remover curtida do capítulo"
                : "Curtir capítulo"
            }. ${formatarContadorCapituloLeitor(
              metricasCapitulo.totalCurtidas,
            )} ${
              metricasCapitulo.totalCurtidas === 1 ? "curtida" : "curtidas"
            }`}
            style={{
              ...(metricasCapitulo.curtiu
                ? focusActiveActionButtonStyle
                : focusActionButtonStyle),
              ...chapterLikeButtonLayoutStyle,
              opacity: curtidaCapituloSalvando ? 0.58 : 1,
              cursor: curtidaCapituloSalvando
                ? "not-allowed"
                : "pointer",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{
                ...chapterHeartIconStyle,
                animation: metricasCapitulo.curtiu
                  ? "historietas-reader-heart-pop 260ms ease-out"
                  : "none",
              }}
            >
              <path
                d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                fill={
                  metricasCapitulo.curtiu
                    ? "var(--historietas-reader-heart, #FFFFFF)"
                    : "none"
                }
                stroke={
                  metricasCapitulo.curtiu
                    ? "var(--historietas-reader-heart, #FFFFFF)"
                    : "#FFFFFF"
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={chapterLikeCountStyle}>
              {formatarContadorCapituloLeitor(metricasCapitulo.totalCurtidas)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void alternarSalvo()}
            disabled={salvoCapituloSalvando}
            aria-pressed={metricasCapitulo.salvo}
            aria-label={
              metricasCapitulo.salvo
                ? "Remover capítulo dos salvos"
                : "Salvar capítulo"
            }
            style={{
              ...(metricasCapitulo.salvo
                ? focusActiveSaveButtonStyle
                : focusActionButtonStyle),
              opacity: salvoCapituloSalvando ? 0.72 : 1,
              cursor: salvoCapituloSalvando ? "wait" : "pointer",
            }}
          >
            {metricasCapitulo.salvo ? "Salvo ✓" : "Salvar"}{" "}
            {formatarContadorCapituloLeitor(metricasCapitulo.totalSalvos)}
          </button>

          <button
            type="button"
            onClick={() => void alternarComentarioVisivel()}
            aria-label={`${metricasCapitulo.totalComentarios} comentários`}
            style={
              mostrarComentario || metricasCapitulo.totalComentarios > 0
                ? focusActiveCommentButtonStyle
                : focusActionButtonStyle
            }
          >
            💬 {formatarContadorCapituloLeitor(metricasCapitulo.totalComentarios)}
          </button>

          <button
            type="button"
            onClick={() => void alternarLido()}
            disabled={lidoCapituloSalvando}
            aria-pressed={capituloAtual.lido}
            aria-label={
              capituloAtual.lido
                ? "Marcar capítulo como não lido"
                : "Marcar capítulo como lido"
            }
            style={{
              ...(capituloAtual.lido
                ? focusActiveActionButtonStyle
                : focusActionButtonStyle),
              opacity: lidoCapituloSalvando ? 0.72 : 1,
              cursor: lidoCapituloSalvando ? "wait" : "pointer",
            }}
          >
            {lidoCapituloSalvando
              ? "Salvando..."
              : capituloAtual.lido
              ? "Lido ✓"
              : "Lido"}
          </button>
        </section>

        {mensagemAcao && <p style={commentStatusStyle}>{mensagemAcao}</p>}


        <section
          style={
            isDesktop
              ? desktopFocusChapterNavigationStyle
              : focusChapterNavigationStyle
          }
        >
          {capituloAnterior ? (
            <button
              type="button"
              onClick={() => trocarCapitulo(capituloAnterior.id)}
              style={focusChapterNavButtonStyle}
            >
              ← Capítulo anterior
            </button>
          ) : (
            <span style={focusChapterNavDisabledStyle}>← Sem anterior</span>
          )}

          {proximoCapitulo ? (
            <button
              type="button"
              onClick={() => trocarCapitulo(proximoCapitulo.id)}
              style={focusChapterNavButtonPrimaryStyle}
            >
              Próximo capítulo →
            </button>
          ) : (
            <Link href={voltarHref} style={focusReturnToWorkButtonStyle}>
              Voltar para obra
            </Link>
          )}
        </section>
      </section>
  );
}
