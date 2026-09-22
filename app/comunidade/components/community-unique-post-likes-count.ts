export function contarCurtidasUnicasPostComunidade(
  post: { curtidas: string[] }
) {
  return new Set(
    post.curtidas.map((userId) => userId.trim()).filter(Boolean)
  ).size;
}
