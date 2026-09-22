export function formatarTempoRelativoComentarioComunidade(
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
