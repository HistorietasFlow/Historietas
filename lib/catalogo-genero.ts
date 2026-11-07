// Vocabulário público do Explorar; parâmetros nunca viram padrões livres.
const GENEROS_EXCLUIVEIS = new Set([
  "acao", "aventura", "comedia", "drama", "fantasia", "ficcao", "misterio",
  "romance", "suspense", "terror", "sobrenatural", "historico", "biografia",
]);
const PADROES_GENEROS = new Map(Array.from(GENEROS_EXCLUIVEIS, (genero): [string, RegExp] => [
  genero,
  new RegExp(`(^|[^\\p{L}\\p{N}_])${genero === "ficcao" ? "(?:ficcao|sci-fi|sci fi)" : genero}([^\\p{L}\\p{N}_]|$)`, "u"),
]));

function normalizar(valor: string | null | undefined) {
  const acentos = "áàâãäéèêëíìîïóòôõöúùûüçñ";
  const letras = "aaaaaeeeeiiiiooooouuuucn";
  return (valor || "").toLowerCase()
    .replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (letra) => letras[acentos.indexOf(letra)])
    .replace(/[ \t\r\n\f\v]+/g, " ").trim();
}

export function normalizarGeneroExcluido(valor: string | null | undefined) {
  const genero = normalizar(valor);
  if (genero === "sci-fi" || genero === "sci fi") return "ficcao";
  return GENEROS_EXCLUIVEIS.has(genero) ? genero : "";
}

export function generoCorrespondeExclusao(genero: string, excluido: string) {
  const categoria = normalizarGeneroExcluido(excluido);
  if (!categoria) return false;
  // Só padrões do vocabulário fixo, compilados uma vez; mesmos limites do SQL.
  return PADROES_GENEROS.get(categoria)!.test(normalizar(genero));
}
