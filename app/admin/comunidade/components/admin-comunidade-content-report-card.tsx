import Link from "next/link";
import { formatarData } from "../../../../lib/utils";
import { criarHrefDiarioDenunciado } from "../lib/admin-comunidade-route-utils";
import {
  STATUS_DENUNCIAS,
  STATUS_LABEL,
  type StatusDenuncia,
} from "../lib/admin-comunidade-status-utils";
import {
  rotuloRemocaoAlvoDenuncia,
  rotuloTipoAlvoDenuncia,
} from "../lib/admin-comunidade-report-label-utils";
import {
  analysisMetaStyle,
  adminNoteStyle,
  adminObservationLabelStyle,
  archivedInlineStyle,
  boxLabelStyle,
  commentTargetBadgeStyle,
  contentBoxStyle,
  detailTextStyle,
  metaGridStyle,
  metaItemStyle,
  mutedTextStyle,
  postTargetBadgeStyle,
  reasonGridStyle,
  reasonItemStyle,
  recurrenceMetaItemStyle,
  reportBodyStyle,
  reportCardStyle,
  reportDateStyle,
  reportDotStyle,
  reportHeaderRightStyle,
  reportHeaderStyle,
  reportMenuBackdropStyle,
  reportMenuButtonStyle,
  reportMenuDangerItemStyle,
  reportMenuDividerStyle,
  reportMenuHandleStyle,
  reportMenuItemActiveStyle,
  reportMenuItemLinkStyle,
  reportMenuItemStyle,
  reportMenuOverlayStyle,
  reportMenuStyle,
  reportMenuTitleStyle,
  reportMenuWrapStyle,
  reportMetaLineStyle,
  reportTitleStyle,
  reportTitleWrapStyle,
  reportedTextCompactStyle,
  reportedTextStyle,
  sectionHeaderLineStyle,
  sectionHintStyle,
  spoilerMetaItemStyle,
  statusInlineStyle,
  targetBadgeStyle,
  textareaStyle,
} from "../lib/admin-comunidade-styles";
import type { DenunciaComContexto } from "../lib/admin-comunidade-report-context-utils";

type AdminComunidadeContentReportCardProps = {
  denuncia: DenunciaComContexto;
  acaoEmAndamento: string;
  acaoAtiva: boolean;
  observacao: string;
  menuAberto: boolean;
  denunciaArquivada: boolean;
  conteudoIndisponivel: boolean;
  denunciaResolvidaComConteudoIndisponivel: boolean;
  totalReincidencias: number;
  onAlternarMenu: () => void;
  onFecharMenu: () => void;
  onArquivarDenuncia: (denunciaId: string) => void;
  onRestaurarDenunciaArquivada: (denunciaId: string) => void;
  onRemoverDenunciaResolvida: (denunciaId: string) => void;
  onAtualizarStatus: (
    denunciaId: string,
    novoStatus: StatusDenuncia,
  ) => void;
  onRemoverConteudoDenunciado: (denuncia: DenunciaComContexto) => void;
  onAlterarObservacao: (novoValor: string) => void;
};

export function AdminComunidadeContentReportCard({
  denuncia,
  acaoEmAndamento,
  acaoAtiva,
  observacao,
  menuAberto,
  denunciaArquivada,
  conteudoIndisponivel,
  denunciaResolvidaComConteudoIndisponivel,
  totalReincidencias,
  onAlternarMenu,
  onFecharMenu,
  onArquivarDenuncia,
  onRestaurarDenunciaArquivada,
  onRemoverDenunciaResolvida,
  onAtualizarStatus,
  onRemoverConteudoDenunciado,
  onAlterarObservacao,
}: AdminComunidadeContentReportCardProps) {
  return (
  <article style={reportCardStyle}>
    <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
      <div style={reportTitleWrapStyle}>
        <div style={reportMetaLineStyle}>
          <span
            style={{
              ...targetBadgeStyle,
              ...(denuncia.alvoTipo === "post"
                ? postTargetBadgeStyle
                : commentTargetBadgeStyle),
            }}
          >
            {rotuloTipoAlvoDenuncia(denuncia.alvoTipo)}
          </span>

          <span style={reportDotStyle}>•</span>

          <span style={reportDateStyle}>
            Denunciado em {formatarData(denuncia.criadoEm)}
          </span>

          <span style={reportDotStyle}>•</span>

          <span style={statusInlineStyle}>
            {STATUS_LABEL[denuncia.status]}
          </span>

          {denunciaArquivada && (
            <>
              <span style={reportDotStyle}>•</span>
              <span style={archivedInlineStyle}>Arquivada</span>
            </>
          )}
        </div>

        <strong style={reportTitleStyle}>{denuncia.motivo}</strong>
      </div>

      <div style={reportHeaderRightStyle}>
        <div style={reportMenuWrapStyle}>
          <button
            type="button"
            aria-label={
              menuAberto
                ? "Fechar ações da denúncia"
                : "Abrir ações da denúncia"
            }
            aria-expanded={menuAberto}
            onClick={onAlternarMenu}
            disabled={acaoAtiva}
            style={{
              ...reportMenuButtonStyle,
              opacity: acaoAtiva ? 0.58 : 1,
              cursor: acaoAtiva ? "not-allowed" : "pointer",
            }}
          >
            ⋮
          </button>

          {menuAberto && (
            <section
              style={reportMenuOverlayStyle}
              aria-label="Ações da denúncia"
            >
              <button
                type="button"
                aria-label="Fechar ações da denúncia"
                onClick={onFecharMenu}
                style={reportMenuBackdropStyle}
              />

              <article role="menu" style={reportMenuStyle}>
                <div style={reportMenuHandleStyle} />

                <strong style={reportMenuTitleStyle}>
                  Ações da denúncia
                </strong>
              {denuncia.alvoPostId && (
                <Link
                  href={`/comunidade?post=${encodeURIComponent(
                    denuncia.alvoPostId
                  )}`}
                  onClick={onFecharMenu}
                  style={reportMenuItemLinkStyle}
                >
                  Abrir publicação na Comunidade
                </Link>
              )}

              {(denuncia.alvoTipo === "comentario_capitulo" ||
                denuncia.alvoTipo === "capitulo") &&
                denuncia.alvoObraId &&
                denuncia.alvoCapituloId && (
                  <Link
                    href={`/ler-capitulo?obraId=${encodeURIComponent(
                      denuncia.alvoObraId
                    )}&capituloId=${encodeURIComponent(
                      denuncia.alvoCapituloId
                    )}`}
                    onClick={onFecharMenu}
                    style={reportMenuItemLinkStyle}
                  >
                    Abrir capítulo denunciado
                  </Link>
                )}

              {(denuncia.alvoTipo === "obra" ||
                denuncia.alvoTipo === "comentario_obra") &&
                denuncia.alvoObraSlug && (
                  <Link
                    href={`/obra/${encodeURIComponent(
                      denuncia.alvoObraSlug
                    )}`}
                    onClick={onFecharMenu}
                    style={reportMenuItemLinkStyle}
                  >
                    Abrir obra denunciada
                  </Link>
                )}

              {(denuncia.alvoTipo === "diario_anotacao" ||
                denuncia.alvoTipo === "comentario_diario") &&
                denuncia.alvoPerfilUserId && (
                  <Link
                    href={criarHrefDiarioDenunciado(denuncia)}
                    onClick={onFecharMenu}
                    style={reportMenuItemLinkStyle}
                  >
                    Abrir conteúdo no Diário
                  </Link>
                )}

              {denunciaArquivada ? (
                <button
                  type="button"
                  onClick={() => onRestaurarDenunciaArquivada(denuncia.id)}
                  disabled={acaoAtiva}
                  style={reportMenuItemStyle}
                >
                  Restaurar para o painel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onArquivarDenuncia(denuncia.id)}
                  disabled={acaoAtiva}
                  style={reportMenuItemStyle}
                >
                  Arquivar denúncia
                </button>
              )}

              {denuncia.status === "resolvida" && (
                <button
                  type="button"
                  onClick={() => onRemoverDenunciaResolvida(denuncia.id)}
                  disabled={acaoAtiva}
                  style={reportMenuDangerItemStyle}
                >
                  {acaoEmAndamento === `${denuncia.id}-remover-denuncia`
                    ? "Removendo..."
                    : "Remover do painel"}
                </button>
              )}

              {denuncia.status === "pendente" && (
                <button
                  type="button"
                  onClick={() => {
                    onFecharMenu();
                    onAtualizarStatus(
                      denuncia.id,
                      "em_analise"
                    );
                  }}
                  disabled={acaoAtiva}
                  style={reportMenuItemStyle}
                >
                  {acaoEmAndamento === `${denuncia.id}-em_analise`
                    ? "Assumindo..."
                    : "Assumir análise"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onFecharMenu();
                  onRemoverConteudoDenunciado(denuncia);
                }}
                disabled={
                  acaoAtiva ||
                  conteudoIndisponivel ||
                  denunciaArquivada ||
                  (denuncia.status !== "pendente" &&
                    denuncia.status !== "em_analise")
                }
                style={reportMenuDangerItemStyle}
              >
                {acaoEmAndamento ===
                `${denuncia.id}-remover-conteudo`
                  ? "Removendo..."
                  : rotuloRemocaoAlvoDenuncia(
                      denuncia.alvoTipo
                    )}
              </button>

              <div style={reportMenuDividerStyle} />

              {STATUS_DENUNCIAS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onFecharMenu();
                    onAtualizarStatus(
                      denuncia.id,
                      status
                    );
                  }}
                  disabled={acaoAtiva || denuncia.status === status}
                  style={
                    denuncia.status === status
                      ? reportMenuItemActiveStyle
                      : reportMenuItemStyle
                  }
                >
                  {acaoEmAndamento === `${denuncia.id}-${status}`
                    ? "Salvando..."
                    : `Marcar como ${STATUS_LABEL[
                        status
                      ].toLowerCase()}`}
                </button>
              ))}

              </article>
            </section>
          )}</div>
      </div>
    </div>

    <div className="admin-comunidade-report-body" style={reportBodyStyle}>
      <section style={contentBoxStyle}>
        <div style={sectionHeaderLineStyle}>
          <span style={boxLabelStyle}>Conteúdo denunciado</span>
          <span style={sectionHintStyle}>
            {conteudoIndisponivel
              ? "Indisponível"
              : rotuloTipoAlvoDenuncia(denuncia.alvoTipo)}
          </span>
        </div>

        <p
          style={
            denunciaResolvidaComConteudoIndisponivel
              ? reportedTextCompactStyle
              : reportedTextStyle
          }
        >
          {conteudoIndisponivel
            ? "Conteúdo removido ou indisponível."
            : denuncia.alvoResumo}
        </p>

        {!conteudoIndisponivel && (
          <div style={metaGridStyle}>
          <span style={metaItemStyle}>
            Autor: <strong>{denuncia.alvoAutor}</strong>
          </span>

          {totalReincidencias > 1 && (
            <span style={recurrenceMetaItemStyle}>
              Reincidências: <strong>{totalReincidencias}</strong>
            </span>
          )}

          <span style={metaItemStyle}>
            Data: <strong>{formatarData(denuncia.alvoData)}</strong>
          </span>

          {denuncia.alvoCategoria && (
            <span style={metaItemStyle}>
              Categoria: <strong>{denuncia.alvoCategoria}</strong>
            </span>
          )}

          {(denuncia.alvoTipo === "post" ||
            denuncia.alvoTipo === "diario_anotacao") &&
            denuncia.alvoTipoPublicacao && (
              <span style={metaItemStyle}>
                Tipo: <strong>{denuncia.alvoTipoPublicacao}</strong>
              </span>
            )}

          {(denuncia.alvoTipo === "post" ||
            denuncia.alvoTipo === "diario_anotacao" ||
            denuncia.alvoTipo === "comentario_diario") && (
            <span
              style={
                denuncia.alvoTemSpoiler
                  ? spoilerMetaItemStyle
                  : metaItemStyle
              }
            >
              Spoiler:{" "}
              <strong>
                {denuncia.alvoTemSpoiler ? "Sim" : "Não"}
              </strong>
            </span>
          )}

            {denuncia.alvoObra && (
              <span style={metaItemStyle}>
                Obra: <strong>{denuncia.alvoObra}</strong>
              </span>
            )}

            {(denuncia.alvoTipo === "comentario_capitulo" ||
              denuncia.alvoTipo === "capitulo") &&
              denuncia.alvoCapituloId && (
                <span style={metaItemStyle}>
                  Capítulo:{" "}
                  <strong>
                    {denuncia.alvoCapituloTitulo ||
                      denuncia.alvoCapituloId}
                  </strong>
                </span>
              )}
          </div>
        )}
      </section>

      <section style={contentBoxStyle}>
        <div style={sectionHeaderLineStyle}>
          <span style={boxLabelStyle}>Denúncia</span>
          <span style={sectionHintStyle}>Registro interno</span>
        </div>

        <div style={reasonGridStyle}>
          <span style={reasonItemStyle}>
            Denunciante: <strong>{denuncia.denuncianteNome}</strong>
          </span>
        </div>

        {denuncia.detalhe ? (
          <p style={detailTextStyle}>{denuncia.detalhe}</p>
        ) : (
          <p style={mutedTextStyle}>Sem detalhe adicional.</p>
        )}
      </section>

      <label style={adminNoteStyle}>
        <div style={sectionHeaderLineStyle}>
          <span style={adminObservationLabelStyle}>
            Observação interna
          </span>
          <span style={sectionHintStyle}>Até 800 caracteres</span>
        </div>

        <textarea
          value={observacao}
          onChange={(event) => onAlterarObservacao(event.target.value)}
          disabled={acaoAtiva}
          placeholder="Ex.: conteúdo analisado, ação tomada, manter observação interna..."
          maxLength={800}
          rows={2}
          style={textareaStyle}
        />
      </label>
    </div>

    {denuncia.analisadoEm && (
      <span style={analysisMetaStyle}>
        Última análise em {formatarData(denuncia.analisadoEm)}
      </span>
    )}
  </article>
  );
}

