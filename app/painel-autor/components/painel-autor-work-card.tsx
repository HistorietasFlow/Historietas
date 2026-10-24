"use client";

import Link from "next/link";
import { useState } from "react";
import { criarSlugBase } from "../../../lib/utils";
import { usePainelAutorWorkActionsBodyLock } from "../hooks/use-painel-autor-work-actions-body-lock";
import {
  criarPainelCoverDesktopStyle,
  criarPainelCoverStyle,
} from "../lib/painel-autor-cover-style-utils";
import {
  coverGlowStyle,
  coverLinkStyle,
  draftStatusStyle,
  publishedStatusStyle,
  statusRowStyle,
  workCardStyle,
  workContentStyle,
} from "../lib/painel-autor-work-card-layout-style-utils";
import {
  authorStyle,
  workCardCommentMetaStyle,
  workCardHeartMetaStyle,
  workMetaLineStyle,
  workTitleStyle,
} from "../lib/painel-autor-work-card-info-style-utils";
import {
  sheetStatHeartIconStyle,
  sheetStatIconStyle,
  sheetStatInlineStyle,
  sheetStatValueStyle,
  sheetStatsRowStyle,
} from "../lib/painel-autor-work-card-stats-style-utils";
import {
  actionsGridStyle,
  chapterButtonStyle,
  deleteButtonStyle,
  editButtonStyle,
  fileButtonStyle,
  openButtonStyle,
  readButtonStyle,
  shareButtonStyle,
  workCardDotsButtonStyle,
} from "../lib/painel-autor-work-actions-style-utils";
import {
  workActionSheetHandleStyle,
  workActionSheetHeaderStyle,
  workActionSheetOverlayStyle,
  workActionSheetStyle,
  workActionSheetTextBlockStyle,
  workActionSheetTitleStyle,
} from "../lib/painel-autor-work-action-sheet-style-utils";
import {
  desktopCardActionsGridStyle,
  desktopSheetStatsRowStyle,
  desktopWorkCardStyle,
  desktopWorkContentStyle,
} from "../lib/painel-autor-desktop-compositions-style-utils";
import {
  obraPublicadaComConteudoPainel,
  obterStatusPainelAutor,
} from "../lib/painel-autor-work-status-utils";
import {
  criarHrefLeituraCapituloPainel,
  criarPerfilAutorHref,
} from "../lib/painel-autor-route-utils";
import { obterCapitulosPublicadosPainel } from "../lib/painel-autor-reading-progress-utils";

type CapituloPainelCard = {
  id: string;
  publicado?: boolean;
};

type ObraPainelCardBase = {
  id: string;
  autorId?: string;
  titulo: string;
  autor: string;
  capa: string;
  arquivoObra?: object | null;
  publicado: boolean;
  capitulos: CapituloPainelCard[];
  ultimoCapituloLido: CapituloPainelCard | null;
  visualizacoes: number;
  slug?: string;
  link?: string;
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
};

export function ObraPainelCard<T extends ObraPainelCardBase>({
  obra,
  isDesktop,
  onAbrirArquivo,
  onCompartilhar,
  onExcluirObra,
}: {
  obra: T;
  isDesktop: boolean;
  onAbrirArquivo: (obra: T) => void | Promise<void>;
  onCompartilhar: (obra: T) => void | Promise<void>;
  onExcluirObra: (obraId: string, tituloObra: string) => void | Promise<void>;
}) {
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const slugObraPainel = obra.slug?.trim() || criarSlugBase(obra.titulo);
  const linkObraPainel = obra.link?.trim();
  const obraHref = linkObraPainel || `/obra/${encodeURIComponent(slugObraPainel)}`;
  const editarHref = `/editar-obra?obraId=${obra.id}`;
  const capituloHref = `/adicionar-capitulo?obraId=${obra.id}`;
  const capitulosPublicados = obterCapitulosPublicadosPainel(obra.capitulos);
  const capituloParaContinuar = obra.ultimoCapituloLido;
  const capituloParaLer =
    capituloParaContinuar || capitulosPublicados[0] || null;
  const capituloParaEditar = obra.capitulos[0] || null;
  const editarCapituloHref = capituloParaEditar
    ? `/editar-capitulo?obraId=${obra.id}&capituloId=${capituloParaEditar.id}`
    : `/editar-capitulo?obraId=${obra.id}`;
  const indiceCapituloParaLer = capituloParaLer
    ? obra.capitulos.findIndex((capitulo) => capitulo.id === capituloParaLer.id)
    : -1;
  const numeroCapituloParaLer = indiceCapituloParaLer >= 0 ? indiceCapituloParaLer + 1 : 1;
  const leituraCapituloHref = capituloParaLer
    ? criarHrefLeituraCapituloPainel(obra, capituloParaLer, numeroCapituloParaLer)
    : "";
  const perfilAutorHref = criarPerfilAutorHref(obra.autor, obra.autorId, obra.autorId);
  const visualizacoesPainel = Math.max(0, obra.visualizacoes);
  const statusTexto = obterStatusPainelAutor(obra);
  const obraComStatusPublicado = obraPublicadaComConteudoPainel(obra);
  const obraTemCapitulos = obra.capitulos.length > 0;
  const indicadorPrimarioIcone = obraTemCapitulos ? "📚" : obra.arquivoObra ? "📄" : "📚";
  const indicadorPrimarioValor = obraTemCapitulos ? obra.capitulos.length : obra.arquivoObra ? 1 : 0;

  usePainelAutorWorkActionsBodyLock(acoesAbertas);

  return (
    <>
      <article style={isDesktop ? desktopWorkCardStyle : workCardStyle}>
        <Link
          href={obraHref}
          style={coverLinkStyle}
          aria-label={`Abrir ${obra.titulo}`}
        >
          <div
            style={
              isDesktop
                ? criarPainelCoverDesktopStyle(obra.capa)
                : criarPainelCoverStyle(obra.capa)
            }
          >
            <div style={coverGlowStyle} />

            <div style={statusRowStyle}>
              <span style={obraComStatusPublicado ? publishedStatusStyle : draftStatusStyle}>
                {statusTexto}
              </span>

            </div>

            <div style={isDesktop ? desktopWorkContentStyle : workContentStyle}>
              <h3 style={workTitleStyle}>{obra.titulo}</h3>

              <span style={workMetaLineStyle}>
                <span>👁 {visualizacoesPainel}</span>
                <span>
                  <span style={workCardHeartMetaStyle}>❤️</span>{" "}
                  {obra.totalCurtidas}
                </span>
                <span>
                  <span style={workCardCommentMetaStyle}>💬</span>{" "}
                  {obra.totalComentarios}
                </span>
                <span>
                  {indicadorPrimarioIcone} {indicadorPrimarioValor}
                </span>
              </span>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setAcoesAbertas(true)}
          style={workCardDotsButtonStyle}
          aria-label={`Abrir opções de ${obra.titulo}`}
          aria-expanded={acoesAbertas}
        >
          ⋮
        </button>
      </article>

      {acoesAbertas && (
        <div
          style={workActionSheetOverlayStyle}
          role="presentation"
          onClick={() => setAcoesAbertas(false)}
        >
          <section
            style={workActionSheetStyle}
            role="dialog"
            aria-label={`Ações de ${obra.titulo}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={workActionSheetHandleStyle} aria-hidden="true" />

            <div style={workActionSheetHeaderStyle}>
              <div style={workActionSheetTextBlockStyle}>
                <strong style={workActionSheetTitleStyle}>{obra.titulo}</strong>

                <Link
                  href={perfilAutorHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={authorStyle}
                >
                  Por {obra.autor}
                </Link>


              </div>
            </div>

            <div style={isDesktop ? desktopSheetStatsRowStyle : sheetStatsRowStyle}>
              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>👁</span>
                <span style={sheetStatValueStyle}>{visualizacoesPainel}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatHeartIconStyle}>❤️</span>
                <span style={sheetStatValueStyle}>{obra.totalCurtidas}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>💬</span>
                <span style={sheetStatValueStyle}>{obra.totalComentarios}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>🔖</span>
                <span style={sheetStatValueStyle}>{obra.totalSalvos}</span>
              </span>

              <span style={sheetStatInlineStyle}>
                <span style={sheetStatIconStyle}>{indicadorPrimarioIcone}</span>
                <span style={sheetStatValueStyle}>{indicadorPrimarioValor}</span>
              </span>
            </div>

            <div style={isDesktop ? desktopCardActionsGridStyle : actionsGridStyle}>
              <Link
                href={editarCapituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={openButtonStyle}
              >
                Editar capítulo
              </Link>

              {capituloParaLer && (
                <Link
                  href={leituraCapituloHref}
                  onClick={() => setAcoesAbertas(false)}
                  style={readButtonStyle}
                >
                  {capituloParaContinuar ? "Continuar leitura" : "Ler capítulo"}
                </Link>
              )}

              <Link
                href={editarHref}
                onClick={() => setAcoesAbertas(false)}
                style={editButtonStyle}
              >
                Editar obra
              </Link>

              <Link
                href={capituloHref}
                onClick={() => setAcoesAbertas(false)}
                style={chapterButtonStyle}
              >
                Adicionar capítulo
              </Link>


              {obra.arquivoObra && (
                <button
                  type="button"
                  onClick={() => {
                    setAcoesAbertas(false);
                    void onAbrirArquivo(obra);
                  }}
                  style={fileButtonStyle}
                >
                  Ver arquivo
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  void onCompartilhar(obra);
                  setAcoesAbertas(false);
                }}
                style={shareButtonStyle}
              >
                Compartilhar
              </button>

              <button
                type="button"
                onClick={() => {
                  setAcoesAbertas(false);
                  void onExcluirObra(obra.id, obra.titulo);
                }}
                style={deleteButtonStyle}
              >
                Excluir
              </button>
            </div>

          </section>
        </div>
      )}
    </>
  );
}
