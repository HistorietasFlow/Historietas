import type { MetadataRoute } from "next";

function escaparXml(valor: string) {
  return valor.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** Os mesmos campos publicos usados anteriormente pelo metadata route. */
export function serializarSitemapPublico(rotas: MetadataRoute.Sitemap) {
  const urls = rotas.map((rota) => {
    const data = rota.lastModified instanceof Date ? rota.lastModified.toISOString() : rota.lastModified;
    return `<url><loc>${escaparXml(rota.url)}</loc>`
      + (data ? `<lastmod>${escaparXml(data)}</lastmod>` : "")
      + (rota.changeFrequency ? `<changefreq>${escaparXml(rota.changeFrequency)}</changefreq>` : "")
      + (typeof rota.priority === "number" ? `<priority>${rota.priority}</priority>` : "") + "</url>";
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
