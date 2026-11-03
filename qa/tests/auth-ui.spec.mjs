import { test, expect } from "@playwright/test";

test("Login alterna entre entrar, criar conta e recuperar senha", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const form = page.locator("form");

  await expect(page.getByRole("heading", { name: "FAZER LOGIN" })).toBeVisible();
  await expect(form.getByPlaceholder("seuemail@email.com")).toHaveAttribute("type", "email");
  await expect(form.getByPlaceholder("Mínimo de 6 caracteres")).toHaveAttribute("minlength", "6");

  await page.getByRole("button", { name: "CRIAR CONTA", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CRIAR CONTA" })).toBeVisible();
  await expect(form.getByPlaceholder("Ex.: Nome do Autor")).toBeVisible();

  await page.getByRole("button", { name: "ENTRAR", exact: true }).first().click();
  await page.getByRole("button", { name: "Esqueci minha senha", exact: true }).click();
  await expect(page.getByRole("heading", { name: "RECUPERAR SENHA" })).toBeVisible();
  await expect(form.getByRole("button", { name: "ENVIAR LINK DE RECUPERAÇÃO" })).toBeVisible();
  await form.getByRole("button", { name: "VOLTAR PARA ENTRAR" }).click();
  await expect(page.getByRole("heading", { name: "FAZER LOGIN" })).toBeVisible();
});

test("Áreas de autor exigem autenticação e preservam o retorno", async ({ page }) => {
  for (const route of ["/publicar", "/painel-autor", "/configuracoes", "/notificacoes"]) {
    await page.context().clearCookies();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login\?redirectTo=/, { timeout: 20_000 });
    const current = new URL(page.url());
    expect(current.searchParams.get("redirectTo") || "").toContain(route);
  }
});


test("Login mantém redirectTo isolado dos hrefs e bloqueia vetores executáveis", async ({ page }) => {
  const coletarLinks = () =>
    page.locator("a[href]").evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href") || "",
        ariaLabel: link.getAttribute("aria-label") || "",
        outerHTML: link.outerHTML,
      })),
    );

  await page.goto("/login?redirectTo=%2Fpublicar", {
    waitUntil: "domcontentloaded",
  });

  const linksComPublicar = (await coletarLinks()).filter(({ href }) =>
    href.includes("/publicar"),
  );

  expect(linksComPublicar).toEqual([
    expect.objectContaining({
      href: "/publicar",
      ariaLabel: "Publicar",
    }),
  ]);

  await page.goto("/login?redirectTo=%2Fobra%2Faurora", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.locator('a.historietas-bottom-nav-item[href="/publicar"]'),
  ).toHaveCount(1);

  const payloads = [
    "javascript:alert(1)",
    "//evil.example/xss",
    "/\\evil.example/xss",
    '/" onmouseover="alert(1)',
    "/<img src=x onerror=alert(1)>",
  ];

  for (const payload of payloads) {
    await page.goto(`/login?redirectTo=${encodeURIComponent(payload)}`, {
      waitUntil: "domcontentloaded",
    });

    const links = await coletarLinks();
    const hrefs = links.map(({ href }) => href);

    expect(
      hrefs.some((href) => /^javascript:/i.test(href)),
      `redirectTo não pode produzir href javascript: para ${payload}`,
    ).toBe(false);

    expect(
      hrefs.some((href) => /^\/\/evil\.example/i.test(href)),
      `redirectTo não pode produzir URL protocol-relative para ${payload}`,
    ).toBe(false);

    expect(
      links.some(({ outerHTML }) => /onmouseover\s*=|onerror\s*=/i.test(outerHTML)),
      `redirectTo não pode injetar handlers HTML para ${payload}`,
    ).toBe(false);
  }
});
