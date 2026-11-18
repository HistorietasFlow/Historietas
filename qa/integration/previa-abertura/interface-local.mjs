import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const navegacao = { headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined };
const tamanhos = [
  { width: 1440, height: 900, idioma: "pt-BR", abrir: "Ler o começo", fechar: "Fechar prévia" },
  { width: 390, height: 844, idioma: "pt-BR", abrir: "Ler o começo", fechar: "Fechar prévia" },
  { width: 375, height: 812, idioma: "es", abrir: "Leer el comienzo", fechar: "Cerrar vista previa" },
  { width: 320, height: 740, idioma: "en", abrir: "Read the opening", fechar: "Close preview" },
];
const timeout = 30000;

async function abrirNavegador() {
  const endpoint = process.env.PW_TEST_CONNECT_WS_ENDPOINT;
  if (!endpoint) return chromium.launch(navegacao);
  const url = new URL(endpoint);
  if (url.protocol !== "ws:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error("O navegador do ensaio deve estar em loopback");
  }
  return chromium.connect(endpoint);
}

async function abrirExplorar(browser, origem, tamanho, prefixo) {
  const contexto = await browser.newContext({ viewport: { width: tamanho.width, height: tamanho.height }, hasTouch: tamanho.width < 500 });
  await contexto.route(/.*/, route => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ? route.continue() : route.abort();
  });
  await contexto.addInitScript(idioma => localStorage.setItem("historietas-idioma", idioma), tamanho.idioma);
  const pagina = await contexto.newPage();
  const pedidos = [];
  pagina.on("request", req => { if (new URL(req.url()).pathname.endsWith("/previa")) pedidos.push(req.url()); });
  await pagina.goto(origem + "/explorar?categoria=Fantasia", { waitUntil: "domcontentloaded", timeout: 90000 });
  const card = pagina.locator("article").filter({ has: pagina.locator('a[href="/obra/' + prefixo + 'publicada"]') }).first();
  await expect(card).toBeVisible({ timeout });
  const botao = card.getByRole("button");
  return { contexto, pagina, card, botao, pedidos };
}

export async function conferirDesligado(origem, prefixo) {
  const browser = await abrirNavegador();
  try {
    const { pagina, pedidos } = await abrirExplorar(browser, origem, tamanhos[0], prefixo);
    await expect(pagina.getByRole("button", { name: "Ler o começo" })).toHaveCount(0);
    expect(pedidos).toHaveLength(0);
  } finally { await browser.close(); }
}

async function mudarSessao(pagina, chave, sessao) {
  await pagina.evaluate(({ chave, sessao }) => {
    document.cookie = sessao
      ? chave + "=base64-" + btoa(JSON.stringify(sessao)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "") + "; path=/; SameSite=Lax"
      : chave + "=; path=/; Max-Age=0";
    const canal = new BroadcastChannel(chave);
    canal.postMessage({ event: sessao ? "SIGNED_IN" : "SIGNED_OUT", session: sessao });
    canal.close();
  }, { chave, sessao });
}

export async function conferirHabilitado(origem, prefixo, trecho, criarSessao, chaveCookie) {
  const browser = await abrirNavegador();
  try {
    for (const tamanho of tamanhos) {
      const { contexto, pagina, card, botao, pedidos } = await abrirExplorar(browser, origem, tamanho, prefixo);
      try {
        await expect(botao).toHaveAccessibleName(tamanho.abrir);
        expect(pedidos).toHaveLength(0);
        const url = pagina.url();
        await botao.scrollIntoViewIfNeeded();
        await botao.focus();
        const rolagem = await pagina.evaluate(() => window.scrollY);
        if (tamanho.width < 500) await botao.tap();
        else await botao.press("Enter");
        await expect(card.getByRole("status")).toHaveText(trecho, { timeout });
        expect(pedidos).toHaveLength(1);
        expect(pedidos[0]).toBe(origem + "/api/obras/" + prefixo + "publicada/previa");
        await expect(botao).toHaveAttribute("aria-expanded", "true");
        await expect(botao).toHaveAccessibleName(tamanho.fechar);
        await expect(botao).toBeFocused();
        expect(pagina.url()).toBe(url);
        const geometria = await card.evaluate(el => ({
          cabe: el.scrollWidth <= el.clientWidth + 1,
          paginaCabe: document.documentElement.scrollWidth <= innerWidth + 1,
        }));
        expect(geometria).toEqual({ cabe: true, paginaCabe: true });
        if (tamanho.width < 500) await botao.tap();
        else await botao.press("Space");
        await expect(botao).toHaveAttribute("aria-expanded", "false");
        await expect(card.getByText(trecho)).toHaveCount(0);
        await expect(botao).toBeFocused();
        expect(Math.abs(await pagina.evaluate(() => window.scrollY) - rolagem)).toBeLessThanOrEqual(2);
        expect(pagina.url()).toBe(url);
        if (tamanho.width === 1440) {
          // Só a resposta tardia é controlada. A leitura anterior passou pela rota e pelo banco reais.
          let liberar;
          const espera = new Promise(resolve => { liberar = resolve; });
          const caminho = "**/api/obras/*/previa";
          await pagina.route(caminho, async route => {
            await espera;
            await route.fulfill({ json: { trecho: "Resposta da identidade anterior" } }).catch(() => {});
          });
          try {
            const inicio = pagina.waitForRequest(req => new URL(req.url()).pathname.endsWith("/previa"));
            await botao.click();
            await inicio;
            await mudarSessao(pagina, chaveCookie, await criarSessao());
            await expect(botao).toHaveAttribute("aria-expanded", "false", { timeout });
          } finally {
            liberar();
            await pagina.unroute(caminho);
          }
          await expect(card.getByText("Resposta da identidade anterior")).toHaveCount(0);
          await botao.click();
          await expect(card.getByRole("status")).toHaveText(trecho, { timeout });
          await mudarSessao(pagina, chaveCookie, null);
          await expect(botao).toHaveAttribute("aria-expanded", "false", { timeout });
          await expect(card.getByText(trecho)).toHaveCount(0);
          for (const [status, mensagem] of [[404, "Prévia indisponível."], [401, "Entre novamente para ler a prévia."], [503, "Não foi possível carregar a prévia. Tente novamente."]]) {
            await pagina.route(caminho, route => route.fulfill({ status, json: {} }), { times: 1 });
            await botao.click();
            await expect(card.getByRole("status")).toHaveText(mensagem);
            await botao.click();
          }
        }
        // Capturar um elemento pode rolar a página. Só faça isso após medir a interação real.
        const pasta = process.env.HISTORIETAS_QA_CAPTURAS;
        if (pasta) {
          await botao.click();
          await expect(card.getByRole("status")).toHaveText(trecho);
          await mkdir(pasta, { recursive: true });
          await card.screenshot({ path: join(pasta, "previa-" + tamanho.width + ".png"), animations: "disabled" });
        }
      } finally { await contexto.close(); }
    }
  } finally { await browser.close(); }
}
