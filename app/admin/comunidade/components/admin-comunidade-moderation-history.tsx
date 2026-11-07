import { useState } from "react";
import { formatarData } from "../../../../lib/utils";
import { criarMensagemErro } from "../lib/admin-comunidade-error-utils";
import {
  rotuloAcaoHistoricoModeracao,
  rotuloResponsavelHistoricoModeracao,
  rotuloStatusHistoricoModeracao,
} from "../lib/admin-comunidade-history-utils";
import {
  buscarPaginaHistoricoModeracao,
  type EventoHistoricoModeracao,
} from "../loaders/carregar-historico-moderacao";
import {
  historyActionsStyle,
  historyButtonStyle,
  historyCardStyle,
  historyErrorStyle,
  historyEventHeaderStyle,
  historyEventMetaStyle,
  historyEventStyle,
  historyListStyle,
  historyObservationStyle,
  historyPanelStyle,
  historyReportIdStyle,
  historyTitleStyle,
} from "../lib/admin-comunidade-styles";

function mesclarEventosHistorico(
  atuais: EventoHistoricoModeracao[],
  novos: EventoHistoricoModeracao[],
) {
  const ids = new Set(atuais.map((evento) => evento.id));
  return [...atuais, ...novos.filter((evento) => !ids.has(evento.id))];
}

export function AdminComunidadeModerationHistory() {
  const [aberto, setAberto] = useState(false);
  const [eventos, setEventos] = useState<EventoHistoricoModeracao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarPagina(proximaPagina: number, substituir = false) {
    if (carregando) {
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resultado = await buscarPaginaHistoricoModeracao(proximaPagina);
      setEventos((eventosAtuais) =>
        substituir
          ? resultado.eventos
          : mesclarEventosHistorico(eventosAtuais, resultado.eventos),
      );
      setPagina(proximaPagina);
      setTemMais(resultado.temMais);
    } catch (error) {
      setErro(criarMensagemErro("Erro ao carregar histórico", error));
    } finally {
      setCarregando(false);
    }
  }

  function alternarHistorico() {
    const proximoAberto = !aberto;
    setAberto(proximoAberto);

    if (proximoAberto && eventos.length === 0 && !carregando) {
      void carregarPagina(0, true);
    }
  }

  return (
    <section style={historyCardStyle} aria-label="Histórico de moderação">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="admin-comunidade-historico"
        onClick={alternarHistorico}
        style={historyButtonStyle}
      >
        {aberto ? "Ocultar histórico de moderação" : "Ver histórico de moderação"}
      </button>

      {aberto && (
        <div id="admin-comunidade-historico" style={historyPanelStyle}>
          <div style={historyActionsStyle}>
            <strong style={historyTitleStyle}>Decisões e responsáveis</strong>
            <button
              type="button"
              onClick={() => void carregarPagina(0, true)}
              disabled={carregando}
              style={historyButtonStyle}
            >
              {carregando ? "Atualizando..." : "Atualizar histórico"}
            </button>
          </div>

          {erro && (
            <p role="alert" style={historyErrorStyle}>
              {erro}
            </p>
          )}

          {!carregando && !erro && eventos.length === 0 && (
            <p style={historyEventMetaStyle}>Nenhum evento registrado.</p>
          )}

          {eventos.length > 0 && (
            <ol style={historyListStyle}>
              {eventos.map((evento) => (
                <li key={evento.id} style={historyEventStyle}>
                  <div style={historyEventHeaderStyle}>
                    <strong>{rotuloAcaoHistoricoModeracao(evento.acao)}</strong>
                    <span>{evento.criadoEm ? formatarData(evento.criadoEm) : "Data indisponível"}</span>
                  </div>

                  <span style={historyEventMetaStyle}>
                    {evento.origem === "perfil" ? "Perfil" : "Conteúdo"}
                    {" · "}
                    {rotuloResponsavelHistoricoModeracao({
                      acao: evento.acao,
                      moderadorId: evento.moderadorId,
                      moderadorNome: evento.moderadorNome,
                    })}
                  </span>

                  {(evento.statusAnterior || evento.statusNovo) && (
                    <span style={historyEventMetaStyle}>
                      {rotuloStatusHistoricoModeracao(evento.statusAnterior)}
                      {" → "}
                      {rotuloStatusHistoricoModeracao(evento.statusNovo)}
                    </span>
                  )}

                  {evento.observacaoAdmin && (
                    <p style={historyObservationStyle}>{evento.observacaoAdmin}</p>
                  )}

                  <code style={historyReportIdStyle}>
                    Denúncia {evento.denunciaId}
                  </code>
                </li>
              ))}
            </ol>
          )}

          {temMais && (
            <button
              type="button"
              onClick={() => void carregarPagina(pagina + 1)}
              disabled={carregando}
              style={historyButtonStyle}
            >
              {carregando ? "Carregando..." : "Carregar histórico anterior"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
