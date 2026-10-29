export function removerIdSelecionadoTop5(
  idsAtuais: string[],
  chave: string,
) {
  return idsAtuais.filter((id) => id !== chave);
}

export function moverIdSelecionadoTop5(
  idsAtuais: string[],
  chave: string,
  direcao: -1 | 1,
) {
  const indiceAtual = idsAtuais.indexOf(chave);
  const novoIndice = indiceAtual + direcao;

  if (
    indiceAtual < 0 ||
    novoIndice < 0 ||
    novoIndice >= idsAtuais.length
  ) {
    return idsAtuais;
  }

  const novaLista = [...idsAtuais];
  const [item] = novaLista.splice(indiceAtual, 1);
  novaLista.splice(novoIndice, 0, item);

  return novaLista;
}
