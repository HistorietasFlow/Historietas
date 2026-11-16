import "server-only";

type Identidade = Readonly<{ usuarioId: string }>;

/** Interface interna, não é um contrato SQL/Storage. O adaptador ainda não existe.
 * Deve vincular a fonte imutável à obra e à sessão ativa desta requisição.
 * revalidar deve conferir a MESMA fonte, sessão e autorização no primário,
 * incluindo classificação, publicação, geração/recriação e troca de capa.
 * Nunca construir esta fonte a partir de URL/caminho fornecido pelo cliente.
 */
export type FonteCapaAutorizada = {
  ler(opcoes: { signal: AbortSignal; cache: "no-store"; redirect: "error" }): Promise<Response>;
  revalidar(signal: AbortSignal): Promise<boolean>;
};

export type DependenciasEntregaCapa = {
  disponivel(): boolean;
  autenticar(request: Request): Promise<Identidade | null>;
  autorizar(obraId: string, identidade: Identidade, request: Request, signal: AbortSignal): Promise<FonteCapaAutorizada | null>;
};

const MAX_BYTES = 2 * 1024 * 1024;
const TIPOS = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ROTA = /^\/api\/capas-obras\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function headers() {
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Surrogate-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie, Authorization",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "none",
  });
}

function erro(request: Request, status: number) {
  const h = headers();
  h.set("Content-Type", "application/json; charset=utf-8");
  if (status === 405) h.set("Allow", "GET, HEAD");
  return new Response(request.method === "HEAD" ? null : JSON.stringify({
    erro: status === 401 ? "autenticacao_necessaria" : "capa_indisponivel",
  }), { status, headers: h });
}

async function abortavel<T>(acao: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abortar = () => {};
  const interrompida = new Promise<never>((_, reject) => {
    abortar = () => reject(new Error("entrega_interrompida"));
    signal.addEventListener("abort", abortar, { once: true });
  });
  try {
    return await Promise.race([Promise.resolve().then(() => { signal.throwIfAborted(); return acao(); }), interrompida]);
  } finally {
    signal.removeEventListener("abort", abortar);
  }
}

async function lerBytes(resposta: Response, signal: AbortSignal) {
  const reader = resposta.body?.getReader();
  if (!reader) throw new Error("capa_ausente");
  const bytes = new Uint8Array(MAX_BYTES);
  let total = 0;
  let partes = 0;
  try {
    while (true) {
      const { done, value } = await abortavel(() => reader.read(), signal);
      if (done) break;
      if (!(value instanceof Uint8Array) || ++partes > 4096 || value.byteLength > MAX_BYTES - total) {
        throw new Error("capa_invalida");
      }
      bytes.set(value, total);
      total += value.byteLength;
    }
    if (total === 0) throw new Error("capa_vazia");
    return bytes.slice(0, total);
  } finally {
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Buffer privado por requisição: nenhum byte é entregue antes da conferência
 * final. Essa conferência não revoga bytes já enviados nem cerca escritores
 * físicos; a ativação depende do adaptador e das garantias transacionais reais.
 */
export function criarEntregaPrivadaCapa(deps: DependenciasEntregaCapa) {
  return async function entregar(request: Request) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Gate fixo na composição de produção, sem env que habilite o endpoint.
      if (deps.disponivel() !== true) return erro(request, 503);
      if (request.method !== "GET" && request.method !== "HEAD") return erro(request, 405);
      const url = new URL(request.url);
      const obraId = ROTA.exec(url.pathname)?.[1];
      if (!obraId || url.search) return erro(request, 400);
      if (request.headers.get("sec-fetch-site") === "cross-site" ||
        (request.headers.has("origin") && request.headers.get("origin") !== url.origin)) return erro(request, 403);
      if (request.headers.has("range")) return erro(request, 416);

      const deadline = new AbortController();
      timer = setTimeout(() => deadline.abort(), 10_000);
      const signal = AbortSignal.any([request.signal, deadline.signal]);
      const identidade = await abortavel(() => deps.autenticar(request), signal);
      if (!identidade?.usuarioId) return erro(request, 401);
      const fonte = await abortavel(() => deps.autorizar(obraId, identidade, request, signal), signal);
      if (!fonte) return erro(request, 404);
      const origem = await abortavel(() => fonte.ler({ signal, cache: "no-store", redirect: "error" }), signal);
      const tipo = origem.headers.get("content-type") || "";
      if (origem.status !== 200 || !TIPOS.has(tipo)) {
        void origem.body?.cancel().catch(() => undefined);
        return erro(request, 503);
      }
      const bytes = await lerBytes(origem, signal);
      const atual = await abortavel(() => deps.autenticar(request), signal);
      if (!atual || atual.usuarioId !== identidade.usuarioId) return erro(request, 401);
      if (await abortavel(() => fonte.revalidar(signal), signal) !== true) return erro(request, 404);
      signal.throwIfAborted();
      if (deps.disponivel() !== true) return erro(request, 503);

      // Não copiar ETag, Location, Set-Cookie, caches ou metadados do upstream.
      const h = headers();
      h.set("Content-Type", tipo);
      h.set("Content-Length", String(bytes.byteLength));
      h.set("Content-Disposition", "inline");
      return new Response(request.method === "HEAD" ? null : bytes, { status: 200, headers: h });
    } catch {
      // Falhas de autenticação, leitura e revalidação nunca viram fallback/redirect.
      return erro(request, 503);
    } finally {
      clearTimeout(timer);
    }
  };
}
