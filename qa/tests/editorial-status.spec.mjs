import {randomUUID} from "node:crypto";
import {test, expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {createClient} from "@supabase/supabase-js";
import {authorEmail, authorPassword, destructiveEnabled, hasAuthorCredentials, loginAsAuthor} from "./helpers.mjs";

let client, userId, editWork;
const ids = [], works = [], storagePaths = [];
const key = () => (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const check = r => {expect(r.error).toBeNull(); return r.data;};
const isCatalog = r => new URL(r.url()).pathname === "/rest/v1/rpc/listar_obras_catalogo";
const editorialRequest = (r, value) => isCatalog(r) && r.request().postDataJSON()?.p_status_editorial === value;
const select = page => page.getByRole("combobox", {name: "Estado da história", exact: true});
const save = page => page.getByRole("button", {name: "Salvar alterações", exact: true});

test.beforeAll(async () => {
  expect(hasAuthorCredentials && destructiveEnabled).toBe(true);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  client = createClient(url,key(),{auth:{persistSession:false,autoRefreshToken:false}});
  userId = check(await client.auth.signInWithPassword({email:authorEmail,password:authorPassword})).user.id;
  for(let i=0;i<80;i++) {
    const id=randomUUID(); ids.push(id);
    works.push({id,user_id:userId,titulo:`QA Editorial ${String(i).padStart(3,"0")}`,autor:"Autor E2E",genero:"Fantasia",formato:"HQ",
      classificacao_indicativa:"Livre",avisos_conteudo:[],publicado:true,slug:`qa-editorial-${id}`,tags:["qaeditorial"],
      sinopse:"Sinopse original da obra para testes locais.",capa_url:"",status_editorial:i<52?"em_andamento":"pausada",
      criada_em:new Date(Date.now()-(i<52?0:86400000)-i*1000).toISOString()});
  }
  check(await client.from("obras").insert(works));
  check(await client.from("capitulos").insert(works.map(w=>({id:randomUUID(),obra_id:w.id,user_id:userId,ordem:1,titulo:"Abertura",texto:"Texto preservado do capítulo público.",publicado:true}))));
  editWork=works[79];
});
test.afterAll(async () => {
  if(!client)return;
  if(ids.length)check(await client.from("obras").delete().in("id",ids));
  if(storagePaths.length)check(await client.storage.from("capas-obras").remove(storagePaths));
});

async function editor(page) {
  await page.goto(`/editar-obra?obraId=${editWork.id}`);
  await expect(select(page)).toBeEnabled();
  await expect(page.getByLabel("Título da obra",{exact:true})).toHaveValue(editWork.titulo);
}
async function reset() {check(await client.from("obras").update({status_editorial:null,sinopse:editWork.sinopse,capa_url:""}).eq("id",editWork.id));}
async function noSerious(page, selector) {
  const axe = await new AxeBuilder({page}).include(selector).analyze();
  expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
async function filters(page) {
  await page.getByRole("button",{name:"Abrir funções do Explorar",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"EXPLORAR",exact:true});
  await expect(dialog.locator('[data-dialog-initial-focus="true"]')).toBeFocused();
  return dialog;
}
async function language(page,value) {
  await page.evaluate(value=>{localStorage.setItem("historietas-idioma",value);window.dispatchEvent(new StorageEvent("storage",{key:"historietas-idioma",newValue:value}));},value);
}

for(const [device,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:390,height:844}]]) {
  test(`18+ com capa pública permanece fechado sem destruir arquivos — ${device}`,async({page})=>{
    await reset();
    const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
    const path=`${userId}/${randomUUID()}-capa-existente.png`;storagePaths.push(path);
    check(await client.storage.from("capas-obras").upload(path,png,{contentType:"image/png",upsert:false}));
    const url=client.storage.from("capas-obras").getPublicUrl(path).data.publicUrl;
    check(await client.from("obras").update({capa_url:url}).eq("id",editWork.id));
    await page.setViewportSize(viewport);await loginAsAuthor(page);await editor(page);
    const writes=[];page.on("request",r=>{if(/[\/]rest\/v1\/obras|[\/]storage\/v1\//.test(r.url())&&["PATCH","POST","DELETE"].includes(r.method()))writes.push(r);});
    await select(page).selectOption("pausada");
    await page.getByRole("combobox",{name:"Classificação indicativa",exact:true}).selectOption("18+");
    await page.getByRole("checkbox",{name:"Terror ou conteúdo perturbador",exact:true}).check();
    await save(page).click();
    await expect(page.getByText("Esta alteração 18+ exige uma remoção segura da capa pública. Esta tentativa não removeu arquivos nem atualizou a obra.",{exact:true})).toBeVisible();
    expect(writes).toHaveLength(0);
    expect(check(await client.from("obras").select("status_editorial,classificacao_indicativa,capa_url").eq("id",editWork.id).single())).toEqual({status_editorial:null,classificacao_indicativa:"Livre",capa_url:url});
    const image=await fetch(url);expect(image.ok).toBe(true);expect(Buffer.from(await image.arrayBuffer())).toEqual(png);
    await expect(select(page)).toHaveValue("pausada");await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toHaveCount(0);
  });

  test(`falha remota, retry e resposta antiga não certificam o cache — ${device}`,async({page})=>{
    await reset();await page.setViewportSize(viewport);
    let fail=true, hold=false, oldRoute, started;
    const oldStarted=new Promise(resolve=>{started=resolve;});
    let requests=0;
    await page.route("**/rest/v1/rpc/listar_obras_catalogo",async route=>{
      const p=route.request().postDataJSON();
      if(p.p_status_editorial)requests++;
      if(p.p_status_editorial && fail)return route.fulfill({status:503,json:{message:"Falha local controlada"}});
      if(p.p_status_editorial==="concluida" && hold){oldRoute=route;started();return;}
      return route.continue();
    });
    await page.goto("/explorar?statusEditorial=pausada&tag=qaeditorial");
    const warning=page.getByRole("alert").filter({hasText:/catálogo/i});
    await expect(warning).toBeVisible();
    const cards=page.getByRole("link",{name:/^QA Editorial \d{3}$/});await expect(cards).toHaveCount(0);
    expect(requests).toBe(1);fail=false;
    const recovered=page.waitForResponse(r=>editorialRequest(r,"pausada"));
    await warning.getByRole("button",{name:"Tentar novamente",exact:true}).click();expect((await recovered).ok()).toBe(true);
    await expect(warning).toHaveCount(0);await expect(cards).toHaveCount(24);expect(requests).toBe(2);
    const dialog=await filters(page);hold=true;
    await select(dialog).selectOption("concluida");await oldStarted;
    const current=page.waitForResponse(r=>editorialRequest(r,"em_andamento"));
    await select(dialog).selectOption("em_andamento");expect((await current).ok()).toBe(true);
    await expect(select(dialog)).toHaveValue("em_andamento");
    const late=page.waitForResponse(r=>editorialRequest(r,"concluida"));
    await oldRoute.fulfill({json:[]});expect((await late).ok()).toBe(true);
    await page.keyboard.press("Escape");await expect(cards).toHaveCount(24);
    await expect(page.getByRole("group",{name:"Filtros selecionados",exact:true})).toContainText("Em andamento");
  });

  test(`criação opcional, edição, limpeza e projeção pública — ${device}`,async({page,baseURL})=>{
    expect(["127.0.0.1","localhost"]).toContain(new URL(baseURL).hostname);
    await page.setViewportSize(viewport); await loginAsAuthor(page);
    for(const status of ["","pausada"]) {
      await page.goto("/publicar");
      await expect(select(page)).toHaveValue("");
      const title=`QA Criada ${device} ${randomUUID()}`;
      await page.locator("#publicar-titulo").fill(title);
      await page.locator("#publicar-formato").selectOption("Conto");
      await page.locator("#publicar-genero").selectOption("Fantasia");
      await page.locator("#publicar-classificacao").selectOption("Livre");
      await page.getByRole("textbox",{name:"Sinopse",exact:true}).fill("Sinopse longa e válida para criação descartável de teste.");
      await select(page).selectOption(status);
      const input=page.locator('input[type="file"][accept^=".pdf"]');
      await input.setInputFiles({name:"primeiro.txt",mimeType:"text/plain",buffer:Buffer.from("Texto original integral do primeiro capítulo da obra de teste.")});
      await page.getByRole("button",{name:"Transformar em capítulo",exact:true}).click();
      const requests=[]; page.on("request",r=>{if(new URL(r.url()).pathname==="/rest/v1/obras"&&["POST","PATCH"].includes(r.method()))requests.push(r);});
      await page.getByRole("button",{name:"Criar obra",exact:true}).click();
      await expect(page).toHaveURL(/\/painel-autor$/);
      const row=check(await client.from("obras").select("id,status_editorial,status_editorial_versao").eq("titulo",title).single()); ids.push(row.id);
      expect(row.status_editorial).toBe(status||null); expect(row.status_editorial_versao).toBeTruthy();
      const insertion=requests.filter(r=>r.method()==="POST");expect(insertion).toHaveLength(1);
      expect(insertion[0].postDataJSON().status_editorial).toBe(status||null);
      expect(insertion[0].postDataJSON()).not.toHaveProperty("status_editorial_versao");
      expect(requests.filter(r=>r.method()==="PATCH").every(r=>!Object.hasOwn(r.postDataJSON(),"status_editorial"))).toBe(true);
    }
    await reset();await editor(page);
    await select(page).selectOption("concluida"); await save(page).click();
    await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toBeVisible();
    expect(check(await client.from("obras").select("status_editorial").eq("id",editWork.id).single()).status_editorial).toBe("concluida");
    await page.goto(`/obra/${editWork.slug}`);
    const publicRoot=page.locator('[data-historietas-obra-dinamica-root="true"][data-public-work-state="confirmada"]:visible');
    await expect(publicRoot).toHaveCount(1);
    await expect(publicRoot).toHaveAttribute("aria-busy","false");
    await expect(page.locator('[data-historietas-obra-dinamica-root="true"]:visible')).toHaveCount(1);
    await expect(publicRoot.getByText("Estado da história: Concluída",{exact:true})).toBeVisible();
    await editor(page);await select(page).selectOption("");await save(page).click();
    await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toBeVisible();
    expect(check(await client.from("obras").select("status_editorial").eq("id",editWork.id).single()).status_editorial).toBeNull();
    await page.goto(`/obra/${editWork.slug}`);
    await expect(publicRoot).toHaveCount(1);await expect(publicRoot).toHaveAttribute("aria-busy","false");
    await expect(publicRoot.getByText("Estado da história: Não informado",{exact:true})).toBeVisible();
    await editor(page);
    for(const [lang,label,empty] of [["en","Story status","Not specified"],["es","Estado de la historia","No informado"],["pt-BR","Estado da história","Não informado"]]) {
      await language(page,lang);await expect(page.getByRole("combobox",{name:label,exact:true})).toContainText(empty);
    }
    await noSerious(page,'section[data-historietas-i18n-ignore="true"]');
  });

  test(`duas sessões reais, conflito visível e reconciliação explícita — ${device}`,async({page,browser,baseURL})=>{
    await reset();await page.setViewportSize(viewport);await loginAsAuthor(page);await editor(page);
    const secondContext=await browser.newContext({viewport,baseURL});
    try {
      const second=await secondContext.newPage();await loginAsAuthor(second);await editor(second);
      await select(page).selectOption("concluida");await save(page).click();
      await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toBeVisible();
      const patches=[];second.on("request",r=>{if(r.method()==="PATCH"&&new URL(r.url()).pathname==="/rest/v1/obras")patches.push(r);});
      await select(second).selectOption("pausada");
      await second.getByRole("textbox",{name:"Sinopse",exact:true}).fill("Intenção local preservada após conflito entre sessões.");
      await save(second).click();
      await expect(second.getByText(/Nenhuma atualização foi confirmada/)).toBeVisible();
      await expect(second.getByRole("button",{name:"Atualizada",exact:true})).toHaveCount(0);
      expect(patches).toHaveLength(1);
      expect(check(await client.from("obras").select("sinopse,status_editorial").eq("id",editWork.id).single())).toEqual({sinopse:editWork.sinopse,status_editorial:"concluida"});
      await second.getByRole("button",{name:"Consultar estado atual",exact:true}).click();
      await expect(second.getByText(/Estado atual no banco: Concluída/)).toBeVisible();
      await expect(select(second)).toHaveValue("pausada");
      await expect(second.getByRole("textbox",{name:"Sinopse",exact:true})).toHaveValue("Intenção local preservada após conflito entre sessões.");
      expect(patches).toHaveLength(1);
      await second.getByRole("button",{name:"Manter minha escolha para o próximo salvamento",exact:true}).click();
      expect(patches).toHaveLength(1);await expect(save(second)).toBeEnabled();
      await save(second).click();await expect(second.getByRole("button",{name:"Atualizada",exact:true})).toBeVisible();
      expect(patches).toHaveLength(2);expect(check(await client.from("obras").select("status_editorial").eq("id",editWork.id).single()).status_editorial).toBe("pausada");
    } finally {await secondContext.close();}
  });

  test(`resposta perdida após PATCH real não confirma nem remove arquivo — ${device}`,async({page})=>{
    await reset();await page.setViewportSize(viewport);await loginAsAuthor(page);await editor(page);
    const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
    await page.locator('input[type="file"][accept^=".png"]').setInputFiles({name:"nova-capa.png",mimeType:"image/png",buffer:png});
    await expect(page.getByRole("button",{name:"Trocar",exact:true})).toBeVisible();
    const deletes=[];page.on("request",r=>{if(r.method()==="DELETE"&&new URL(r.url()).pathname.startsWith("/storage/v1/"))deletes.push(r);});
    await select(page).selectOption("pausada");let patches=0;
    await page.route("**/rest/v1/obras?*",async route=>{
      if(route.request().method()!=="PATCH")return route.continue();
      patches++;const response=await route.fetch();expect(response.ok()).toBe(true);
      await route.abort("failed"); // A escrita real já terminou; somente a resposta é perdida.
    });
    await save(page).click();
    await expect(page.getByText(/A resposta não confirmou o resultado/)).toBeVisible();
    expect(patches).toBe(1);await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toHaveCount(0);
    const stored=check(await client.from("obras").select("status_editorial,capa_url").eq("id",editWork.id).single());
    expect(stored.status_editorial).toBe("pausada");expect(stored.capa_url).toContain("/capas-obras/");
    storagePaths.push(decodeURIComponent(new URL(stored.capa_url).pathname.split("/capas-obras/")[1]));
    const image=await fetch(stored.capa_url);expect(image.ok).toBe(true);expect(Buffer.from(await image.arrayBuffer())).toEqual(png);
    expect(deletes).toHaveLength(0);
    await page.getByRole("button",{name:"Consultar estado atual",exact:true}).click();
    await expect(page.getByText(/Estado atual no banco: Pausada/)).toBeVisible();
    await expect(page.getByRole("button",{name:"Atualizada",exact:true})).toHaveCount(0);expect(patches).toBe(1);
  });

  test(`RPC real, página seguinte, URL, histórico e remoção por teclado — ${device}`,async({page})=>{
    await reset();
    await page.setViewportSize(viewport);
    const calls=[];page.on("request",r=>{if(new URL(r.url()).pathname==="/rest/v1/rpc/listar_obras_catalogo")calls.push(r.postDataJSON());});
    const url="/explorar?statusEditorial=pausada&tag=qaeditorial&formato=HQ&categoria=Fantasia&ordenacao=mais-recentes";
    const ready=page.waitForResponse(r=>editorialRequest(r,"pausada"));await page.goto(url);expect((await ready).ok()).toBe(true);
    const cards=page.getByRole("link",{name:/^QA Editorial \d{3}$/});await expect(cards).toHaveCount(24);
    const next=page.waitForResponse(r=>editorialRequest(r,"pausada")&&Boolean(r.request().postDataJSON().p_cursor_id));
    await page.getByRole("button",{name:"Carregar mais",exact:true}).click();expect((await next).ok()).toBe(true);await expect(cards).toHaveCount(27);
    let dialog=await filters(page);await expect(select(dialog)).toHaveValue("pausada");
    await select(dialog).selectOption("concluida");await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/statusEditorial=concluida/);
    const back=page.waitForResponse(r=>editorialRequest(r,"pausada"));await page.goBack();expect((await back).ok()).toBe(true);await expect(cards).toHaveCount(24);
    const forward=page.waitForResponse(r=>editorialRequest(r,"concluida"));await page.goForward();expect((await forward).ok()).toBe(true);await expect(cards).toHaveCount(0);
    await page.goto(url);await expect(cards).toHaveCount(24);await page.reload();await expect(cards).toHaveCount(24);
    const group=page.getByRole("group",{name:"Filtros selecionados",exact:true});
    const chip=group.getByRole("button",{name:"Remover filtro: Estado da história: Pausada",exact:true});
    const before=calls.length;
    for(const lang of ["en","es","pt-BR"])await language(page,lang);
    await expect(chip).toBeVisible();expect(calls).toHaveLength(before);
    await chip.focus();const removed=page.waitForResponse(r=>isCatalog(r)&&!r.request().postDataJSON().p_status_editorial&&r.request().postDataJSON().p_tag==="qaeditorial");
    await page.keyboard.press("Enter");expect((await removed).ok()).toBe(true);
    await expect(chip).toHaveCount(0);expect(calls.length-before).toBe(1);
    expect(new URL(page.url()).searchParams.get("tag")).toBe("qaeditorial");expect(new URL(page.url()).searchParams.has("statusEditorial")).toBe(false);
    await page.goto(url);await expect(cards).toHaveCount(24);
    await page.getByRole("button",{name:"Autores",exact:true}).click();
    await expect(page).not.toHaveURL(/statusEditorial=/);await expect(group.getByRole("button",{name:/Estado da história/})).toHaveCount(0);
    dialog=await filters(page);await expect(select(dialog)).toHaveCount(0);await page.keyboard.press("Escape");
    await noSerious(page,'[role="group"]');
  });
}
