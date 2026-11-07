// Igualdade literal: não interpreta curingas, sintaxe full-text ou operadores.
export function normalizarTagCatalogo(valor: string | null | undefined, limitar = true) {
  const acentos = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const letras = "aaaaaeeeeiiiiooooouuuucn";
  const normalizada = (valor || "").toLowerCase()
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (letra) => letras[acentos.indexOf(letra)])
    .replace(/[ \t\r\n\f\v]+/g, " ")
    .trim();
  return limitar ? normalizada.slice(0, 90) : normalizada;
}
