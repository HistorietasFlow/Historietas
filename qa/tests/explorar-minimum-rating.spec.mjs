import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Fronteira HTTP controlada, sem escrita ou dependência de Supabase remoto.
const ids = [1, 2, 3, 4].map((n) => `81000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
const notas = [4.5, null, 4.25, 5];
const obras = ids.map((id, i) => ({
  id, user_id: "82000000-0000-4000-8000-000000000001", titulo: `Obra nota ${i + 1}`,
  autor: "Autora QA", genero: "Fantasia", formato: i === 3 ? "HQ" : "Webnovel",
  classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: true,
  slug: `qa-nota-${i + 1}`, tags: i === 0 || i === 3 ? ["ação"] : [],
  criada_em: "2026-01-01T00:00:00Z", atualizado_em: "2026-01-01T00:00:00Z",
  sinopse: "Obra pública de teste", capa_url: "",
}));

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }],
]) {
  test(`avaliação mínima preserva cursor, combinações e histórico (${dispositivo})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const consultas = [];
    await page.route("**/auth/v1/**", (route) => route.fulfill({ status: 401, json: { message: "Sem sessão" } }));
    await page.route("**/rest/v1/**", (route) => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname.split("/").at(-1);
      if (endpoint === "listar_obras_catalogo") {
        const params = route.request().postDataJSON();
        consultas.push(params);
        // A quarta obra nunca está na amostra inicial, somente na consulta paginada.
        const elegiveis = params.p_nota_minima !== undefined
          ? obras.filter((obra, i) => notas[i] !== null && notas[i] >= params.p_nota_minima
            && (!params.p_tag || (params.p_tag === "acao" && obra.tags.includes("ação")))
            && (!params.p_formato || obra.formato === params.p_formato))
            .sort((a, b) => b.id.localeCompare(a.id))
          : obras.slice(0, 3);
        const inicio = params.p_cursor_id ? elegiveis.findIndex((obra) => obra.id === params.p_cursor_id) + 1 : 0;
        const pagina = params.p_nota_minima !== undefined ? elegiveis.slice(inicio, inicio + 1) : elegiveis;
        return route.fulfill({ json: pagina.map((obra) => ({
          obra_id: obra.id, cursor_id: obra.id,
          cursor_valor: params.p_ordenacao === "mais-capitulos" ? 1 : 0,
          cursor_data: obra.criada_em, tem_mais: params.p_nota_minima !== undefined && inicio + 1 < elegiveis.length,
        })) });
      }
      if (endpoint === "obras") return route.fulfill({ json: obras.filter((obra) => (url.searchParams.get("id") || "").includes(obra.id)) });
      if (endpoint === "capitulos") return route.fulfill({ json: obras.map((obra, i) => ({
        id: `83000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, obra_id: obra.id,
        user_id: obra.user_id, titulo: "Abertura", ordem: 1, publicado: true, criado_em: obra.criada_em,
      })) });
      return route.fulfill({ json: [] });
    });

    await page.goto("/explorar?notaMinima=4.5");
    const card1 = page.getByRole("link", { name: obras[0].titulo, exact: true });
    const foraDaAmostra = page.getByRole("link", { name: obras[3].titulo, exact: true });
    await expect(foraDaAmostra).toBeVisible();
    await expect(page.getByRole("link", { name: obras[1].titulo, exact: true })).toHaveCount(0); // Sem nota.
    await expect(page.getByRole("link", { name: obras[2].titulo, exact: true })).toHaveCount(0); // Média 4,25.
    const consultasNota = () => consultas.filter((consulta) => consulta.p_nota_minima === 4.5);
    expect(consultasNota()).toHaveLength(1);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card1).toBeVisible();
    expect(consultasNota()).toHaveLength(2);
    expect(consultasNota()[1].p_cursor_id).toBe(ids[3]);
    const acionador = page.getByRole("button", { name: "Abrir funções do Explorar", exact: true });
    await acionador.click();
    const dialogo = page.getByRole("dialog", { name: "EXPLORAR", exact: true });
    const notaMinima = dialogo.getByRole("combobox", { name: "Avaliação mínima", exact: true });
    await expect(notaMinima).toHaveValue("4.5");
    await notaMinima.selectOption("5");
    await page.keyboard.press("Escape");
    await expect(card1).toHaveCount(0);
    await expect(foraDaAmostra).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/notaMinima=4.5/);
    await page.getByRole("button", { name: "Carregar mais", exact: true }).click();
    await expect(card1).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/notaMinima=5/);
    await expect(card1).toHaveCount(0);
    await expect(foraDaAmostra).toBeVisible();
    await page.goBack();
    await acionador.click();
    await dialogo.getByRole("group", { name: "Formato da obra" }).getByRole("button", { name: "Webnovel", exact: true }).click();
    await dialogo.getByRole("textbox", { name: "Tag da obra", exact: true }).fill("acao");
    await dialogo.getByRole("button", { name: /^Mais capítulos/ }).click();
    await page.keyboard.press("Escape");
    await expect(card1).toBeVisible();
    await expect(foraDaAmostra).toHaveCount(0);
    await expect(page).toHaveURL(/ordenacao=mais-capitulos&formato=Webnovel&tag=acao&notaMinima=4.5/);
    await page.reload();
    await expect(card1).toBeVisible();
    await acionador.click();
    await expect(notaMinima).toHaveValue("4.5");
    const axe = await new AxeBuilder({ page }).include('section[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = axe.violations.filter((v) => ["critical", "serious"].includes(v.impact));
    expect(graves, graves.map((v) => `${v.id}: ${v.nodes.length} ocorrência(s)`).join("\n")).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Autores", exact: true }).click();
    await expect(page).not.toHaveURL(/notaMinima=/);
  });
}
