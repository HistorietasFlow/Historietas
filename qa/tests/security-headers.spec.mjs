import { test, expect } from "@playwright/test";

const rotasParaValidar = [
  "/",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
];

test("respostas públicas expõem headers de segurança básicos", async ({ request }) => {
  for (const rota of rotasParaValidar) {
    const response = await request.get(rota, { maxRedirects: 0 });
    const headers = response.headers();

    expect(
      headers["x-content-type-options"],
      `${rota} deve enviar X-Content-Type-Options`,
    ).toBe("nosniff");

    expect(
      headers["x-frame-options"],
      `${rota} deve enviar X-Frame-Options`,
    ).toBe("SAMEORIGIN");

    expect(
      headers["permissions-policy"],
      `${rota} deve enviar Permissions-Policy`,
    ).toBe(
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    );
  }
});

test("rota protegida preserva redirect para login com headers de segurança", async ({ request }) => {
  const response = await request.get("/publicar", { maxRedirects: 0 });
  const headers = response.headers();

  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(headers.location || "").toContain("/login");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
});
