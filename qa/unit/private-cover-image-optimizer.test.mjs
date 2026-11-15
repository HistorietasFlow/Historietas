import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const require = createRequire(import.meta.url);
const { ImageOptimizerCache } = require("next/dist/server/image-optimizer");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const { recusarFonteLocalDinamica } = load("lib/server/capas/proteger-otimizador.ts", { "server-only": {} });

test("Proxy recusa fontes locais dinâmicas/codificadas antes do cache, inclusive HEAD e parâmetros repetidos", async () => {
  const path = "/api/capas-obras/c0200000-0000-4000-8000-000000000001";
  for (const source of [path, `/%61pi${path.slice(4)}`, `${path}?token=segredo`,
    `/_next/static/media/%2e%2e%2f%2e%2e%2f%2e%2e${path}`, `/_next/static/media/a.png?url=${path}`,
    `/_next/static/media/a.png#${path}`, `/icon-192.png%2f..${path}`, `//localhost${path}`,
    `/_next/image?url=${encodeURIComponent(path)}&w=640&q=75`, "/qualquer-rota-dinamica.png",
  ]) for (const method of ["GET", "HEAD"]) {
    const res = recusarFonteLocalDinamica(new Request(`http://localhost/_next/image?${new URLSearchParams({ url: source })}`, { method }));
    assert.equal(res.status, 400, source); assert.ok(res.headers.get("cache-control").includes("no-store"));
    assert.equal(res.headers.get("etag"), null);
    if (method === "HEAD") assert.equal(await res.text(), "");
  }
  for (const source of ["/icon-192.png", "/_next/static/media/legitima.abcdef.png", "/_next/static/immutable/media/legitima.abcdef.webp"]) {
    assert.equal(recusarFonteLocalDinamica(new Request(`http://localhost/_next/image?${new URLSearchParams({ url: source })}`)), null);
  }
  assert.equal(recusarFonteLocalDinamica(new Request("http://localhost/_next/image?url=/icon-192.png&url=/api/capas-obras" )).status, 400);
});

test("validador real do Next bloqueia API privada em URLs locais/absolutas/codificadas e recursivas", async () => {
  const old = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    const config = load("next.config.ts", { "@sentry/nextjs/config": { withSentryConfig: c => c } }).default;
    const validate = url => ImageOptimizerCache.validateParams({ headers: {} }, { url, w: "640", q: "75" },
      { ...config, images: { ...imageConfigDefault, ...config.images } }, false);
    const path = "/api/capas-obras/c0200000-0000-4000-8000-000000000001";
    for (const candidate of [path, `${path}?token=segredo`, `/%61pi${path.slice(4)}`, path.replaceAll("/", "%2f"),
      `/icon-192.png/../${path.slice(1)}`, `http://localhost${path}`, `https://supabase.test${path}`,
      `//localhost${path}`, `/_next/image?url=${encodeURIComponent(path)}&w=640&q=75`,
      `https://supabase.test/storage/v1/object/authenticated/capas-obras/${path}`, "/api/arquivos-obras/url",
      `/_next/static/media/%2e%2e%2f%2e%2e%2f%2e%2e${path}`,
      `/icon-192.png%2f..${path}`, `/icon-192.png/${path.slice(1)}`,
    ]) assert.ok(validate(candidate).errorMessage, candidate);
    assert.equal(validate("/icon-192.png").errorMessage, undefined);
    assert.ok(validate("/_next/static/media/nao-inventariada.png").errorMessage);
    assert.ok(validate("/icon-192.png?url=privado").errorMessage);
    assert.equal(validate("https://supabase.test/storage/v1/object/public/capas-obras/usuario/capa.png").errorMessage, undefined);
    const rules = await config.headers();
    const apiHeaders = rules.find(rule => rule.source === "/api/capas-obras/:path*").headers;
    assert.ok(apiHeaders.some(h => h.key === "Cache-Control" && h.value.includes("no-store")));
    for (const key of ["CDN-Cache-Control", "Vercel-CDN-Cache-Control", "Surrogate-Control"]) assert.ok(apiHeaders.some(h => h.key === key && h.value === "no-store"));
  } finally {
    if (old === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = old;
  }
});
