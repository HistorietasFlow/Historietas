// Normalização defensiva: nunca renderizar uma resposta parcial ou inesperada da RPC.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/i;

/** @param {unknown} valor */
function capaSegura(valor) {
  if (typeof valor !== "string" || !valor.trim()) return "";
  const url = valor.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const analisada = new URL(url);
    if (analisada.protocol === "https:" || analisada.protocol === "http:") {
      return analisada.href;
    }
  } catch {
    // URL inválida: imagem não é renderizada.
  }
  return "";
}

/** @param {unknown} valor */
export function normalizarHistoriasEmComum(valor) {
  if (!Array.isArray(valor) || valor.length > 20) return [];

  /** @type {{ id: string; href: string; titulo: string; autor: string; capa: string }[]} */
  const obras = [];
  const vistos = new Set();
  for (const registro of valor) {
    if (!registro || typeof registro !== "object" || Array.isArray(registro)) return [];
    const { obra_id, slug, titulo, autor, capa_url } = registro;
    if (typeof obra_id !== "string" || !UUID.test(obra_id)
      || typeof slug !== "string" || !SLUG.test(slug)
      || typeof titulo !== "string" || !titulo.trim() || titulo.length > 300
      || (autor !== null && typeof autor !== "string")) {
      return [];
    }
    const id = obra_id.toLowerCase();
    if (vistos.has(id)) return [];
    vistos.add(id);
    obras.push({
      id,
      href: `/obra/${encodeURIComponent(slug)}`,
      titulo: titulo.trim(),
      autor: typeof autor === "string" ? autor.trim().slice(0, 160) : "",
      capa: capaSegura(capa_url),
    });
  }
  return obras;
}
