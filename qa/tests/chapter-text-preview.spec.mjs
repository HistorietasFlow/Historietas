import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { authorEmail, authorPassword, destructiveEnabled, hasAuthorCredentials, loginAsAuthor } from "./helpers.mjs";

const textoSalvo = "Rascunho privado original.\n\nEste texto deve permanecer intacto no banco.";
const textoEditado = Array.from({length: 35}, (_, i) => `Parágrafo ${i + 1}: texto ainda não salvo.`).join("\n\n") +
  "\n\n  Recuo preservado.\n<script>window.previaInsegura=true</script>\n**Texto literal**\nFIM DA PRÉVIA";
let cliente, obraId, capituloId;

test.beforeAll(async () => {
  if (!hasAuthorCredentials || !destructiveEnabled) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  cliente = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  const login = await cliente.auth.signInWithPassword({email: authorEmail, password: authorPassword});
  expect(login.error).toBeNull();
  const usuarioId = login.data.user.id;
  obraId = randomUUID(); capituloId = randomUUID();
  const obra = await cliente.from("obras").insert({
    id: obraId, user_id: usuarioId, titulo: "Obra de prévia E2E", autor: "Autor E2E",
    genero: "Fantasia", formato: "Conto", classificacao_indicativa: "Livre",
    sinopse: "Obra privada descartável para testar prévia sem publicação.",
    publicado: false, slug: `previa-e2e-${obraId}`,
  });
  expect(obra.error).toBeNull();
  const capitulo = await cliente.from("capitulos").insert({
    id: capituloId, obra_id: obraId, user_id: usuarioId, ordem: 1,
    titulo: "Rascunho privado", texto: textoSalvo, publicado: false,
  });
  expect(capitulo.error).toBeNull();
});

test.afterAll(async () => {
  if (!cliente || !obraId) return;
  const removido = await cliente.from("obras").delete().eq("id", obraId);
  expect(removido.error).toBeNull();
});

for (const [dispositivo, viewport] of [
  ["desktop", {width: 1440, height: 900}],
  ["mobile", {width: 390, height: 844}],
]) {
  for (const modo of ["adicionar", "editar"]) {
    test(`prévia integral sem salvar, com teclado e rascunho preservado — ${modo}/${dispositivo}`, async ({page, baseURL}) => {
      test.skip(!hasAuthorCredentials || !destructiveEnabled, "Requer fixtures descartáveis locais.");
      expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
      await page.setViewportSize(viewport);
      await loginAsAuthor(page);
      await page.goto(`/${modo}-capitulo?obraId=${obraId}${modo === "editar" ? `&capituloId=${capituloId}` : ""}`, {waitUntil: "domcontentloaded"});
      const entrada = page.getByLabel("Texto do capítulo", {exact: true});
      await expect(entrada).toBeVisible();
      await expect(entrada).toHaveValue(modo === "editar" ? textoSalvo : "");
      const consultas = [];
      const erros = [];
      page.on("pageerror", (error) => erros.push(error.message));
      page.on("request", (request) => {
        if (/\/rest\/v1\/(obras|capitulos)(?:\?|$)/.test(request.url())) consultas.push(request.method());
      });
      await entrada.fill(textoEditado);
      const abrir = page.getByRole("button", {name: "Ler prévia completa", exact: true});
      const textoId = await abrir.getAttribute("aria-controls");
      expect(textoId).toBeTruthy();
      const botao = page.locator(`button[aria-controls="${textoId}"]`);
      const previa = page.locator(`p[id="${textoId}"]`);
      await expect(previa).toHaveAttribute("id", textoId);
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      expect(await previa.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await botao.focus();
      await page.keyboard.press("Enter");
      await expect(botao).toHaveAttribute("aria-expanded", "true");
      await expect(botao).toBeFocused();
      await expect(previa).toHaveCSS("white-space", "pre-wrap");
      expect(await previa.textContent()).toBe(textoEditado);
      expect(await previa.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      expect(await page.evaluate(() => window.previaInsegura)).toBeUndefined();
      const axe = await new AxeBuilder({page}).include("main aside").analyze();
      expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.keyboard.press("Space");
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(entrada).toHaveValue(textoEditado);

      // Idioma da interface não pode traduzir uma frase autoral igual a um rótulo.
      await entrada.fill("Ler capítulo");
      await page.evaluate(() => {
        localStorage.setItem("historietas-idioma", "en");
        window.dispatchEvent(new StorageEvent("storage", {key: "historietas-idioma", newValue: "en"}));
      });
      await expect(page.getByRole("button", {name: "Read full preview", exact: true})).toBeVisible();
      await expect(previa).toHaveText("Ler capítulo");
      await page.getByRole("button", {name: "Read full preview", exact: true}).click();
      await expect(page.getByRole("button", {name: "Collapse preview", exact: true})).toHaveAttribute("aria-expanded", "true");
      await page.evaluate(() => {
        localStorage.setItem("historietas-idioma", "es");
        window.dispatchEvent(new StorageEvent("storage", {key: "historietas-idioma", newValue: "es"}));
      });
      await page.getByRole("button", {name: "Contraer vista previa", exact: true}).click();
      await expect(page.getByRole("button", {name: "Leer vista previa completa", exact: true})).toHaveAttribute("aria-expanded", "false");
      await expect(previa).toHaveText("Ler capítulo");
      expect(consultas).toEqual([]);
      expect(erros).toEqual([]);

      const persistido = await cliente.from("capitulos").select("id,texto,publicado").eq("obra_id", obraId);
      expect(persistido.error).toBeNull();
      expect(persistido.data).toEqual([{id: capituloId, texto: textoSalvo, publicado: false}]);
    });
  }
}
