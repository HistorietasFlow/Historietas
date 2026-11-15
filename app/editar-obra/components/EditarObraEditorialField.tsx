import { StoryStatusField } from "../../../components/StoryStatusField";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { textosStatusEditorial } from "../../../lib/statusEditorial";
import type { useEditarObraEditorial } from "../hooks/use-editar-obra-editorial";

const mensagens = {
  "pt-BR": {
    indisponivel: "O estado atual não foi confirmado. A edição editorial está indisponível.",
    rejeitada: "O banco recusou a alteração. Seus campos foram preservados.",
    sem_linha: "Nenhuma atualização foi confirmada. A obra pode ter mudado ou seu acesso pode ter sido alterado.",
    incerta: "A resposta não confirmou o resultado. A alteração pode ter sido salva. Não será reenviada automaticamente.",
    contexto_invalido: "A identidade ou a obra mudou. Reabra a edição para confirmar os dados atuais.",
    consultar: "Consultar estado atual", atual: "Estado atual no banco", escolha: "Sua escolha ainda não salva",
    manter: "Manter minha escolha para o próximo salvamento", usar: "Usar o estado atual", consultando: "Consultando estado atual…",
  },
  en: {
    indisponivel: "The current status was not confirmed. Story status editing is unavailable.",
    rejeitada: "The database rejected the change. Your fields were preserved.",
    sem_linha: "No update was confirmed. The work or your access may have changed.",
    incerta: "The response did not confirm the outcome. The change may have been saved. It will not be resent automatically.",
    contexto_invalido: "The identity or work changed. Reopen editing to confirm the current data.",
    consultar: "Check current status", atual: "Current database status", escolha: "Your unsaved choice",
    manter: "Keep my choice for the next save", usar: "Use current status", consultando: "Checking current status…",
  },
  es: {
    indisponivel: "No se confirmó el estado actual. La edición del estado no está disponible.",
    rejeitada: "La base de datos rechazó el cambio. Se conservaron tus campos.",
    sem_linha: "No se confirmó ninguna actualización. La obra o tu acceso pueden haber cambiado.",
    incerta: "La respuesta no confirmó el resultado. El cambio puede haberse guardado. No se reenviará automáticamente.",
    contexto_invalido: "La identidad o la obra cambió. Abre de nuevo la edición para confirmar los datos actuales.",
    consultar: "Consultar estado actual", atual: "Estado actual en la base de datos", escolha: "Tu elección aún sin guardar",
    manter: "Mantener mi elección para el próximo guardado", usar: "Usar el estado actual", consultando: "Consultando estado actual…",
  },
};

export function EditarObraEditorialField({ editorial, idioma, processando, onAlterar }: {
  editorial: ReturnType<typeof useEditarObraEditorial>;
  idioma: HistorietasLanguage;
  processando: boolean;
  onAlterar: () => void;
}) {
  const t = mensagens[idioma], estados = textosStatusEditorial(idioma);
  const rotulo = (valor: string | null) => valor === null || valor === "" ? estados.indefinido : estados[valor as "em_andamento" | "concluida" | "pausada"];
  return (
    <section data-historietas-i18n-ignore="true" style={{ display: "grid", gap: 12, minWidth: 0, overflowWrap: "anywhere" }}>
      <StoryStatusField id="editar-status-editorial" idioma={idioma} value={editorial.escolha}
        disabled={processando || !editorial.confirmado || editorial.bloqueado || editorial.exigeDecisao}
        onChange={(value) => { onAlterar(); editorial.escolher(value); }} />
      {!editorial.confirmado && !editorial.resultado && <p role="status">{t.indisponivel}</p>}
      {editorial.resultado && editorial.resultado !== "confirmada" && <p role="status">{t[editorial.resultado]}</p>}
      {editorial.exigeDecisao && editorial.confirmado && <>
        <p role="status">{t.atual}: {rotulo(editorial.confirmado.status)}. {t.escolha}: {rotulo(editorial.escolha)}.</p>
        <button type="button" onClick={() => { onAlterar(); editorial.decidirManterEscolha(); }}>{t.manter}</button>
        <button type="button" onClick={() => { onAlterar(); editorial.decidirUsarAtual(); }}>{t.usar}</button>
      </>}
      {(!editorial.confirmado || editorial.bloqueado) && !editorial.exigeDecisao && (
        <button type="button" disabled={processando || editorial.reconciliando} onClick={() => { onAlterar(); void editorial.reconciliar(); }}>
          {editorial.reconciliando ? t.consultando : t.consultar}
        </button>
      )}
    </section>
  );
}
