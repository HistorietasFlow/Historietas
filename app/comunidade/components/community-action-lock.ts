export function iniciarAcaoComunidade(
  acoesComunidadeRef: { current: Set<string> },
  chave: string,
) {
  if (acoesComunidadeRef.current.has(chave)) {
    return false;
  }

  acoesComunidadeRef.current.add(chave);
  return true;
}

export function finalizarAcaoComunidade(
  acoesComunidadeRef: { current: Set<string> },
  chave: string,
) {
  acoesComunidadeRef.current.delete(chave);
}
