export function obterTextoBotaoVerRespostasComunidade(
  quantidadeRespostas: number
) {
  return `Ver ${quantidadeRespostas} ${
    quantidadeRespostas === 1 ? "resposta" : "respostas"
  }`;
}

export function obterTextoBotaoVerMaisRespostasComunidade(
  quantidadeRespostasOcultas: number
) {
  return `Ver mais ${quantidadeRespostasOcultas} ${
    quantidadeRespostasOcultas === 1 ? "resposta" : "respostas"
  }`;
}

export function obterTextoBotaoOcultarRespostasComunidade() {
  return "Ocultar respostas";
}
