import Link from "next/link";
import { formatarData } from "../../../../lib/utils";
import {
  STATUS_DENUNCIAS_PERFIS,
  STATUS_PERFIL_LABEL,
  type StatusDenunciaPerfil,
} from "../lib/admin-comunidade-status-utils";
import { formatarMotivoDenunciaPerfil } from "../lib/admin-comunidade-report-label-utils";
import {
  analysisMetaStyle,
  boxLabelStyle,
  commentTargetBadgeStyle,
  contentBoxStyle,
  detailTextStyle,
  metaGridStyle,
  metaItemStyle,
  mutedTextStyle,
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
  sectionHeaderLineStyle,
  sectionHintStyle,
  statusInlineStyle,
  targetBadgeStyle,
} from "../lib/admin-comunidade-styles";
import type { DenunciaPerfilComContexto } from "../loaders/carregar-denuncias-perfis-moderacao";

type AdminComunidadeProfileReportCardProps = {
  denuncia: DenunciaPerfilComContexto;
  acaoEmAndamento: string;
  menuDenunciaAbertoId: string;
  totalReincidencias: number;
  onAlternarMenu: (menuId: string) => void;
  onFecharMenu: () => void;
  onAtualizarStatus: (
    denunciaId: string,
    status: StatusDenunciaPerfil,
  ) => void;
  onRemoverDenunciaResolvida: (denunciaId: string) => void;
};

export function AdminComunidadeProfileReportCard({
  denuncia,
  acaoEmAndamento,
  menuDenunciaAbertoId,
  totalReincidencias,
  onAlternarMenu,
  onFecharMenu,
  onAtualizarStatus,
  onRemoverDenunciaResolvida,
}: AdminComunidadeProfileReportCardProps) {
  const acaoAtiva = acaoEmAndamento.startsWith(`perfil-${denuncia.id}`);
  const menuIdPerfil = `perfil-${denuncia.id}`;
  const menuAberto = menuDenunciaAbertoId === menuIdPerfil;

  return (
    <article style={reportCardStyle}>
      <div className="admin-comunidade-report-header" style={reportHeaderStyle}>
        <div style={reportTitleWrapStyle}>
          <div style={reportMetaLineStyle}>
            <span
              style={{
                ...targetBadgeStyle,
                ...commentTargetBadgeStyle,
              }}
            >
              Perfil
            </span>

            <span style={reportDotStyle}>•</span>

            <span style={reportDateStyle}>
              Denunciado em {formatarData(denuncia.criadoEm)}
            </span>

            <span style={reportDotStyle}>•</span>

            <span style={statusInlineStyle}>
              {STATUS_PERFIL_LABEL[denuncia.status]}
            </span>
          </div>

          <strong style={reportTitleStyle}>
            {formatarMotivoDenunciaPerfil(denuncia.motivo)}
          </strong>
        </div>

        <div style={reportHeaderRightStyle}>
          <div style={reportMenuWrapStyle}>
            <button
              type="button"
              aria-label={
                menuAberto
                  ? "Fechar ações da denúncia de perfil"
                  : "Abrir ações da denúncia de perfil"
              }
              aria-expanded={menuAberto}
              onClick={() => onAlternarMenu(menuIdPerfil)}
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
                aria-label="Ações da denúncia de perfil"
              >
                <button
                  type="button"
                  aria-label="Fechar ações da denúncia de perfil"
                  onClick={onFecharMenu}
                  style={reportMenuBackdropStyle}
                />

                <article role="menu" style={reportMenuStyle}>
                  <div style={reportMenuHandleStyle} />

                  <strong style={reportMenuTitleStyle}>
                    Ações da denúncia
                  </strong>

                  <Link
                    href={denuncia.perfilHref}
                    onClick={onFecharMenu}
                    style={reportMenuItemLinkStyle}
                  >
                    Abrir perfil denunciado
                  </Link>

                  {denuncia.status === "resolvida" && (
                    <button
                      type="button"
                      onClick={() => onRemoverDenunciaResolvida(denuncia.id)}
                      disabled={acaoAtiva}
                      style={reportMenuDangerItemStyle}
                    >
                      {acaoEmAndamento ===
                      `perfil-${denuncia.id}-remover-denuncia`
                        ? "Removendo..."
                        : "Remover do painel"}
                    </button>
                  )}

                  {denuncia.status === "pendente" && (
                    <button
                      type="button"
                      onClick={() => {
                        onFecharMenu();
                        onAtualizarStatus(denuncia.id, "analisada");
                      }}
                      disabled={acaoAtiva}
                      style={reportMenuItemStyle}
                    >
                      {acaoEmAndamento === `perfil-${denuncia.id}-analisada`
                        ? "Assumindo..."
                        : "Assumir análise"}
                    </button>
                  )}

                  <div style={reportMenuDividerStyle} />

                  {STATUS_DENUNCIAS_PERFIS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        onFecharMenu();
                        onAtualizarStatus(denuncia.id, status);
                      }}
                      disabled={acaoAtiva || denuncia.status === status}
                      style={
                        denuncia.status === status
                          ? reportMenuItemActiveStyle
                          : reportMenuItemStyle
                      }
                    >
                      {acaoEmAndamento === `perfil-${denuncia.id}-${status}`
                        ? "Salvando..."
                        : `Marcar como ${STATUS_PERFIL_LABEL[
                            status
                          ].toLowerCase()}`}
                    </button>
                  ))}
                </article>
              </section>
            )}
          </div>
        </div>
      </div>

      <div className="admin-comunidade-report-body" style={reportBodyStyle}>
        <section style={contentBoxStyle}>
          <div style={sectionHeaderLineStyle}>
            <span style={boxLabelStyle}>Perfil denunciado</span>
          </div>

          <p style={reportedTextCompactStyle}>{denuncia.denunciadoNome}</p>

          <div style={metaGridStyle}>
            <span style={metaItemStyle}>
              Denunciante: <strong>{denuncia.denuncianteNome}</strong>
            </span>

            {totalReincidencias > 1 && (
              <span style={recurrenceMetaItemStyle}>
                Reincidências: <strong>{totalReincidencias}</strong>
              </span>
            )}
          </div>
        </section>

        <section style={contentBoxStyle}>
          <div style={sectionHeaderLineStyle}>
            <span style={boxLabelStyle}>Denúncia</span>
            <span style={sectionHintStyle}>Registro interno</span>
          </div>

          {denuncia.descricao ? (
            <p style={detailTextStyle}>{denuncia.descricao}</p>
          ) : (
            <p style={mutedTextStyle}>Sem descrição adicional.</p>
          )}
        </section>
      </div>

      {denuncia.atualizadoEm && denuncia.atualizadoEm !== denuncia.criadoEm && (
        <span style={analysisMetaStyle}>
          Última atualização em {formatarData(denuncia.atualizadoEm)}
        </span>
      )}
    </article>
  );
}
