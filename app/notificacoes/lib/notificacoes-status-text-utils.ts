export function obterTextoStatusDenunciaComunidadeNotificacao(status: string) {
  return status === "resolvida"
    ? "resolvida"
    : status === "rejeitada"
      ? "rejeitada"
      : "em análise";
}

export function obterStatusProblemaTecnicoNotificacao(status: string) {
  if (status === "em_analise") {
    return {
      titulo: "Problema técnico em análise",
      texto: "em análise",
    };
  }

  if (status === "aguardando_usuario") {
    return {
      titulo: "Problema técnico aguardando informações",
      texto: "aguardando informações",
    };
  }

  if (status === "resolvido") {
    return {
      titulo: "Problema técnico resolvido",
      texto: "resolvido",
    };
  }

  if (status === "fechado") {
    return {
      titulo: "Problema técnico fechado",
      texto: "fechado",
    };
  }

  return null;
}

export function obterRotuloTipoAnotacaoDiarioNotificacao(tipo: string) {
  if (tipo === "lendo") {
    return "leitura";
  }

  if (tipo === "quero_ler") {
    return "Quero ler";
  }

  if (tipo === "favorita") {
    return "favorita";
  }

  if (tipo === "concluida") {
    return "obra concluída";
  }

  if (tipo === "avaliacao") {
    return "avaliação";
  }

  if (tipo === "review") {
    return "review";
  }

  return "anotação";
}
