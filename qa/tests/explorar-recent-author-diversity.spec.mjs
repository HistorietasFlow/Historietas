import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Respostas HTTP controladas exercitam a seleção cliente sem criar contas/obras.
// RLS e paginação continuam cobertas pelas integrações locais existentes.
const obras = Array.from({ length: 19 }, (_, i) => ({
  id: `91000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  user_id: i < 12 ? "92000000-0000-4000-8000-000000000001"
    : i < 17 ? `92000000-0000-4000-8000-${String(i).padStart(12, "0")}` : null,
  titulo: `Publicação diversidade ${String(i + 1).padStart(2, "0")}`,
  autor: "Mesmo nome público", genero: "Fantasia", formato: "Webnovel",
  classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: true,
  slug: `publicacao-diversidade-${i + 1}`, tags: [],
  criada_em: new Date(Date.UTC(2026, 0, 20 - i)).toISOString(),
  sinopse: "História pública para testar a diversidade de autores.", capa_url: "",
}));

for (const [dispositivo, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  test(`publicações recentes diversificam autores sem consultas adicionais (${dispositivo})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const consultas = [];
    const erros = [];
    page.on("pageerror", error => erros.push(error.message));
    await page.route("**/auth/v1/**", route => route.fulfill({ status: 401, json: { message: "Sem sessão" } }));
    await page.route("**/rest/v1/**", route => {
      const url = new URL(route.request().url());
      const endpoint = url.pathname.split("/").at(-1);
      if (endpoint === "listar_obras_catalogo") {
        const params = route.request().postDataJSON();
        consultas.push(params);
        return route.fulfill({ json: obras.slice(0, params.p_limite).map(obra => ({
          obra_id: obra.id, cursor_id: obra.id, cursor_valor: 0,
          cursor_data: obra.criada_em, tem_mais: false,
        })) });
      }
      if (endpoint === "obras") {
        return route.fulfill({ json: obras.filter(obra => (url.searchParams.get("id") || "").includes(obra.id)) });
      }
      if (endpoint === "capitulos") {
        return route.fulfill({ json: obras.map((obra, i) => ({
          id: `93000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
          obra_id: obra.id, user_id: obra.user_id, titulo: "Abertura", ordem: 1,
          publicado: true, criado_em: obra.criada_em,
        })) });
      }
      return route.fulfill({ json: [] });
    });

    await page.goto("/explorar");
    const secao = page.getByRole("heading", { name: "Publicações recentes", exact: true })
      .locator("xpath=ancestor::section[1]");
    await expect(secao).toBeVisible();
    await expect(page.getByRole("status", { name: "Carregando Explorar", exact: true })).toHaveCount(0);
    const indices = [0, 12, 13, 14, 15, 16, 17, 18];
    const cards = secao.getByRole("link", { name: /^Publicação diversidade/ });
    await expect(cards).toHaveCount(indices.length);
    expect(await cards.evaluateAll(links => links.map(link => link.getAttribute("aria-label"))))
      .toEqual(indices.map(i => obras[i].titulo));
    for (const i of indices) {
      await expect(secao.getByRole("link", { name: obras[i].titulo, exact: true }))
        .toHaveAttribute("href", `/obra/${obras[i].slug}`);
    }
    for (let i = 1; i < 12; i++) {
      await expect(secao.getByRole("link", { name: obras[i].titulo, exact: true })).toHaveCount(0);
    }
    const recomendacoes = page.getByRole("heading", { name: "Recomendações para você", exact: true })
      .locator("xpath=ancestor::section[1]");
    await expect(recomendacoes.getByRole("link", { name: obras[1].titulo, exact: true })).toHaveCount(1);

    // O mesmo carrossel continua operável por teclado, inclusive os cards finais.
    await cards.last().focus();
    await expect(cards.last()).toBeFocused();
    const axe = await new AxeBuilder({ page }).include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const graves = axe.violations.filter(v => ["critical", "serious"].includes(v.impact));
    expect(graves, graves.map(v => `${v.id}: ${v.nodes.length} ocorrência(s)`).join("\n")).toEqual([]);
    expect(erros).toEqual([]);
    expect(consultas.map(p => [p.p_ordenacao, p.p_limite]).sort()).toEqual([
      ["recentes", 50], ["geral", 24], ["curtidas", 12],
      ["comentadas", 12], ["salvas", 12], ["capitulos", 12],
    ].sort());
    // A assinatura legada omite os cursores iniciais e usa os defaults da RPC.
    for (const consulta of consultas) {
      expect(consulta.p_cursor_id ?? null).toBeNull();
      expect(consulta.p_cursor_data ?? null).toBeNull();
      expect(consulta.p_cursor_valor ?? null).toBeNull();
    }
  });
}
