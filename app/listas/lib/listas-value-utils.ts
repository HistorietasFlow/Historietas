export function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

export function pegarNumero(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return numero;
    }
  }

  return fallback;
}

export function pegarBooleanoListas(valor: unknown, fallback = false) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "number") {
    return valor === 1;
  }

  if (typeof valor === "string") {
    const normalizado = valor.trim().toLowerCase();

    if (normalizado === "true" || normalizado === "1") {
      return true;
    }

    if (normalizado === "false" || normalizado === "0") {
      return false;
    }
  }

  return fallback;
}

export function idUsuarioValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor.trim(),
  );
}

export function obterMensagemErroListas(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const mensagem = (error as { message?: unknown }).message;

    if (typeof mensagem === "string" && mensagem.trim()) {
      return mensagem.trim();
    }
  }

  return fallback;
}
