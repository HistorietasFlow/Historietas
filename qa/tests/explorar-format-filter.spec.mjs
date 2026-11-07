import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Contrato HTTP simulado: testa UI/URL/paginação sem criar dados ou usar Supabase remoto.
const ids = [1, 2, 3, 4].map((numero) => `10000000-0000-4000-8000-${String(numero).padStart(12, "0")}`);
const totaisCapitulos = [1, 3, 2, 1];
const obras = ids.map((id, indice) => ({
  id, user_id: "20000000-0000-4000-8000-000000000001",
  titulo: `História formato ${indice + 1}`, autor: "Autora QA", genero: "Fantasia",
  formato: indice === 3 ? "HQ" : indice === 2 ? "Mangá" : "Webnovel", classificacao_indicativa: "Livre",
  avisos_conteudo: [], publicado: true, slug: `qa-formato-${indice + 1}`,
  criada_em: "2026-01-01T00:00:00Z", atualizado_em: "2026-01-01T00:00:00Z",
  sinopse: "História pública para testar formato.", tags: indice === 0 || indice === 3 ? ["AÇÃO"] : [], capa_url: "",
}));

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test(`formato e capítulos preservam resultados, URL e cursor (${dispositivo})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const consultas = [];
    await page.route("**/auth/v1/**", (route) => route.fulfill({
      status: 401, json: { code: "session_not_found", message: "Sem sessão na fixture" },
    }));
    await page.route("**/rest/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const endpoint = url.pathname.split("/").at(-1);
      if (endpoint === "listar_obras_catalogo") {
        const params = request.postDataJSON();
        consultas.push(params);
        if (params.p_tag) {
          const elegiveis = obras.filter((obra) => params.p_tag === "acao" && obra.tags.includes("AÇÃO")
            && (!params.p_formato || obra.formato === params.p_formato));
          const inicio = params.p_cursor_id ? elegiveis.findIndex((obra) => obra.id === params.p_cursor_id) + 1 : 0;
          return route.fulfill({ json: elegiveis.slice(inicio, inicio + 1).map((obra) => ({
            obra_id: obra.id, cursor_id: obra.id, cursor_valor: 0,
            cursor_data: obra.criada_em, tem_mais: inicio + 1 < elegiveis.length,
          })) });
        }
        if (params.p_ordenacao === "mais-capitulos") {
          const elegiveis = obras.slice(0, 3).filter((obra) => !params.p_formato || obra.formato === params.p_formato)
            .sort((a, b) => totaisCapitulos[ids.indexOf(b.id)] - totaisCapitulos[ids.indexOf(a.id)]);
          const inicio = params.p_cursor_id ? elegiveis.findIndex((obra) => obra.id === params.p_cursor_id) + 1 : 0;
          return route.fulfill({ json: elegiveis.slice(inicio, inicio + 1).map((obra) => ({
            obra_id: obra.id, cursor_id: obra.id, cursor_valor: totaisCapitulos[ids.indexOf(obra.id)],
            cursor_data: obra.criada_em, tem_mais: inicio + 1 < elegiveis.length,
          })) });
        }
        const selecionadas = params.p_formato === "Mangá"
          ? [obras[2]]
          : params.p_formato === "Webnovel"
            ? [obras[params.p_cursor_id ? 1 : 0]]
            : obras.slice(0, 3);
        return route.fulfill({ json: selecionadas.map((obra) => ({
          obra_id: obra.id, cursor_id: obra.id, cursor_valor: 0,
          cursor_data: obra.criada_em,
          tem_mais: params.p_formato === "Webnovel" && !params.p_cursor_id,
        })) });
      }
      if (endpoint === "obras") {
        const filtroIds = url.searchParams.get("id") || "";
        return route.fulfill({ json: obras.filter((obra) => filtroIds.includes(obra.id)) });
      }
      if (endpoint === "capitulos") {
        return route.fulfill({ json: obras.flatMap((obra, indice) => Array.from(
          { length: totaisCapitulos[indice] }, (_, capitulo) => ({
            id: `30000000-0000-4000-8000-${String(indice * 10 + capitulo + 1).padStart(12, "0")}`,
            obra_id: obra.id, user_id: obra.user_id, titulo: `Capítulo ${capitulo + 1}`, ordem: capitulo + 1,
            publicado: true, criado_em: obra.criada_em,
          }),
        )) });
      }
      return route.fulfill({ json: [] });
    });

    await page.goto("/explorar?categoria=Fantasia&ordenacao=mais-recentes&formato=Webnovel");
    const card1 = page.getByRole("link", { name: obras[0].titulo, exact: true });
    const card2 = page.getByRole("link", { name: obras[1].titulo, exact: true });
    const card3 = page.getByRole("link", { name: obras[2].titulo, exact: true });
    await expect(card1).toBeVisible();
    await expect(card3).toHaveCount(0);
    await expect.poll(() => consultas.filter((consulta) => consulta.p_formato === "Webnovel").length).toBe(1);

    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card2).toBeVisible();
    const paginas = consultas.filter((consulta) => consulta.p_formato === "Webnovel");
    expect(paginas).toHaveLength(2);
    expect(paginas[1].p_cursor_id).toBe(ids[0]);
    expect(paginas.every((consulta) => consulta.p_genero === "Fantasia" && consulta.p_ordenacao === "mais-recentes")).toBe(true);

    const acionador = page.getByRole("button", { name: "Abrir funções do Explorar", exact: true });
    await acionador.click();
    const dialogo = page.getByRole("dialog", { name: "EXPLORAR", exact: true });
    const todas = dialogo.getByRole("button", { name: /^Todas/ });
    await expect(todas).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialogo.getByRole("button", { name: /Limpar filtros/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(todas).toBeFocused();
    const formatos = dialogo.getByRole("group", { name: "Formato da obra" });
    await expect(formatos.getByRole("button", { name: "Webnovel", exact: true })).toHaveAttribute("aria-pressed", "true");
    await formatos.getByRole("button", { name: "Mangá", exact: true }).click();
    await expect(page).toHaveURL(/formato=Mang%C3%A1/);
    const axe = await new AxeBuilder({ page }).include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = axe.violations.filter((violacao) => ["critical", "serious"].includes(violacao.impact));
    expect(graves, graves.map((violacao) => `${violacao.id}: ${violacao.nodes.length} ocorrência(s)`).join("\n")).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();
    await expect(acionador).toBeFocused();
    await expect(card3).toBeVisible();
    await expect(card1).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(/formato=Webnovel/);
    await expect(card1).toBeVisible();
    await expect(card3).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(/formato=Mang%C3%A1/);
    await expect(card3).toBeVisible();
    await page.reload();
    await expect(card3).toBeVisible();
    await expect(card1).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir funções do Explorar", exact: true }).click();
    await expect(formatos.getByRole("button", { name: "Mangá", exact: true })).toHaveAttribute("aria-pressed", "true");
    await dialogo.getByRole("button", { name: /Limpar filtros/ }).click();
    await expect(page).toHaveURL(/\/explorar$/);

    await acionador.click();
    await dialogo.getByRole("button", { name: /^Mais capítulos/ }).click();
    await expect(page).toHaveURL(/ordenacao=mais-capitulos/);
    await expect(dialogo.getByRole("button", { name: /^Mais capítulos/ })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Mais capítulos", exact: true })).toBeVisible();
    const consultasCapitulos = () => consultas.filter((consulta) => consulta.p_ordenacao === "mais-capitulos");
    await expect.poll(() => consultasCapitulos().length).toBe(1);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect.poll(() => consultasCapitulos().length).toBe(2);
    expect(consultasCapitulos()[1].p_cursor_id).toBe(ids[1]);
    expect(consultasCapitulos()[1].p_cursor_valor).toBe(3);
    await expect(card3).toBeVisible();
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect.poll(() => consultasCapitulos().length).toBe(3);
    expect(consultasCapitulos()[2].p_cursor_id).toBe(ids[2]);
    await expect(page.locator("main h3")).toHaveText([obras[1].titulo, obras[2].titulo, obras[0].titulo]);
    await expect(page.getByRole("button", { name: "Carregar mais", exact: true })).toBeHidden();

    await acionador.click();
    await formatos.getByRole("button", { name: "Webnovel", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/ordenacao=mais-capitulos&formato=Webnovel/);
    await expect(card3).toHaveCount(0);
    await expect.poll(() => consultasCapitulos().filter((consulta) => consulta.p_formato === "Webnovel").length).toBe(1);
    expect(consultasCapitulos().at(-1).p_cursor_id).toBeUndefined();
    await page.goBack();
    await expect(page).not.toHaveURL(/formato=/);
    await expect(card2).toBeVisible();
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card3).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/ordenacao=mais-capitulos&formato=Webnovel/);
    await page.reload();
    await expect(page.locator("main h3").first()).toHaveText(obras[1].titulo);
    await acionador.click();
    await expect(dialogo.getByRole("button", { name: /^Mais capítulos/ })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Autores", exact: true }).click();
    await expect(page).toHaveURL(/tipo=autores/);
    await expect(page).not.toHaveURL(/ordenacao=mais-capitulos/);
    await acionador.click();
    await expect(dialogo.getByRole("button", { name: /^Mais capítulos/ })).toHaveCount(0);
    await dialogo.getByRole("button", { name: /Limpar filtros/ }).click();
    const foraDaAmostra = page.getByRole("link", { name: obras[3].titulo, exact: true });
    await expect(foraDaAmostra).toHaveCount(0);
    await acionador.click();
    const tag = dialogo.getByRole("textbox", { name: "Tag da obra", exact: true });
    await tag.fill(" AÇÃO ");
    await expect(page).toHaveURL(/tag=acao/);
    await page.keyboard.press("Escape");
    await expect(card1).toBeVisible();
    const consultasTag = () => consultas.filter((consulta) => consulta.p_tag === "acao");
    await expect.poll(() => consultasTag().length).toBe(1);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(foraDaAmostra).toBeVisible();
    expect(consultasTag()).toHaveLength(2);
    expect(consultasTag()[1].p_cursor_id).toBe(ids[0]);
    await acionador.click();
    await formatos.getByRole("button", { name: "HQ", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/formato=HQ&tag=acao/);
    await expect(card1).toHaveCount(0);
    await expect(foraDaAmostra).toBeVisible();
    await page.goBack();
    await expect(page).not.toHaveURL(/formato=/);
    await expect(card1).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/formato=HQ&tag=acao/);
    await page.reload();
    await expect(foraDaAmostra).toBeVisible();
    await acionador.click();
    await expect(tag).toHaveValue("acao");
    const axeTag = await new AxeBuilder({ page }).include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axeTag.violations.filter((violacao) => ["critical", "serious"].includes(violacao.impact))).toEqual([]);
  });
}
