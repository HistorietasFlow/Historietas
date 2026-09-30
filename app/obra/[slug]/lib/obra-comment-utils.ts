export function criarComentarioObraId() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return `comentario-obra-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function dataComentarioObra(comentario: { criadoEm: string }) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function obterIdsComentarioComRespostas(
  comentarios: Array<{ id: string; comentarioPaiId: string }>,
  comentarioId: string,
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}

export function formatarTempoRelativoComentarioObra(
  criadaEm: string,
  agora = Date.now()
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function obterObraIdComentarios(
  obra: { id?: string } | null,
) {
  return obra?.id?.trim() || "";
}
