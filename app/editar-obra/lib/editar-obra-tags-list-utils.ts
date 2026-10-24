export function prepararTagsEdicaoObra(tags: string, limiteTagsObra: number) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, limiteTagsObra);
}

export function obterTagsFinaisEdicaoObra(tagsTratadas: string[]) {
  return tagsTratadas.length > 0 ? tagsTratadas : ["sem tags"];
}
