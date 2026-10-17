export type RegistroSupabaseGenerico = Record<string, unknown>;

export function normalizarRegistrosSupabaseGenericos(
  valor: unknown,
): RegistroSupabaseGenerico[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.filter((registro): registro is RegistroSupabaseGenerico => {
    return (
      Boolean(registro) &&
      typeof registro === "object" &&
      !Array.isArray(registro)
    );
  });
}

export function obterTextoRegistro(
  registro: RegistroSupabaseGenerico,
  chave: string,
) {
  const valor = registro[chave];

  if (typeof valor === "string") {
    return valor.trim();
  }

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  return "";
}

export function obterIdObraRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "obra_id") ||
    obterTextoRegistro(registro, "obraId") ||
    obterTextoRegistro(registro, "id_obra")
  );
}

export function obterIdCapituloRegistro(registro: RegistroSupabaseGenerico) {
  return (
    obterTextoRegistro(registro, "capitulo_id") ||
    obterTextoRegistro(registro, "capituloId") ||
    obterTextoRegistro(registro, "id_capitulo")
  );
}

export function obterTextoComentarioRegistro(
  registro: RegistroSupabaseGenerico,
) {
  return (
    obterTextoRegistro(registro, "comentario") ||
    obterTextoRegistro(registro, "texto") ||
    obterTextoRegistro(registro, "conteudo")
  );
}

export function criarSetObrasPorRegistro(
  registros: RegistroSupabaseGenerico[],
) {
  return new Set(
    registros
      .map((registro) => obterIdObraRegistro(registro))
      .filter((obraId) => Boolean(obraId)),
  );
}

export function criarMapaComentariosPorCapitulo(
  registros: RegistroSupabaseGenerico[],
) {
  const mapa = new Map<string, string>();

  registros.forEach((registro) => {
    const capituloId = obterIdCapituloRegistro(registro);
    const comentario = obterTextoComentarioRegistro(registro);

    if (capituloId && comentario) {
      mapa.set(capituloId, comentario);
    }
  });

  return mapa;
}
