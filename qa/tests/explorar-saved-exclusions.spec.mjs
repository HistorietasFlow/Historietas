import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const contaA = "10000000-0000-4000-8000-000000000001";
const contaB = "10000000-0000-4000-8000-000000000002";
const filtros = {
  busca: "História", categoria: "Fantasia", ordenacao: "mais-recentes",
  formato: "HQ", tag: "aventura", notaMinima: "4", statusEditorial: "concluida",
  palavrasMinimas: "20000", palavrasMaximas: "80000",
};
const url = `/explorar?${new URLSearchParams(filtros)}`;
const painel = page => page.getByRole("dialog", { name: "EXPLORAR", exact: true });
const salvas = page => painel(page).getByRole("region", { name: "Exclusões salvas", exact: true });
const aplicar = page => salvas(page).getByRole("button", { name: "Reaplicar exclusões", exact: true });

async function abrirPainel(page) {
  await page.getByRole("button", { name: "Abrir funções do Explorar", exact: true }).click();
  await expect(painel(page)).toBeVisible();
}

async function prepararContas(page, baseURL) {
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
  const apiURL = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  expect(["127.0.0.1", "localhost"]).toContain(apiURL.hostname);
  const chave = `sb-${apiURL.hostname.split(".")[0]}-auth-token`;
  let sessao = null;

  // Sessão e consulta fictícias para exercitar a aplicação local, inclusive
  // eventos de troca de conta com o painel montado.
  await page.route("**/auth/v1/**", route => route.fulfill(sessao ? {
    json: sessao.user,
  } : {
    status: 401, json: { code: "session_not_found", message: "Sem sessão na fixture" },
  }));
  await page.route("**/rest/v1/**", route => route.fulfill({ json: [] }));

  return async id => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const base64url = value => Buffer.from(JSON.stringify(value)).toString("base64url");
    sessao = id ? {
      user: { id, aud: "authenticated", role: "authenticated", email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
      access_token: `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url({ sub: id, exp })}.local-inert-signature`,
      refresh_token: "local-inert-refresh",
      expires_at: exp,
      expires_in: 3600,
      token_type: "bearer",
    } : null;

    await page.context().clearCookies({ name: chave });
    if (sessao) await page.context().addCookies([{
      name: chave, value: `base64-${base64url(sessao)}`, url: baseURL,
    }]);
    await page.evaluate(({ chave, sessao }) => {
      const canal = new BroadcastChannel(chave);
      canal.postMessage({ event: sessao ? "SIGNED_IN" : "SIGNED_OUT", session: sessao });
      canal.close();
    }, { chave, sessao });
  };
}

async function conferirUrl(page, esperados) {
  await expect.poll(() => Object.fromEntries(new URL(page.url()).searchParams)).toEqual(esperados);
}

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test.describe(dispositivo, () => {
    test.use({ viewport, hasTouch: dispositivo === "mobile" });

    test("exclusões salvas persistem, reaplicam juntas e ficam isoladas por conta", async ({ page, baseURL }) => {
      const trocarConta = await prepararContas(page, baseURL);
      const textoVazio = "Nenhuma exclusão salva neste navegador.";
      const genero = painel(page).getByRole("combobox", { name: "Excluir gênero", exact: true });
      const tag = painel(page).getByRole("textbox", { name: "Excluir tag", exact: true });
      const salvar = salvas(page).getByRole("button", { name: "Salvar exclusões", exact: true });
      const apagar = salvas(page).getByRole("button", { name: "Apagar exclusões salvas", exact: true });

      await page.goto(url);
      await abrirPainel(page);
      await expect(salvas(page)).toHaveCount(0);
      await trocarConta(contaA);
      await expect(salvas(page)).toContainText(textoVazio);
      await expect(salvar).toBeDisabled();

      await genero.selectOption("terror");
      await tag.fill("gore");
      await salvar.click();
      await expect(salvas(page)).toContainText("Excluir gênero: Terror");
      await expect(salvas(page)).toContainText("Excluir tag: gore");

      await trocarConta(null);
      await expect(salvas(page)).toHaveCount(0);
      await page.goto(url);
      await abrirPainel(page);
      await trocarConta(contaA);
      await expect(aplicar(page)).toBeVisible();
      await expect(genero).toHaveValue("");
      await expect(tag).toHaveValue("");
      await conferirUrl(page, filtros);

      const resposta = page.waitForResponse(r => {
        const req = r.request();
        if (!new URL(r.url()).pathname.endsWith("/rpc/listar_obras_catalogo")) return false;
        const args = req.postDataJSON();
        return args?.p_genero_excluido === "terror" && args?.p_tag_excluida === "gore";
      });
      if (dispositivo === "desktop") await aplicar(page).press("Enter");
      else await aplicar(page).tap();
      const catalogo = await resposta;
      expect(catalogo.ok()).toBe(true);
      expect(catalogo.request().postDataJSON()).toMatchObject({
        p_busca: "História", p_genero: "Fantasia", p_formato: "HQ", p_tag: "aventura",
        p_nota_minima: 4, p_status_editorial: "concluida", p_palavras_minimas: 20000, p_palavras_maximas: 80000,
      });
      const filtrosComExclusoes = { ...filtros, generoExcluido: "terror", tagExcluida: "gore" };
      await conferirUrl(page, filtrosComExclusoes);
      await expect(genero).toHaveValue("terror");
      await expect(tag).toHaveValue("gore");
      await page.goBack();
      await conferirUrl(page, filtros);
      await expect(genero).toHaveValue("");
      await expect(tag).toHaveValue("");
      await page.goForward();
      await conferirUrl(page, filtrosComExclusoes);

      const axe = await new AxeBuilder({ page }).include('section[aria-labelledby="explorar-exclusoes-salvas-titulo"]').analyze();
      expect(axe.violations.filter(v => ["critical", "serious"].includes(v.impact))).toEqual([]);

      await trocarConta(contaB);
      await expect(salvas(page)).toContainText(textoVazio);
      await expect(aplicar(page)).toHaveCount(0);
      await expect(apagar).toHaveCount(0);
      // A URL da busca é compartilhável. As preferências de B começam vazias.
      await conferirUrl(page, filtrosComExclusoes);
      await genero.selectOption("romance");
      await tag.fill("");
      await salvar.click();
      await expect(salvas(page)).toContainText("Excluir gênero: Romance");
      await expect(salvas(page)).not.toContainText("gore");

      await trocarConta(contaA);
      await expect(salvas(page)).toContainText("Excluir tag: gore");
      await aplicar(page).click();
      await conferirUrl(page, filtrosComExclusoes);
      await apagar.click();
      await expect(salvas(page)).toContainText(textoVazio);
      await expect(salvas(page)).toBeFocused();
      await expect(aplicar(page)).toHaveCount(0);
      await expect(genero).toHaveValue("terror");
      await expect(tag).toHaveValue("gore");
      await conferirUrl(page, filtrosComExclusoes);

      await trocarConta(contaB);
      await expect(salvas(page)).toContainText("Excluir gênero: Romance");
      await aplicar(page).click();
      await conferirUrl(page, { ...filtros, generoExcluido: "romance" });
      await expect(tag).toHaveValue("");
      await trocarConta(contaA);
      await expect(salvas(page)).toContainText(textoVazio);
    });
  });
}
