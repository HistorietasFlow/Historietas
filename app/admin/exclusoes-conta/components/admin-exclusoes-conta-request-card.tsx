import { formatarData } from "../../../../lib/utils";
import type { HistorietasLanguage } from "../../../../lib/i18n";
import {
  STATUS_SOLICITACOES,
  type SolicitacaoExclusao,
  type StatusSolicitacaoExclusao,
} from "../lib/admin-exclusoes-conta-normalization-utils";
import {
  STATUS_LABEL,
  corStatus,
  origemTraduzida,
  type TextoTraduzido,
} from "../lib/admin-exclusoes-conta-text-utils";
import {
  badgeStyle, badgesStyle, cardActionsStyle, cardDescriptionPreviewStyle,
  cardHeadingStyle, cardMetaStyle, cardStyle, cardTitleStyle, contentBoxStyle,
  controlsGridStyle, counterStyle, detailGridStyle, detailItemStyle, detailLabelStyle,
  detailsStyle, environmentStyle, environmentValueStyle, fieldControlStyle,
  fieldLabelStyle, fieldStyle, finalWarningStyle, fullDescriptionStyle,
  sourceBadgeStyle, statusHelpStyle, textareaStyle, unsavedStyle,
} from "../lib/admin-exclusoes-conta-styles";

type Props = {
  solicitacao: SolicitacaoExclusao;
  aberta: boolean;
  salvando: boolean;
  statusAtual: StatusSolicitacaoExclusao;
  observacaoAtual: string;
  alterado: boolean;
  language: HistorietasLanguage;
  t: (texto: TextoTraduzido) => string;
  onAlternarAbertura: () => void;
  onAlterarStatus: (status: StatusSolicitacaoExclusao) => void;
  onAlterarObservacao: (observacao: string) => void;
  onSalvar: () => void;
};

export function AdminExclusoesContaRequestCard({
  solicitacao, aberta, salvando, statusAtual, observacaoAtual, alterado, language, t,
  onAlternarAbertura, onAlterarStatus, onAlterarObservacao, onSalvar,
}: Props) {
  const motivo = solicitacao.motivo || t({ pt: "Nenhum motivo informado.", en: "No reason provided.", es: "No se informó ningún motivo." });

  return (
    <article style={cardStyle}>
      <button type="button" className="admin-delete-card-summary" onClick={onAlternarAbertura} aria-expanded={aberta}>
        <div style={cardHeadingStyle}>
          <div style={badgesStyle}>
            <span style={{ ...badgeStyle, borderColor: `${corStatus(solicitacao.status)}70`, color: corStatus(solicitacao.status) }}>
              {t(STATUS_LABEL[solicitacao.status])}
            </span>
            <span style={sourceBadgeStyle}>{origemTraduzida(solicitacao.origem, language)}</span>
          </div>
          <h2 style={cardTitleStyle}>{solicitacao.email || "—"}</h2>
          <p style={cardDescriptionPreviewStyle}>{motivo}</p>
        </div>
        <div style={cardMetaStyle}>
          <span>{formatarData(solicitacao.criadaEm)}</span>
          <span aria-hidden="true">{aberta ? "▲" : "▼"}</span>
        </div>
      </button>

      {aberta && (
        <div style={detailsStyle}>
          <div style={detailGridStyle}>
            <Detail label={t({ pt: "E-mail", en: "Email", es: "Correo" })} value={solicitacao.email || "—"} />
            <Detail label={t({ pt: "Origem", en: "Source", es: "Origen" })} value={origemTraduzida(solicitacao.origem, language)} />
            <Detail label={t({ pt: "Criada em", en: "Created", es: "Creada" })} value={formatarData(solicitacao.criadaEm)} />
            <Detail label={t({ pt: "Atualizada em", en: "Updated", es: "Actualizada" })} value={formatarData(solicitacao.atualizadaEm)} />
            {solicitacao.processadaEm && <Detail label={t({ pt: "Processada em", en: "Processed", es: "Procesada" })} value={formatarData(solicitacao.processadaEm)} />}
          </div>
          <section style={contentBoxStyle}>
            <span style={detailLabelStyle}>{t({ pt: "Motivo informado", en: "Provided reason", es: "Motivo informado" })}</span>
            <p style={fullDescriptionStyle}>{motivo}</p>
          </section>
          {solicitacao.userAgent && (
            <section style={environmentStyle}>
              <span style={detailLabelStyle}>User-Agent</span>
              <span style={environmentValueStyle}>{solicitacao.userAgent}</span>
            </section>
          )}
          <div style={controlsGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>{t({ pt: "Status", en: "Status", es: "Estado" })}</span>
              <select value={statusAtual} disabled={salvando} onChange={(event) => onAlterarStatus(event.target.value as StatusSolicitacaoExclusao)} style={fieldControlStyle}>
                {STATUS_SOLICITACOES.map((status) => <option key={status} value={status}>{t(STATUS_LABEL[status])}</option>)}
              </select>
            </label>
            <div style={statusHelpStyle}>
              <strong>{t({ pt: "Fluxo recomendado", en: "Recommended flow", es: "Flujo recomendado" })}</strong>
              <span>{t({ pt: "Pendente → Verificando identidade → Concluída. Use Recusada ou Cancelada somente quando houver motivo registrado.", en: "Pending → Verifying identity → Completed. Use Rejected or Canceled only when the reason is documented.", es: "Pendiente → Verificando identidad → Completada. Usa Rechazada o Cancelada solo cuando el motivo esté registrado." })}</span>
            </div>
          </div>
          {statusAtual === "concluida" && solicitacao.status !== "concluida" && (
            <div style={finalWarningStyle}>
              <strong>{t({ pt: "Atenção", en: "Warning", es: "Atención" })}</strong>
              <span>{t({ pt: "Você está prestes a registrar este pedido como concluído. Confirme antes que a identidade foi verificada e que a exclusão real já foi executada.", en: "You are about to record this request as completed. First confirm that identity was verified and the actual deletion was already carried out.", es: "Estás a punto de registrar esta solicitud como completada. Confirma antes que la identidad fue verificada y que la eliminación real ya se realizó." })}</span>
            </div>
          )}
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>{t({ pt: "Observação interna", en: "Internal note", es: "Observación interna" })}</span>
            <textarea value={observacaoAtual} disabled={salvando} onChange={(event) => onAlterarObservacao(event.target.value)} placeholder={t({ pt: "Registre a verificação de identidade, contatos realizados e o resultado do processamento...", en: "Record identity verification, contacts made, and the processing outcome...", es: "Registra la verificación de identidad, los contactos realizados y el resultado del procesamiento..." })} maxLength={4000} rows={6} style={textareaStyle} />
            <span style={counterStyle}>{observacaoAtual.length}/4000</span>
          </label>
          <div style={cardActionsStyle}>
            {alterado && <span style={unsavedStyle}>{t({ pt: "Alterações não salvas", en: "Unsaved changes", es: "Cambios sin guardar" })}</span>}
            <button type="button" className="admin-delete-primary-button" disabled={salvando || !alterado} onClick={onSalvar}>
              {salvando ? t({ pt: "Salvando...", en: "Saving...", es: "Guardando..." }) : t({ pt: "Salvar alterações", en: "Save changes", es: "Guardar cambios" })}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div style={detailItemStyle}><span style={detailLabelStyle}>{label}</span><strong>{value}</strong></div>;
}
