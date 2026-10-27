import { formatarData } from "../../../../lib/utils";
import type {
  OperacaoRecuperavel,
} from "../lib/admin-exclusoes-conta-normalization-utils";
import type { TextoTraduzido } from "../lib/admin-exclusoes-conta-text-utils";
import {
  detailItemStyle,
  detailLabelStyle,
  eyebrowStyle,
  operationIdStyle,
  recoveryCardStyle,
  recoveryCardTopStyle,
  recoveryCountStyle,
  recoveryDescriptionStyle,
  recoveryDetailStyle,
  recoveryEmptyStyle,
  recoveryErrorStyle,
  recoveryHeaderStyle,
  recoveryListStyle,
  recoveryMetaGridStyle,
  recoverySectionStyle,
  recoveryTitleStyle,
} from "../lib/admin-exclusoes-conta-styles";

type AdminExclusoesContaRecoverySectionProps = {
  operacoesRecuperaveis: OperacaoRecuperavel[];
  acaoEmAndamento: string;
  t: (texto: TextoTraduzido) => string;
  onRecuperarOperacao: (operacao: OperacaoRecuperavel) => void;
};

export function AdminExclusoesContaRecoverySection({
  operacoesRecuperaveis,
  acaoEmAndamento,
  t,
  onRecuperarOperacao,
}: AdminExclusoesContaRecoverySectionProps) {
  return (
    <section style={recoverySectionStyle}>
      <div style={recoveryHeaderStyle}>
        <div>
          <span style={eyebrowStyle}>
            {t({
              pt: "RECUPERAÇÃO OPERACIONAL",
              en: "OPERATIONAL RECOVERY",
              es: "RECUPERACIÓN OPERATIVA",
            })}
          </span>
          <h2 style={recoveryTitleStyle}>
            {t({
              pt: "Exclusões interrompidas",
              en: "Interrupted deletions",
              es: "Eliminaciones interrumpidas",
            })}
          </h2>
          <p style={recoveryDescriptionStyle}>
            {t({
              pt: "Aqui aparecem apenas operações que o servidor considera seguras para recuperação administrativa: exclusões interrompidas na etapa do Auth ou falhas ocorridas depois que o Auth já foi removido.",
              en: "Only operations the server considers safe for administrative recovery appear here: deletions interrupted during the Auth step or failures after Auth was already removed.",
              es: "Aquí solo aparecen operaciones que el servidor considera seguras para recuperación administrativa: eliminaciones interrumpidas en la etapa de Auth o fallos después de que Auth ya fue eliminado.",
            })}
          </p>
        </div>
        <strong style={recoveryCountStyle}>{operacoesRecuperaveis.length}</strong>
      </div>

      {operacoesRecuperaveis.length === 0 ? (
        <div style={recoveryEmptyStyle}>
          {t({
            pt: "Nenhuma exclusão precisa de recuperação administrativa agora.",
            en: "No deletion needs administrative recovery right now.",
            es: "Ninguna eliminación necesita recuperación administrativa ahora.",
          })}
        </div>
      ) : (
        <div style={recoveryListStyle}>
          {operacoesRecuperaveis.map((operacao) => {
            const recuperando = acaoEmAndamento === `operacao:${operacao.id}`;
            const bloqueadoPorLock = operacao.lockAtivo && !recuperando;

            return (
              <article key={operacao.id} style={recoveryCardStyle}>
                <div style={recoveryCardTopStyle}>
                  <div>
                    <strong>
                      {operacao.status === "excluindo_auth"
                        ? t({
                            pt: "Auth interrompido",
                            en: "Auth interrupted",
                            es: "Auth interrumpido",
                          })
                        : t({
                            pt: "Falha pós-Auth",
                            en: "Post-Auth failure",
                            es: "Fallo posterior a Auth",
                          })}
                    </strong>
                    <code style={operationIdStyle}>{operacao.id}</code>
                  </div>
                  <button
                    type="button"
                    className="admin-delete-primary-button"
                    disabled={
                      bloqueadoPorLock ||
                      recuperando ||
                      Boolean(acaoEmAndamento && !recuperando)
                    }
                    onClick={() => onRecuperarOperacao(operacao)}
                    title={
                      bloqueadoPorLock
                        ? t({
                            pt: "Esta exclusão ainda está sendo processada. Atualize a lista após o lock expirar.",
                            en: "This deletion is still being processed. Refresh the list after the lock expires.",
                            es: "Esta eliminación todavía se está procesando. Actualiza la lista después de que expire el bloqueo.",
                          })
                        : undefined
                    }
                  >
                    {recuperando
                      ? t({ pt: "Retomando...", en: "Resuming...", es: "Reanudando..." })
                      : bloqueadoPorLock
                        ? t({ pt: "Em processamento", en: "Processing", es: "En proceso" })
                        : t({
                            pt: "Retomar recuperação",
                            en: "Resume recovery",
                            es: "Reanudar recuperación",
                          })}
                  </button>
                </div>

                <div style={recoveryMetaGridStyle}>
                  <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>
                      {t({ pt: "Atualizada", en: "Updated", es: "Actualizada" })}
                    </span>
                    <strong>{formatarData(operacao.atualizadaEm)}</strong>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>
                      {t({ pt: "Tentativas Storage", en: "Storage attempts", es: "Intentos Storage" })}
                    </span>
                    <strong>{operacao.tentativasStorage}</strong>
                  </div>
                  <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>
                      {t({ pt: "Tentativas Auth", en: "Auth attempts", es: "Intentos Auth" })}
                    </span>
                    <strong>{operacao.tentativasAuth}</strong>
                  </div>
                  {operacao.lockExpiraEm && (
                    <div style={detailItemStyle}>
                      <span style={detailLabelStyle}>
                        {t({ pt: "Lock expira", en: "Lock expires", es: "Bloqueo expira" })}
                      </span>
                      <strong>{formatarData(operacao.lockExpiraEm)}</strong>
                    </div>
                  )}
                </div>

                {operacao.bucketsPendentes.length > 0 && (
                  <div style={recoveryDetailStyle}>
                    <span style={detailLabelStyle}>
                      {t({ pt: "Buckets pendentes", en: "Pending buckets", es: "Buckets pendientes" })}
                    </span>
                    <span>{operacao.bucketsPendentes.join(", ")}</span>
                  </div>
                )}

                {operacao.ultimoErroMensagem && (
                  <div style={recoveryErrorStyle}>
                    <strong>
                      {operacao.ultimoErroCodigo ||
                        t({ pt: "Último erro", en: "Last error", es: "Último error" })}
                    </strong>
                    <span>{operacao.ultimoErroMensagem}</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
