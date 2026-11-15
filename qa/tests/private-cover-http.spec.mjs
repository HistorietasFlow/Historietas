import { test, expect } from "@playwright/test";

const path = "/api/capas-obras/c0200000-0000-4000-8000-000000000001";

test.beforeAll(async ({ baseURL }) => {
  expect(["localhost", "127.0.0.1", "[::1]"]).toContain(new URL(baseURL).hostname);
});

function noStore(response) {
  const headers = response.headers();
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["cache-control"]).not.toMatch(/\bpublic\b|s-maxage/);
  for (const key of ["cdn-cache-control", "vercel-cdn-cache-control", "surrogate-control"]) expect(headers[key]).toBe("no-store");
  expect(headers.pragma).toBe("no-cache");
  expect(headers.expires).toBe("0");
  expect(headers.etag).toBeUndefined();
  expect(headers.location).toBeUndefined();
}

test("rota real permanece desativada: todos os métodos, condicionais, credenciais e HEAD sem cache", async ({ request }) => {
  for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    for (const headers of [{}, { authorization: "Bearer credencial-fabricada", "if-none-match": "*", "if-modified-since": "Fri, 13 Nov 2026 00:00:00 GMT" }]) {
      const res = await request.fetch(path, { method, headers, maxRedirects: 0 });
      expect(res.status()).toBe(503); noStore(res);
      if (method === "HEAD") expect((await res.body()).length).toBe(0);
      else expect(await res.json()).toEqual({ erro: "capa_indisponivel" });
    }
  }
  const unsupported = await request.fetch(path, { method: "PROPFIND", maxRedirects: 0 });
  expect(unsupported.status()).toBe(400); noStore(unsupported);
});

test("namespace inteira, inclusive caminhos inválidos, permanece desativada e sem ETag/304", async ({ request }) => {
  for (const url of ["/api/capas-obras", "/api/capas-obras/invalida", `${path}/extra`, `${path}?url=privado`]) for (const method of ["GET", "HEAD"]) {
    const res = await request.fetch(url, { method, headers: { "if-none-match": "*" }, maxRedirects: 0 });
    expect(res.status()).toBe(503); noStore(res);
    if (method === "HEAD") expect((await res.body()).length).toBe(0);
  }
});

test("otimizador real rejeita capa privada repetidamente e mantém imagens estáticas permitidas", async ({ request, baseURL }) => {
  const candidates = [path, `/%61pi${path.slice(4)}`, `${baseURL}${path}`,
    `${path}?token=nao-aceitar`, `/icon-192.png/../${path.slice(1)}`,
    `/_next/image?url=${encodeURIComponent(path)}&w=640&q=75`,
    `/_next/static/media/%2e%2e%2f%2e%2e%2f%2e%2e${path}`, `/icon-192.png%2f..${path}`];
  for (const url of candidates) for (const method of ["GET", "HEAD"]) {
    const target = `/_next/image?${new URLSearchParams({ url, w: "640", q: "75" })}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await request.fetch(target, { method, maxRedirects: 0 });
      expect(res.status(), `${method} ${url}`).toBe(400);
      expect(res.headers()["x-nextjs-cache"]).toBeUndefined();
      expect(res.headers().etag).toBeUndefined();
      if (method === "HEAD") expect((await res.body()).length).toBe(0);
    }
  }
  const allowed = await request.get(`/_next/image?${new URLSearchParams({ url: "/icon-192.png", w: "640", q: "75" })}`);
  expect(allowed.status()).toBe(200);
  expect(allowed.headers()["content-type"]).toMatch(/^image\//);
});
