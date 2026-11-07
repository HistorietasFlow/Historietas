import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// HTTP controlado isola cache/ordem de respostas. O contrato SQL é testado em pgTAP/Data API.
const obras = ["Fantasia, Romance", "Melodrama", "Fantasia sombria", "SCI-FI espacial"].map((genero, i) => ({
  id: `87000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  user_id: "88000000-0000-4000-8000-000000000001", titulo: `Obra gênero ${i + 1}`,
  autor: "Autora QA", genero, formato: i === 3 ? "Webnovel" : "HQ",
  classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: true,
  slug: `qa-genero-${i + 1}`, tags: ["base"], criada_em: "2026-01-01T00:00:00Z",
  atualizado_em: "2026-01-01T00:00:00Z", sinopse: "Obra pública de teste", capa_url: "",
}));

async function prepararCatalogo(page, viewport) {
  await page.setViewportSize(viewport);
  const consultas = [];
  let falhar = false;
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 401, json: { message: "Sem sessão" } }));
  await page.route("**/rest/v1/**", route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split("/").at(-1);
    if (endpoint === "listar_obras_catalogo") {
      const p = route.request().postDataJSON();
      consultas.push(p);
      if (p.p_genero_excluido && falhar) return route.fulfill({ status: 503, json: { message: "Indisponível" } });
      const ativo = Boolean(p.p_genero_excluido);
      const elegiveis = ativo ? obras.filter(obra => {
        const genero = obra.genero.toLowerCase();
        const excluido = p.p_genero_excluido === "romance" ? /\bromance\b/.test(genero)
          : p.p_genero_excluido === "drama" ? /\bdrama\b/.test(genero)
            : p.p_genero_excluido === "ficcao" ? /sci-fi/.test(genero) : /fantasia/.test(genero);
        return !excluido && (!p.p_formato || obra.formato === p.p_formato);
      }).sort((a, b) => b.id.localeCompare(a.id)) : obras.slice(0, 3);
      const inicio = p.p_cursor_id ? elegiveis.findIndex(o => o.id === p.p_cursor_id) + 1 : 0;
      const pagina = ativo ? elegiveis.slice(inicio, inicio + 1) : elegiveis;
      return route.fulfill({ json: pagina.map(obra => ({
        obra_id: obra.id, cursor_id: obra.id, cursor_valor: p.p_ordenacao === "mais-capitulos" ? 1 : 0,
        cursor_data: obra.criada_em, tem_mais: ativo && inicio + 1 < elegiveis.length,
      })) });
    }
    if (endpoint === "obras") return route.fulfill({ json: obras.filter(o => (url.searchParams.get("id") || "").includes(o.id)) });
    if (endpoint === "capitulos") return route.fulfill({ json: obras.map((obra, i) => ({
      id: `89000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, obra_id: obra.id,
      user_id: obra.user_id, titulo: "Abertura", ordem: 1, publicado: true, criado_em: obra.criada_em,
    })) });
    return route.fulfill({ json: [] });
  });
  const card = n => page.getByRole("link", { name: obras[n - 1].titulo, exact: true });
  const abrir = page.getByRole("button", { name: "Abrir funções do Explorar", exact: true });
  const dialogo = page.getByRole("dialog", { name: "EXPLORAR", exact: true });
  const excluir = dialogo.getByRole("combobox", { name: "Excluir gênero", exact: true });
  return { card, abrir, dialogo, excluir, consultas, indisponivel: valor => { falhar = valor; } };
}

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }],
]) {
  test(`excluir gênero preserva termos, cursor e histórico (${dispositivo})`, async ({ page }) => {
    const { card, abrir, dialogo, excluir, consultas } = await prepararCatalogo(page, viewport);
    await page.goto("/explorar?generoExcluido=romance");
    await expect(card(4)).toBeVisible(); // Fora da amostra inicial.
    await expect(card(1)).toHaveCount(0); // Obra composta não reaparece do cache.
    expect(consultas.filter(p => p.p_genero_excluido)).toHaveLength(1);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card(3)).toBeVisible();
    expect(consultas.filter(p => p.p_genero_excluido)[1].p_cursor_id).toBe(obras[3].id);
    await abrir.click();
    await expect(excluir).toHaveValue("romance");
    await dialogo.getByRole("group", { name: "Formato da obra" }).getByRole("button", { name: "HQ", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    await expect(card(4)).toHaveCount(0);
    await page.goBack();
    await expect(page).not.toHaveURL(/formato=/);
    await expect(card(4)).toBeVisible();
    await page.goForward();
    await expect(card(3)).toBeVisible();
    await expect(card(4)).toHaveCount(0);
    await abrir.click();
    await excluir.selectOption("drama");
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card(2)).toBeVisible(); // Melodrama não é Drama.
  });

  test(`combinações, axe e retry de gênero (${dispositivo})`, async ({ page }) => {
    const { card, abrir, dialogo, excluir, consultas, indisponivel } = await prepararCatalogo(page, viewport);
    await page.goto("/explorar?formato=HQ&generoExcluido=romance");
    await expect(card(3)).toBeVisible();
    await abrir.click();
    await dialogo.getByRole("textbox", { name: "Tag da obra", exact: true }).fill("base");
    await dialogo.getByRole("textbox", { name: "Excluir tag", exact: true }).fill("bloqueada");
    await dialogo.getByRole("combobox", { name: "Avaliação mínima", exact: true }).selectOption("4.5");
    await dialogo.getByRole("button", { name: /^Mais capítulos/ }).click();
    const axe = await new AxeBuilder({ page }).include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = axe.violations.filter(v => ["critical", "serious"].includes(v.impact));
    expect(graves, graves.map(v => `${v.id}: ${v.nodes.length} ocorrência(s)`).join("\n")).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    const recargaFiltrada = page.waitForResponse(r => r.url().endsWith("/rpc/listar_obras_catalogo")
      && r.request().postDataJSON()?.p_genero_excluido === "romance");
    await page.reload();
    await recargaFiltrada;
    await expect(card(3)).toBeVisible();
    expect(consultas.at(-1)).toMatchObject({ p_genero_excluido: "romance", p_tag: "base",
      p_tag_excluida: "bloqueada", p_nota_minima: 4.5, p_ordenacao: "mais-capitulos", p_formato: "HQ" });
    indisponivel(true);
    await abrir.click();
    await excluir.selectOption("drama");
    await page.keyboard.press("Escape");
    const aviso = page.getByRole("alert").filter({ hasText: /catálogo/i });
    await expect(aviso).toBeVisible();
    await expect(card(1)).toHaveCount(0);
    indisponivel(false);
    await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
    await expect(aviso).toBeHidden();
    await expect(card(3)).toBeVisible();
    await page.getByRole("button", { name: "Autores", exact: true }).click();
    await expect(page).not.toHaveURL(/generoExcluido=/);
    await abrir.click();
    await expect(excluir).toHaveCount(0);
  });

  test(`exclusão de gênero usa RPC local real e vazio legítimo (${dispositivo})`, async ({ page }) => {
    test.skip(!process.env.E2E_PUBLIC_WORK_ID, "Requer fixture Supabase local");
    expect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
    await page.setViewportSize(viewport);
    const consultaFiltrada = page.waitForResponse(r => r.url().endsWith("/rpc/listar_obras_catalogo")
      && r.request().postDataJSON()?.p_genero_excluido === "fantasia" && r.ok());
    await page.goto("/explorar?busca=Obra+Pública+E2E&categoria=Fantasia&generoExcluido=fantasia");
    await consultaFiltrada;
    await expect(page.getByRole("status", { name: "Carregando Explorar", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Obra Pública E2E", exact: true })).toHaveCount(0);
    await expect(page.getByText("PUBLIQUE SUA HISTÓRIA", { exact: true })).toBeVisible();
    const abrir = page.getByRole("button", { name: "Abrir funções do Explorar", exact: true });
    await abrir.click();
    await page.getByRole("dialog", { name: "EXPLORAR", exact: true })
      .getByRole("combobox", { name: "Excluir gênero", exact: true }).selectOption("");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Obra Pública E2E", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("link", { name: "Obra Pública E2E", exact: true })).toHaveCount(0);
    await expect(page.getByText("PUBLIQUE SUA HISTÓRIA", { exact: true })).toBeVisible();
  });
}
