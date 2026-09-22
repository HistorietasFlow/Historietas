export function dataComentarioComunidade(comentario: { criadoEm: string }) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}
