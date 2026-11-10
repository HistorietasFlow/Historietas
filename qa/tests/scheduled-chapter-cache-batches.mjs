import assert from "node:assert/strict";

// QA apenas: cada POST reivindica outro lote; nao e retry de uma falha nem ACK.
export async function solicitarEventoCacheEmLotes({ eventosElegiveis, solicitarLote, eventoSolicitado }) {
  assert.ok(Number.isSafeInteger(eventosElegiveis) && eventosElegiveis > 0,
    "A fixture deve conter o evento elegivel antes de solicitar os lotes.");
  const maximoLotes = Math.ceil(eventosElegiveis / 5);
  for (let lote = 1; lote <= maximoLotes; lote++) {
    const resultado = await solicitarLote();
    assert.equal(resultado.confirmadas, 0, "Solicitacao nao confirma invalidacao.");
    assert.equal(resultado.estado, "solicitado_sem_confirmacao");
    assert.equal(resultado.publicacaoAutomaticaHabilitada, false);
    assert.ok(Number.isInteger(resultado.solicitadas)
      && resultado.solicitadas > 0 && resultado.solicitadas <= 5,
    "Esperado progresso em lote de ate cinco; nao repetir lote vazio/falho.");
    if (await eventoSolicitado()) return lote;
  }
  assert.fail(`Solicitacao do evento nao registrada apos ${maximoLotes} lotes; HTTP 202 nao basta.`);
}
