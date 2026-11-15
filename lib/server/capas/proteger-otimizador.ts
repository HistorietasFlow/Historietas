import "server-only";

const ICONES = new Set(["/icon-192.png", "/icon-512.png", "/maskable-icon-512.png", "/apple-touch-icon.png"]);
// O Next adiciona esses namespaces a localPatterns durante o build. Permitir
// apenas nomes de arquivo, sem encoding, subdiretórios, query ou barra invertida.
const ASSET_COMPILADO = /^\/_next\/static\/(?:immutable\/)?media\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|gif|avif|ico)$/;

/** Executa antes do cache do otimizador. remotePatterns continua responsável
 * por permitir somente a origem/bucket público legado já configurados.
 */
export function recusarFonteLocalDinamica(request: Request) {
  const url = new URL(request.url);
  const fontes = url.searchParams.getAll("url");
  if (fontes.length === 1 && !fontes[0].startsWith("/")) return null;
  if (fontes.length === 1 && (ICONES.has(fontes[0]) || ASSET_COMPILADO.test(fontes[0]))) return null;
  return new Response(request.method === "HEAD" ? null : "Fonte de imagem não permitida.", {
    status: 400,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "Surrogate-Control": "no-store",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
