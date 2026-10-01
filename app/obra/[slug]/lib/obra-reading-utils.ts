type CapituloComEstadoLeitura = {
  lido: boolean;
};

export function calcularProgressoLeitura(
  capitulos: CapituloComEstadoLeitura[],
) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

type ObraLocalParaDisponibilidadeLeitura = {
  publicado: boolean;
  capitulos: unknown[];
  arquivoObra?: unknown;
};

export function obraLocalEstaDisponivelParaLeitura(
  obra: ObraLocalParaDisponibilidadeLeitura,
) {
  return (
    obra.publicado &&
    (obra.capitulos.length > 0 || Boolean(obra.arquivoObra))
  );
}

export function obterIndicadorConteudoObraPublica(obra: {
  capitulos: unknown[];
  arquivoObra?: unknown;
}) {
  const temCapitulos = obra.capitulos.length > 0;

  return {
    icone: temCapitulos ? "📚" : obra.arquivoObra ? "📄" : "📚",
    valor: temCapitulos ? obra.capitulos.length : obra.arquivoObra ? 1 : 0,
  };
}

export function obterCapitulosObraPublica<TCapitulo>(
  obra: { capitulos: TCapitulo[] } | null,
) {
  if (!obra) {
    return [];
  }

  if (obra.capitulos.length > 0) {
    return obra.capitulos;
  }

  return [];
}

type CapituloParaContinuarLeitura = {
  id: string;
  disponivel: boolean;
  lido: boolean;
};

type ObraParaContinuarLeitura<TCapitulo extends CapituloParaContinuarLeitura> = {
  capitulos: TCapitulo[];
  ultimoCapituloLidoId: string;
};

export function encontrarCapituloParaContinuarObraPublica<
  TCapitulo extends CapituloParaContinuarLeitura,
>(obra: ObraParaContinuarLeitura<TCapitulo>) {
  const capitulosDisponiveis = obra.capitulos.filter(
    (capitulo) => capitulo.disponivel
  );

  if (capitulosDisponiveis.length === 0) {
    return null;
  }

  const indiceUltimoCapituloLido = obra.ultimoCapituloLidoId
    ? capitulosDisponiveis.findIndex(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : -1;

  if (indiceUltimoCapituloLido >= 0) {
    const proximoCapituloNaoLido = capitulosDisponiveis
      .slice(indiceUltimoCapituloLido + 1)
      .find((capitulo) => !capitulo.lido);

    if (proximoCapituloNaoLido) {
      return proximoCapituloNaoLido;
    }
  }

  return (
    capitulosDisponiveis.find((capitulo) => !capitulo.lido) ||
    capitulosDisponiveis[capitulosDisponiveis.length - 1]
  );
}

export function obterObraDisponivelExibida(
  obra: { disponivel?: boolean } | null,
) {
  return Boolean(obra?.disponivel);
}
export function obterTextoDisponibilidadeCapitulosObra(
  quantidadeCapitulos: number,
  obraDisponivel: boolean,
) {
  return obraDisponivel
    ? `${quantidadeCapitulos} disponíveis`
    : `${quantidadeCapitulos} em breve`;
}
