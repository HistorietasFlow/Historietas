import type { Dispatch, SetStateAction } from "react";
import { AdminProblemasTecnicosTicketDescription } from "./admin-problemas-tecnicos-ticket-description";
import { AdminProblemasTecnicosTicketEnvironment } from "./admin-problemas-tecnicos-ticket-environment";
import { AdminProblemasTecnicosTicketInfoGrid } from "./admin-problemas-tecnicos-ticket-info-grid";
import { AdminProblemasTecnicosTicketLastReview } from "./admin-problemas-tecnicos-ticket-last-review";
import { AdminProblemasTecnicosTicketPriorityControl } from "./admin-problemas-tecnicos-ticket-priority-control";
import { AdminProblemasTecnicosTicketStatusControl } from "./admin-problemas-tecnicos-ticket-status-control";
import { AdminProblemasTecnicosTicketSummary } from "./admin-problemas-tecnicos-ticket-summary";
import type {
  ProblemaTecnico,
  PrioridadeProblemaTecnico,
  StatusProblemaTecnico,
} from "../lib/admin-problemas-tecnicos-normalization-utils";
import type { TextoTraduzido } from "../lib/admin-problemas-tecnicos-text-utils";
import {
  cardActionsStyle,
  cardStyle,
  controlsGridStyle,
  counterStyle,
  detailsStyle,
  fieldLabelStyle,
  fieldStyle,
  textareaStyle,
} from "../lib/admin-problemas-tecnicos-styles";

type AtualizarChamado = (
  problema: ProblemaTecnico,
  alteracoes: Partial<
    Pick<
      ProblemaTecnico,
      "status" | "prioridade" | "observacaoAdmin"
    >
  >,
  mensagemSucesso: string,
) => Promise<void>;

type AdminProblemasTecnicosTicketCardProps = {
  problema: ProblemaTecnico;
  chamadoAbertoId: string;
  acaoEmAndamento: string;
  nomesUsuarios: Record<string, string>;
  observacoes: Record<string, string>;
  setObservacoes: Dispatch<SetStateAction<Record<string, string>>>;
  alternarChamadoAberto: (chamadoId: string) => void;
  atualizarChamado: AtualizarChamado;
  t: (texto: TextoTraduzido) => string;
};

export function AdminProblemasTecnicosTicketCard({
  problema,
  chamadoAbertoId,
  acaoEmAndamento,
  nomesUsuarios,
  observacoes,
  setObservacoes,
  alternarChamadoAberto,
  atualizarChamado,
  t,
}: AdminProblemasTecnicosTicketCardProps) {
  const aberto = chamadoAbertoId === problema.id;
  const salvando = acaoEmAndamento === problema.id;
  const nomeUsuario =
    nomesUsuarios[problema.userId] ||
    t({
      pt: "Usuário",
      en: "User",
      es: "Usuario",
    });

  return (
    <article style={cardStyle}>
      <AdminProblemasTecnicosTicketSummary
        problema={problema}
        aberto={aberto}
        nomeUsuario={nomeUsuario}
        t={t}
        onAlternarAbertura={() => alternarChamadoAberto(problema.id)}
      />

      {aberto && (
        <div style={detailsStyle}>
          <AdminProblemasTecnicosTicketInfoGrid
            problema={problema}
            nomeUsuario={nomeUsuario}
            t={t}
          />

          <AdminProblemasTecnicosTicketDescription
            problema={problema}
            t={t}
          />

          <AdminProblemasTecnicosTicketEnvironment
            problema={problema}
            t={t}
          />

          <div style={controlsGridStyle}>
            <AdminProblemasTecnicosTicketStatusControl
              status={problema.status}
              salvando={salvando}
              t={t}
              onAlterarStatus={(status: StatusProblemaTecnico) =>
                void atualizarChamado(
                  problema,
                  { status },
                  t({
                    pt: "Status do chamado atualizado.",
                    en: "Ticket status updated.",
                    es: "Estado de la solicitud actualizado.",
                  }),
                )
              }
            />

            <AdminProblemasTecnicosTicketPriorityControl
              prioridade={problema.prioridade}
              salvando={salvando}
              t={t}
              onAlterarPrioridade={(prioridade: PrioridadeProblemaTecnico) =>
                void atualizarChamado(
                  problema,
                  { prioridade },
                  t({
                    pt: "Prioridade do chamado atualizada.",
                    en: "Ticket priority updated.",
                    es: "Prioridad de la solicitud actualizada.",
                  }),
                )
              }
            />
          </div>

          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>
              {t({
                pt: "Observação interna",
                en: "Internal note",
                es: "Observación interna",
              })}
            </span>
            <textarea
              value={observacoes[problema.id] || ""}
              disabled={salvando}
              onChange={(event) =>
                setObservacoes((atuais) => ({
                  ...atuais,
                  [problema.id]: event.target.value,
                }))
              }
              placeholder={t({
                pt: "Registre o diagnóstico, a ação tomada ou o que ainda precisa ser verificado...",
                en: "Record the diagnosis, action taken, or what still needs to be checked...",
                es: "Registra el diagnóstico, la acción tomada o lo que aún debe verificarse...",
              })}
              maxLength={3000}
              rows={5}
              style={textareaStyle}
            />
            <span style={counterStyle}>
              {(observacoes[problema.id] || "").length}/3000
            </span>
          </label>

          <div style={cardActionsStyle}>
            <button
              type="button"
              className="admin-tech-primary-button"
              disabled={salvando}
              onClick={() =>
                void atualizarChamado(
                  problema,
                  {
                    observacaoAdmin:
                      observacoes[problema.id] || "",
                  },
                  t({
                    pt: "Observação interna salva.",
                    en: "Internal note saved.",
                    es: "Observación interna guardada.",
                  }),
                )
              }
            >
              {salvando
                ? t({
                    pt: "Salvando...",
                    en: "Saving...",
                    es: "Guardando...",
                  })
                : t({
                    pt: "Salvar observação",
                    en: "Save note",
                    es: "Guardar observación",
                  })}
            </button>
          </div>

          <AdminProblemasTecnicosTicketLastReview
            analisadoEm={problema.analisadoEm}
            t={t}
          />
        </div>
      )}
    </article>
  );
}
