import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Fixtures HTTP determinísticas isolam UI/URL/rede; os dois últimos casos usam RPC local real.
const obra = {
  id: "91000000-0000-4000-8000-000000000001", user_id: "92000000-0000-4000-8000-000000000001",
  titulo: "História dos indicadores", autor: "Autora QA", genero: "Fantasia", formato: "HQ",
  classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: true, slug: "qa-indicadores",
  tags: ["aventura"], criada_em: "2026-01-01T00:00:00Z", atualizado_em: "2026-01-01T00:00:00Z",
  sinopse: "História pública de teste", capa_url: "",
};
const filtros = { busca: "História", categoria: "Fantasia", ordenacao: "mais-recentes", formato: "HQ",
  tag: "aventura", tagExcluida: "terror", generoExcluido: "romance", notaMinima: "4.5" };
const urlCompleta = `/explorar?${new URLSearchParams(filtros)}`;
const grupo = page => page.getByRole("group", { name: "Filtros selecionados", exact: true });
const remover = (page, texto) => grupo(page).getByRole("button", { name: `Remover filtro: ${texto}`, exact: true });
const isCatalogo = response => new URL(response.url()).pathname === "/rest/v1/rpc/listar_obras_catalogo";

async function abrirPainel(page) {
  await page.getByRole("button", { name: "Abrir funções do Explorar", exact: true }).click();
  const dialogo = page.getByRole("dialog", { name: "EXPLORAR", exact: true });
  await expect(dialogo.locator('[data-dialog-initial-focus="true"]')).toBeFocused();
  return dialogo;
}

async function preparar(page, viewport, obras = [obra]) {
  await page.setViewportSize(viewport);
  const consultas = [];
  let falhar = false;
  await page.route("**/auth/v1/**", route => route.fulfill({ status: 401, json: { message: "Visitante da fixture" } }));
  await page.route("**/rest/v1/**", route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split("/").at(-1);
    if (endpoint === "listar_obras_catalogo") {
      const p = route.request().postDataJSON(); consultas.push(p);
      if (falhar) return route.fulfill({ status: 503, json: { message: "Falha local controlada" } });
      const selecionadas = obras.filter(registro => !p.p_genero || registro.genero === p.p_genero);
      return route.fulfill({ json: selecionadas.map(registro => ({
        obra_id: registro.id, cursor_id: registro.id, cursor_valor: 0, cursor_data: registro.criada_em, tem_mais: false,
      })) });
    }
    if (endpoint === "obras") return route.fulfill({ json: obras });
    if (endpoint === "capitulos") return route.fulfill({ json: obras.map(registro => ({
      id: registro.id.replace(/^91/, "93"), obra_id: registro.id, user_id: registro.user_id,
      ordem: 1, titulo: "Abertura", publicado: true, criado_em: registro.criada_em,
    })) });
    return route.fulfill({ json: [] });
  });
  return { consultas, falhar: valor => { falhar = valor; } };
}

async function abrirCombinacao(page) {
  const resposta = page.waitForResponse(r => isCatalogo(r) && r.request().postDataJSON()?.p_genero_excluido === "romance"
    && r.request().postDataJSON()?.p_busca === "História" && r.request().postDataJSON()?.p_formato === "HQ");
  await page.goto(urlCompleta);
  expect((await resposta).ok()).toBe(true);
  await expect(grupo(page).getByRole("button")).toHaveCount(6);
  await expect(page.getByRole("link", { name: obra.titulo, exact: true })).toBeVisible();
}

function conferirUrl(page, removido) {
  const params = new URL(page.url()).searchParams;
  for (const [nome, valor] of Object.entries(filtros)) {
    expect(params.get(nome), nome).toBe(nome === removido ? null : valor);
  }
}

const casos = [
  ["formato", "Formato: HQ", "p_formato", async dialogo => dialogo.getByRole("group", { name: "Formato da obra" }).getByRole("button", { name: "Todos os formatos", exact: true }).click()],
  ["tag", "Tag: aventura", "p_tag", async dialogo => dialogo.getByRole("textbox", { name: "Tag da obra", exact: true }).fill("")],
  ["tagExcluida", "Excluir tag: terror", "p_tag_excluida", async dialogo => dialogo.getByRole("textbox", { name: "Excluir tag", exact: true }).fill("")],
  ["generoExcluido", "Excluir gênero: Romance", "p_genero_excluido", async dialogo => dialogo.getByRole("combobox", { name: "Excluir gênero", exact: true }).selectOption("")],
  ["notaMinima", "Avaliação mínima: 4.5", "p_nota_minima", async dialogo => dialogo.getByRole("combobox", { name: "Avaliação mínima", exact: true }).selectOption("")],
];

for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  test(`remover gênero preserva os demais filtros e encaminha o foco — ${device}`, async ({ page }) => {
    const fantasia = { ...obra, status_editorial: "concluida" };
    const romance = { ...fantasia, id: "91000000-0000-4000-8000-000000000002", genero: "Romance",
      titulo: "Romance dos indicadores", slug: "qa-indicadores-romance" };
    const { consultas } = await preparar(page, viewport, [fantasia, romance]);
    const avancados = { statusEditorial: "concluida", palavrasMinimas: "20000", palavrasMaximas: "80000",
      notaMinima: "4", tagExcluida: "terror" };
    const parametros = { p_status_editorial: "concluida", p_palavras_minimas: 20000,
      p_palavras_maximas: 80000, p_nota_minima: 4, p_tag_excluida: "terror" };
    const romanceCard = page.getByRole("link", { name: romance.titulo, exact: true });
    const genero = remover(page, "Gênero: Fantasia");
    const respostaComGenero = valor => page.waitForResponse(response => isCatalogo(response)
      && response.request().postDataJSON()?.p_palavras_minimas === 20000
      && response.request().postDataJSON()?.p_genero === valor);

    const inicial = respostaComGenero("");
    await page.goto(`/explorar?${new URLSearchParams(avancados)}`);
    expect((await inicial).ok()).toBe(true);
    await expect(romanceCard).toBeVisible();
    const comGenero = respostaComGenero("Fantasia");
    await page.getByRole("region", { name: "Categorias", exact: true })
      .getByRole("button", { name: "Fantasia", exact: true }).click();
    expect((await comGenero).ok()).toBe(true);
    await expect(genero).toHaveText("Gênero: Fantasia×");
    await expect(page.getByRole("link", { name: fantasia.titulo, exact: true })).toBeVisible();
    await expect(romanceCard).toHaveCount(0);
    expect(consultas.at(-1)).toMatchObject({ ...parametros, p_genero: "Fantasia" });

    const semGenero = respostaComGenero("");
    if (device === "desktop") await genero.press("Enter");
    else await genero.click();
    expect((await semGenero).ok()).toBe(true);
    await expect(genero).toHaveCount(0);
    await expect(remover(page, "Excluir tag: terror")).toBeFocused();
    await expect(remover(page, "Avaliação mínima: 4")).toBeVisible();
    await expect(remover(page, "Estado da história: Concluída")).toBeVisible();
    await expect(remover(page, "Palavras: 20.000–80.000")).toBeVisible();
    await expect(romanceCard).toBeVisible();
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(avancados);
    expect(consultas.at(-1)).toMatchObject({ ...parametros, p_genero: "" });

    await page.goto("/explorar?categoria=Fantasia");
    await expect(grupo(page).getByRole("button")).toHaveCount(1);
    await genero.press("Space");
    await expect(grupo(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/explorar$/);
    await expect(page.getByRole("button", { name: "Abrir funções do Explorar", exact: true })).toBeFocused();
  });

  test(`indicadores preservam histórico, foco, modos, traduções e falhas — ${device}`, async ({ page }) => {
    const fixture = await preparar(page, viewport);
    await abrirCombinacao(page);
    await remover(page, "Formato: HQ").focus();
    await expect(remover(page, "Formato: HQ")).toHaveCSS("outline-style", "solid");
    await expect(remover(page, "Formato: HQ")).toHaveCSS("outline-width", "2px");
    await page.keyboard.press("Enter");
    await expect(remover(page, "Tag: aventura")).toBeFocused();
    conferirUrl(page, "formato");
    await page.goBack();
    await expect(remover(page, "Formato: HQ")).toBeVisible();
    await page.goForward();
    await expect(remover(page, "Formato: HQ")).toHaveCount(0);
    await page.reload();
    await expect(grupo(page).getByRole("button")).toHaveCount(5);
    await remover(page, "Tag: aventura").click(); // tags usam replace, não um novo passo de histórico.
    await expect(remover(page, "Tag: aventura")).toHaveCount(0);
    await page.goBack();
    await expect(grupo(page).getByRole("button")).toHaveCount(6);
    await page.goForward();
    await expect(grupo(page).getByRole("button")).toHaveCount(4);

    await abrirCombinacao(page);
    await page.getByRole("button", { name: "Autores", exact: true }).click();
    await expect(grupo(page).getByRole("button")).toHaveCount(2);
    await expect(page).not.toHaveURL(/tagExcluida|generoExcluido|notaMinima/);
    await remover(page, "Tag: aventura").click();
    await remover(page, "Formato: HQ").focus();
    await page.keyboard.press("Enter");
    await expect(grupo(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir funções do Explorar", exact: true })).toBeFocused();

    const tag = '<ScRiPt>literal</ScRiPt> **aventura** ' + 'x'.repeat(80);
    fixture.falhar(true);
    await page.goto(`/explorar?tag=${encodeURIComponent(tag)}`);
    const aviso = page.getByRole("alert").filter({ hasText: /catálogo/i });
    await expect(aviso).toBeVisible();
    await expect(grupo(page).getByRole("button")).toHaveCount(1);
    const antes = fixture.consultas.length;
    for (const [idioma, nome] of [["en", "Selected filters"], ["es", "Filtros seleccionados"], ["pt-BR", "Filtros selecionados"]]) {
      await page.evaluate(idioma => { localStorage.setItem("historietas-idioma", idioma);
        window.dispatchEvent(new StorageEvent("storage", { key: "historietas-idioma", newValue: idioma })); }, idioma);
      await expect(page.getByRole("group", { name: nome, exact: true })).toBeVisible();
    }
    expect(fixture.consultas).toHaveLength(antes); // Apresentação/re-render não consulta.
    await expect(grupo(page)).toContainText('<script>literal</script> **aventura**');
    expect(await grupo(page).locator("script,strong").count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('[role="group"]').analyze();
    expect(axe.violations.filter(v => ["serious", "critical"].includes(v.impact))).toEqual([]);
  });

  for (const [parametro, texto, rpcParam, peloPainel] of casos) {
    test(`remoção de ${parametro} equivale ao painel sem consulta duplicada — ${device}`, async ({ page }) => {
      const { consultas } = await preparar(page, viewport);
      const resultados = [];
      for (const via of ["indicador", "painel"]) {
        await abrirCombinacao(page);
        const antes = consultas.length;
        const resposta = page.waitForResponse(r => isCatalogo(r) && r.request().postDataJSON()?.p_busca === "História" && !r.request().postDataJSON()?.[rpcParam]);
        if (via === "indicador") {
          await remover(page, texto).focus(); await page.keyboard.press("Enter");
        } else {
          const dialogo = await abrirPainel(page);
          await peloPainel(dialogo);
          await page.keyboard.press("Escape");
          await expect(dialogo).toHaveCount(0);
        }
        expect((await resposta).ok()).toBe(true);
        await expect(page.getByRole("link", { name: obra.titulo, exact: true })).toBeVisible();
        await expect(grupo(page).getByRole("button")).toHaveCount(5);
        conferirUrl(page, parametro);
        const novas = consultas.slice(antes);
        expect(novas).toHaveLength(1);
        resultados.push(novas[0]);
      }
      expect(resultados[0]).toEqual(resultados[1]);
    });
  }

  test(`indicador mantém contrato da RPC real local — ${device}`, async ({ page, baseURL }) => {
    expect(new URL(baseURL).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
    expect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
    await page.setViewportSize(viewport);
    const consultas = [];
    page.on("request", request => {
      if (new URL(request.url()).pathname === "/rest/v1/rpc/listar_obras_catalogo") consultas.push(request.postDataJSON());
    });
    const url = "/explorar?formato=Romance&tag=aventura&tagExcluida=terror&generoExcluido=romance&notaMinima=4.5";
    const abrir = page.waitForResponse(r => isCatalogo(r) && r.request().postDataJSON()?.p_nota_minima === 4.5 && r.request().postDataJSON()?.p_genero_excluido === "romance");
    await page.goto(url); expect((await abrir).ok()).toBe(true);
    await expect(grupo(page).getByRole("button")).toHaveCount(5);
    const antes = consultas.length;
    const alterada = page.waitForResponse(r => isCatalogo(r) && r.request().postDataJSON()?.p_nota_minima === null && r.request().postDataJSON()?.p_genero_excluido === "romance");
    await remover(page, "Avaliação mínima: 4.5").focus(); await page.keyboard.press("Enter");
    expect((await alterada).ok()).toBe(true);
    await expect(grupo(page).getByRole("button")).toHaveCount(4);
    await expect(page).not.toHaveURL(/notaMinima=/);
    expect(consultas.slice(antes)).toHaveLength(1);
    expect(consultas.at(-1)).toMatchObject({ p_formato: "Romance", p_tag: "aventura", p_tag_excluida: "terror", p_genero_excluido: "romance", p_nota_minima: null });
  });
}
