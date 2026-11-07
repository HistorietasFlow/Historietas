import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// HTTP controlado testa UI/cache sem escrever no Supabase; SQL real é coberto no pgTAP/Data API.
const normalizar = (valor) => valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const obras = [1, 2, 3, 4].map((n) => ({
  id: `84000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  user_id: "85000000-0000-4000-8000-000000000001", titulo: `Obra exclusão ${n}`,
  autor: "Autora QA", genero: "Fantasia", formato: n === 4 ? "Webnovel" : "HQ",
  classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: true,
  slug: `qa-exclusao-${n}`, tags: n === 1 ? ["base", " AÇÃO  Épica "] : n === 4 ? [] : ["base"],
  criada_em: "2026-01-01T00:00:00Z", atualizado_em: "2026-01-01T00:00:00Z",
  sinopse: "Obra pública de teste", capa_url: "",
}));

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }],
]) {
  test(`exclusão de tag preserva paginação, histórico, cache e retry (${dispositivo})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const consultas = [];
    let falhar = false;
    await page.route("**/auth/v1/**", (route) => route.fulfill({ status: 401, json: { message: "Sem sessão" } }));
    await page.route("**/rest/v1/**", (route) => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname.split("/").at(-1);
      if (endpoint === "listar_obras_catalogo") {
        const p = route.request().postDataJSON();
        consultas.push(p);
        if (p.p_tag_excluida && falhar) return route.fulfill({ status: 503, json: { message: "Catálogo temporariamente indisponível" } });
        const ativos = Boolean(p.p_tag_excluida);
        const elegiveis = ativos ? obras.filter((obra) =>
          !obra.tags.some((tag) => normalizar(tag) === p.p_tag_excluida)
          && (!p.p_tag || obra.tags.some((tag) => normalizar(tag) === p.p_tag))
          && (!p.p_formato || obra.formato === p.p_formato))
          .sort((a, b) => b.id.localeCompare(a.id)) : obras.slice(0, 3);
        const inicio = p.p_cursor_id ? elegiveis.findIndex((obra) => obra.id === p.p_cursor_id) + 1 : 0;
        const pagina = ativos ? elegiveis.slice(inicio, inicio + 1) : elegiveis;
        return route.fulfill({ json: pagina.map((obra) => ({
          obra_id: obra.id, cursor_id: obra.id, cursor_valor: p.p_ordenacao === "mais-capitulos" ? 1 : 0,
          cursor_data: obra.criada_em, tem_mais: ativos && inicio + 1 < elegiveis.length,
        })) });
      }
      if (endpoint === "obras") return route.fulfill({ json: obras.filter((obra) => (url.searchParams.get("id") || "").includes(obra.id)) });
      if (endpoint === "capitulos") return route.fulfill({ json: obras.map((obra, i) => ({
        id: `86000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, obra_id: obra.id,
        user_id: obra.user_id, titulo: "Abertura", ordem: 1, publicado: true, criado_em: obra.criada_em,
      })) });
      return route.fulfill({ json: [] });
    });
    const card = (n) => page.getByRole("link", { name: obras[n - 1].titulo, exact: true });
    await page.goto("/explorar?tagExcluida=acao+epica");
    await expect(card(4)).toBeVisible(); // Fora da amostra inicial.
    await expect(card(1)).toHaveCount(0); // Mesmo tendo sido carregada no início/cache.
    expect(consultas.filter((p) => p.p_tag_excluida)).toHaveLength(1);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card(3)).toBeVisible();
    expect(consultas.filter((p) => p.p_tag_excluida)[1].p_cursor_id).toBe(obras[3].id);
    const abrir = page.getByRole("button", { name: "Abrir funções do Explorar", exact: true });
    const dialogo = page.getByRole("dialog", { name: "EXPLORAR", exact: true });
    await abrir.click();
    const excluir = dialogo.getByRole("textbox", { name: "Excluir tag", exact: true });
    await expect(excluir).toHaveValue("acao epica");
    await dialogo.getByRole("group", { name: "Formato da obra" }).getByRole("button", { name: "HQ", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    await expect(card(4)).toHaveCount(0);
    await page.goBack();
    await expect(page).not.toHaveURL(/formato=/);
    await expect(card(4)).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/formato=HQ/);
    await expect(card(3)).toBeVisible();
    await expect(card(4)).toHaveCount(0);
    await abrir.click();
    await dialogo.getByRole("textbox", { name: "Tag da obra", exact: true }).fill("base");
    await excluir.fill("  AÇÃO   Épica ");
    await dialogo.getByRole("combobox", { name: "Avaliação mínima", exact: true }).selectOption("4.5");
    await dialogo.getByRole("button", { name: /^Mais capítulos/ }).click();
    const axe = await new AxeBuilder({ page }).include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = axe.violations.filter((v) => ["critical", "serious"].includes(v.impact));
    expect(graves, graves.map((v) => `${v.id}: ${v.nodes.length} ocorrência(s)`).join("\n")).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    await expect(card(1)).toHaveCount(0);
    await expect(page).toHaveURL(/tag=base&tagExcluida=acao\+epica&notaMinima=4.5/);
    await page.reload();
    await expect(card(3)).toBeVisible();
    await abrir.click();
    await dialogo.getByRole("combobox", { name: "Avaliação mínima", exact: true }).selectOption("");
    await page.keyboard.press("Escape");
    await expect(card(3)).toBeVisible();
    await expect(page).not.toHaveURL(/notaMinima=/);
    falhar = true;
    await page.reload();
    const aviso = page.getByRole("alert").filter({ hasText: /catálogo/i });
    await expect(aviso).toBeVisible();
    await expect(card(1)).toHaveCount(0);
    falhar = false;
    await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
    await expect(aviso).toBeHidden();
    await expect(card(3)).toBeVisible();
    await abrir.click();
    await excluir.fill("base");
    await page.keyboard.press("Escape");
    await expect(card(1)).toHaveCount(0);
    await expect(card(2)).toHaveCount(0);
    await expect(card(3)).toHaveCount(0);
    await page.getByRole("button", { name: "Autores", exact: true }).click();
    await expect(page).not.toHaveURL(/tagExcluida=/);
    await abrir.click();
    await expect(excluir).toHaveCount(0);
  });
}
