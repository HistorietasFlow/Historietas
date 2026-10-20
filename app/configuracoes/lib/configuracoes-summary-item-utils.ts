export function criarChaveItemResumo(item: unknown, index: number) {
  if (typeof item === "string" || typeof item === "number") {
    const valor = String(item).trim();

    return valor || `item-${index}`;
  }

  if (item && typeof item === "object" && !Array.isArray(item)) {
    const registro = item as Record<string, unknown>;
    const identificadores = [registro.id, registro.obra_id, registro.obraId, registro.capitulo_id, registro.capituloId, registro.user_id, registro.userId, registro.autor_id, registro.autorId, registro.notificacao_id];
    const identificador = identificadores.find((valor) => typeof valor === "string" && Boolean(valor.trim()));

    if (typeof identificador === "string") {
      return identificador.trim();
    }

    try {
      return JSON.stringify(registro) || `item-${index}`;
    } catch {
      return `item-${index}`;
    }
  }

  return `item-${index}`;
}
