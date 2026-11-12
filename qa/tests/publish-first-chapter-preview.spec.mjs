import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {hasAuthorCredentials, loginAsAuthor} from "./helpers.mjs";

const textoLongo = "  Ler prévia completa\r\n\r\n" + Array.from({length: 32}, (_, i) =>
  `Parágrafo ${i + 1}:  espaços internos e palavras do autor.`).join("\r\n\r\n") +
  "\r\n<script>window.previaExecutada=true</script>\r\n**Markdown literal**\r\nFIM DO CAPÍTULO  ";
const textoPublicado = textoLongo.replace(/\r\n/g, "\n").trim();
const arquivo = (name, texto) => ({name, mimeType: name.endsWith(".md") ? "text/markdown" : "text/plain", buffer: Buffer.from(texto)});

async function abrirPublicar(page, baseURL, viewport) {
  test.skip(!hasAuthorCredentials, "Requer conta E2E local existente.");
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    window.previaLeituras = {texto: 0, anexo: 0};
    window.previaPersistencias = [];
    const lerTexto = FileReader.prototype.readAsText;
    const lerAnexo = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsText = function (...args) {window.previaLeituras.texto++; return lerTexto.apply(this, args);};
    FileReader.prototype.readAsDataURL = function (...args) {window.previaLeituras.anexo++; return lerAnexo.apply(this, args);};
    const salvar = Storage.prototype.setItem;
    Storage.prototype.setItem = function (chave, valor) {
      if (chave.startsWith("historietas-") && chave !== "historietas-idioma") window.previaPersistencias.push(chave);
      return salvar.call(this, chave, valor);
    };
  });
  await loginAsAuthor(page);
  await page.goto("/publicar", {waitUntil: "domcontentloaded"});
  const titulo = page.getByPlaceholder("Ex: Shadow Eclipse");
  await expect(titulo).toBeVisible();
  await titulo.fill("Obra ainda não publicada");
  await page.evaluate(() => {window.previaLeituras = {texto: 0, anexo: 0}; window.previaPersistencias = [];});
  const consultas = [];
  const erros = [];
  page.on("request", request => {
    if (/\/rest\/v1\/|\/storage\/v1\/|\/api\/visualizacoes/.test(request.url())) consultas.push(request.method() + " " + new URL(request.url()).pathname);
  });
  page.on("pageerror", error => erros.push(error.message));
  return {titulo, input: page.locator('input[type="file"][accept^=".pdf"]'), consultas, erros};
}

async function idioma(page, valor) {
  await page.evaluate(valor => {
    localStorage.setItem("historietas-idioma", valor);
    window.dispatchEvent(new StorageEvent("storage", {key: "historietas-idioma", newValue: valor}));
  }, valor);
}

for (const [dispositivo, viewport] of [["desktop", {width: 1440, height: 900}], ["mobile", {width: 390, height: 844}]]) {
  test(`primeiro capítulo TXT completo, literal e acessível (${dispositivo})`, async ({page, baseURL}) => {
    const {titulo, input, consultas, erros} = await abrirPublicar(page, baseURL, viewport);
    await input.setInputFiles(arquivo("primeiro-capitulo.txt", textoLongo));
    await page.getByRole("button", {name: "Transformar em capítulo", exact: true}).click();
    const regiao = page.getByRole("region", {name: "Primeiro capítulo importado", exact: true});
    const botao = regiao.getByRole("button");
    const corpo = regiao.locator("p");
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(await corpo.textContent()).toBe(textoPublicado);
    expect(await corpo.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await botao.focus();
    await page.keyboard.press("Enter");
    await expect(botao).toBeFocused();
    await expect(botao).toHaveAttribute("aria-expanded", "true");
    await expect(corpo).toHaveCSS("white-space", "pre-wrap");
    expect(await corpo.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await botao.getAttribute("aria-controls")).toBe(await corpo.getAttribute("id"));
    expect(await page.evaluate(() => window.previaExecutada)).toBeUndefined();
    await expect(corpo.locator("script, strong, em")).toHaveCount(0);
    const axe = await new AxeBuilder({page}).include('section[aria-label="Primeiro capítulo importado"]').analyze();
    expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
    await botao.focus();
    await page.keyboard.press("Space");
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    for (const [lingua, abrir, recolher] of [["en", "Read full preview", "Collapse preview"], ["es", "Leer vista previa completa", "Contraer vista previa"]]) {
      await idioma(page, lingua);
      const controle = page.getByRole("button", {name: abrir, exact: true});
      const textoId = await controle.getAttribute("aria-controls");
      await controle.click();
      await expect(page.getByRole("button", {name: recolher, exact: true})).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("button", {name: recolher, exact: true})).toBeFocused();
      expect(await page.locator(`p[id="${textoId}"]`).textContent()).toBe(textoPublicado);
      await page.getByRole("button", {name: recolher, exact: true}).click();
    }
    await expect(titulo).toHaveValue("Obra ainda não publicada");
    expect(await page.evaluate(() => window.previaLeituras)).toEqual({texto: 1, anexo: 0});
    expect(await page.evaluate(() => window.previaPersistencias)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(consultas).toEqual([]);
    expect(erros).toEqual([]);
  });

  test(`substituição MD, cancelamento tardio, erro e remoção preservam o formulário (${dispositivo})`, async ({page, baseURL}) => {
    const {titulo, input, consultas, erros} = await abrirPublicar(page, baseURL, viewport);
    const a = "Texto do primeiro capítulo validado e ainda não publicado.";
    const b = "Texto novo em Markdown.\n\n  **Continua literal**, sem substituir o formulário.";
    const regiao = page.getByRole("region", {name: "Primeiro capítulo importado", exact: true});
    await input.setInputFiles(arquivo("primeiro.txt", a));
    await page.getByRole("button", {name: "Transformar em capítulo", exact: true}).click();
    await regiao.getByRole("button").click();
    await input.setInputFiles(arquivo("segundo.md", b));
    await expect(regiao).toHaveCount(0);
    await expect(page.getByText(a, {exact: true})).toHaveCount(0);
    await page.getByRole("button", {name: "Cancelar", exact: true}).click();
    await expect(regiao.locator("p")).toHaveText(a);
    await expect(regiao.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    await input.setInputFiles(arquivo("segundo.md", b));
    await page.getByRole("button", {name: "Transformar em capítulo", exact: true}).click();
    expect(await regiao.locator("p").textContent()).toBe(b);
    await expect(page.getByText(a, {exact: true})).toHaveCount(0);

    // Retém um callback real de leitura; libera-o somente depois de cancelar.
    await page.evaluate(() => {
      const ler = FileReader.prototype.readAsText;
      FileReader.prototype.readAsText = function (...args) {
        FileReader.prototype.readAsText = ler;
        const concluir = this.onload;
        this.onload = event => {window.liberarLeituraPrevia = () => concluir.call(this, event);};
        return ler.apply(this, args);
      };
    });
    await input.setInputFiles(arquivo("tardio.txt", "Uma leitura antiga não pode restaurar este capítulo após cancelar."));
    await page.getByRole("button", {name: "Transformar em capítulo", exact: true}).click();
    await expect.poll(() => page.evaluate(() => typeof window.liberarLeituraPrevia)).toBe("function");
    await page.getByRole("button", {name: "Cancelar", exact: true}).click();
    await page.evaluate(() => window.liberarLeituraPrevia());
    expect(await regiao.locator("p").textContent()).toBe(b);
    await input.setInputFiles(arquivo("curto.txt", "Curto"));
    await page.getByRole("button", {name: "Transformar em capítulo", exact: true}).click();
    await expect(page.getByText("Esse arquivo tem pouco texto para virar um capítulo.", {exact: true})).toBeVisible();
    await expect(regiao).toHaveCount(0);
    await page.getByRole("button", {name: "Cancelar", exact: true}).click();
    expect(await regiao.locator("p").textContent()).toBe(b);
    await page.getByRole("button", {name: "Remover", exact: true}).click();
    await expect(regiao).toHaveCount(0);
    await input.setInputFiles(arquivo("anexo.md", b));
    await page.getByRole("button", {name: "Anexar arquivo completo", exact: true}).click();
    await expect(page.getByText("Arquivo completo anexado", {exact: true})).toBeVisible();
    await expect(regiao).toHaveCount(0);
    await page.getByRole("button", {name: "Remover", exact: true}).click();
    await expect(page.getByText("Arquivo completo anexado", {exact: true})).toHaveCount(0);
    await expect(titulo).toHaveValue("Obra ainda não publicada");
    expect(await page.evaluate(() => window.previaLeituras)).toEqual({texto: 4, anexo: 1});
    expect(await page.evaluate(() => window.previaPersistencias)).toEqual([]);
    expect(consultas).toEqual([]);
    expect(erros).toEqual([]);
  });
}
