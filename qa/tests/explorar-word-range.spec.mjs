import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAsAuthor, loginAsVisitor } from "./helpers.mjs";

// HTTP-controlled cases prove UI/lifecycle. The final case uses the real local Data API.
const work = i => ({ id:`91000000-0000-4000-8000-${String(i).padStart(12,"0")}`,
  user_id:"92000000-0000-4000-8000-000000000001",titulo:`Palavras QA ${i}`,autor:"Autora QA",genero:"Fantasia",formato:"HQ",
  classificacao_indicativa:"Livre",avisos_conteudo:[],publicado:true,slug:`qa-palavras-${i}`,tags:["aventura"],
  criada_em:"2026-01-01T00:00:00Z",sinopse:"Sinopse pública",capa_url:"",status_editorial:"concluida" });
const works = Array.from({length:26},(_,i)=>work(i+1));
const opener = page => page.getByRole("button",{name:"Abrir funções do Explorar",exact:true});
const chip = page => page.getByRole("group",{name:"Filtros selecionados",exact:true}).getByRole("button",{name:/Remover filtro: Palavras:/});
const catalog = r => new URL(r.url()).pathname === "/rest/v1/rpc/listar_obras_catalogo";
const wordResponse = (page,min,max) => page.waitForResponse(r=>catalog(r)&&r.request().postDataJSON()?.p_palavras_minimas===min&&r.request().postDataJSON()?.p_palavras_maximas===max);
async function panel(page) {
  await opener(page).click();
  const d=page.getByRole("dialog",{name:"EXPLORAR",exact:true});
  await expect(d.locator('[data-dialog-initial-focus="true"]')).toBeFocused(); return d;
}
async function apply(page,d,min,max) {
  await d.getByRole("textbox",{name:"Mínimo de palavras",exact:true}).fill(min);
  await d.getByRole("textbox",{name:"Máximo de palavras",exact:true}).fill(max);
  const response=wordResponse(page,min===""?null:Number(min),max===""?null:Number(max));
  await d.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true}).click();
  expect((await response).status()).toBe(200);
}
async function fixture(page,viewport,realAuth=false) {
  await page.setViewportSize(viewport);
  const calls=[], writes=[]; let fail=false, delayed=null, release;
  if(!realAuth) await page.route("**/auth/v1/**",r=>r.fulfill({status:401,json:{message:"Visitante da fixture"}}));
  await page.route("**/rest/v1/**",async r=>{
    const req=r.request(),name=new URL(req.url()).pathname.split("/").at(-1);
    // Existing metrics/admin RPCs are read-only POSTs; HEAD counts notifications.
    if(!["listar_obras_catalogo","obter_metricas_conteudos","usuario_e_admin"].includes(name)&&
      ["POST","PUT","PATCH","DELETE"].includes(req.method())) writes.push({name,method:req.method()});
    if(name==="listar_obras_catalogo") {
      const p=req.postDataJSON(); calls.push(p);
      const atrasada=delayed!==null&&p.p_palavras_minimas===delayed;
      if(atrasada) {delayed=null;await new Promise(resolve=>{release=resolve;});}
      if(fail&&Object.hasOwn(p,"p_palavras_minimas"))return r.fulfill({status:503,json:{message:"Falha controlada"}});
      const active=Object.hasOwn(p,"p_palavras_minimas");
      const rows=atrasada?[works[25]]:active?(p.p_cursor_id?works.slice(24):works.slice(0,24)):works.slice(0,1);
      return r.fulfill({json:rows.map(w=>({obra_id:w.id,cursor_id:w.id,cursor_valor:0,cursor_data:w.criada_em,tem_mais:active&&!p.p_cursor_id}))});
    }
    if(name==="obras") return r.fulfill({json:works});
    if(name==="capitulos") return r.fulfill({json:works.map((w,i)=>({id:`93000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`,obra_id:w.id,user_id:w.user_id,ordem:1,titulo:"Abertura",publicado:true}))});
    return r.fulfill({json:[]});
  });
  return {calls,writes,fail:v=>{fail=v;},delay:v=>{delayed=v;},release:()=>{delayed=null;release?.();}};
}
const link=(page,i)=>page.getByRole("link",{name:`Palavras QA ${i}`,exact:true});

for(const [device,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:390,height:844}]]) {
  test(`palavras: aplicar, histórico, remoção, idiomas, teclado e axe — ${device}`,async({page})=>{
    const f=await fixture(page,viewport);
    const response=wordResponse(page,0,1000);
    await page.goto("/explorar?formato=HQ&tag=aventura&statusEditorial=concluida&palavrasMinimas=000&palavrasMaximas=01000");
    expect((await response).ok()).toBe(true); await expect(link(page,1)).toBeVisible();
    expect(f.calls).toHaveLength(1); // Shared range does not fetch the six broad selections first.
    await expect(chip(page)).toHaveText("Palavras: 0–1.000×");
    const before=f.calls.length; const d=await panel(page);
    await expect(d.getByRole("textbox",{name:"Mínimo de palavras",exact:true})).toHaveValue("0");
    await d.getByRole("textbox",{name:"Mínimo de palavras",exact:true}).fill("5");
    await expect(d.getByRole("textbox",{name:"Mínimo de palavras",exact:true})).toHaveValue("5");
    expect(f.calls.length).toBe(before); // Draft editing/rendering performs no RPC.
    await apply(page,d,"5","100");
    await expect(d.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true})).toBeFocused();
    expect(f.calls.slice(before)).toHaveLength(1);
    const args=f.calls.at(-1); expect(Object.keys(args)).toHaveLength(17);
    expect(args.p_status_editorial).toBe("concluida");expect(args.p_tag).toBe("aventura");expect(args.p_formato).toBe("HQ");
    const axe=await new AxeBuilder({page}).include('[role="dialog"]').analyze();
    expect(axe.violations.filter(v=>["serious","critical"].includes(v.impact))).toEqual([]);
    expect(await d.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await d.getByRole("textbox",{name:"Mínimo de palavras",exact:true}).focus(); await page.keyboard.press("Tab");
    await expect(d.getByRole("textbox",{name:"Máximo de palavras",exact:true})).toBeFocused();
    await page.keyboard.press("Shift+Tab");await expect(d.getByRole("textbox",{name:"Mínimo de palavras",exact:true})).toBeFocused();
    await page.keyboard.press("Escape"); await expect(opener(page)).toBeFocused();
    await page.goBack();await expect(chip(page)).toContainText("0–1.000");
    await page.goForward();await expect(chip(page)).toContainText("5–100");
    await page.reload();await expect(chip(page)).toContainText("5–100"); await expect(link(page,1)).toBeVisible();
    const unchanged=f.calls.length;
    for(const [lang,label] of [["en","Words: 5–100"],["es","Palabras: 5–100"],["pt-BR","Palavras: 5–100"]]) {
      await page.evaluate(lang=>{localStorage.setItem("historietas-idioma",lang);window.dispatchEvent(new StorageEvent("storage",{key:"historietas-idioma",newValue:lang}));},lang);
      await expect(page.getByRole("group").getByRole("button",{name:new RegExp(label)})).toBeVisible();
    }
    expect(f.calls.length).toBe(unchanged);
    await chip(page).focus();const removed=page.waitForResponse(r=>catalog(r)&&!Object.hasOwn(r.request().postDataJSON(),"p_palavras_minimas")&&r.request().postDataJSON()?.p_tag==="aventura");
    await page.keyboard.press("Enter");expect((await removed).ok()).toBe(true);
    await expect(chip(page)).toHaveCount(0);expect(new URL(page.url()).searchParams.get("statusEditorial")).toBe("concluida");
    await expect(page.getByRole("group",{name:"Filtros selecionados"}).getByRole("button",{name:/Estado da história/})).toBeFocused();
    const d2=await panel(page);await apply(page,d2,"0","0");await page.keyboard.press("Escape");
    await page.getByRole("button",{name:"Autores",exact:true}).click();
    await expect(chip(page)).toHaveCount(0); expect(new URL(page.url()).searchParams.has("palavrasMinimas")).toBe(false);
    const authors=await panel(page);await expect(authors.getByRole("textbox",{name:"Mínimo de palavras",exact:true})).toHaveCount(0);
    const beforeClear=f.calls.length;
    const neutral=Promise.all(["recentes","geral","curtidas","comentadas","salvas","capitulos"].map(ordem=>
      page.waitForResponse(r=>catalog(r)&&r.request().postDataJSON()?.p_ordenacao===ordem&&!Object.hasOwn(r.request().postDataJSON(),"p_tag"))));
    await authors.getByRole("button",{name:"Limpar filtros",exact:true}).click(); await expect(page).toHaveURL(/\/explorar$/);await neutral;
    expect(f.calls.slice(beforeClear)).toHaveLength(6); // The unchanged neutral selection.
    expect(f.writes).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });

  test(`palavras: URL inválida, cache, erro/retry, cursores e resposta antiga — ${device}`,async({page})=>{
    const f=await fixture(page,viewport);
    await page.goto("/explorar?palavrasMinimas=1e3");
    await expect(page.getByRole("button",{name:"Corrigir intervalo de palavras",exact:true})).toBeVisible();
    expect(f.calls).toHaveLength(0); await expect(link(page,1)).toHaveCount(0);
    await page.getByRole("button",{name:"Corrigir intervalo de palavras",exact:true}).click();
    const d=page.getByRole("dialog",{name:"EXPLORAR",exact:true});
    const min=d.getByRole("textbox",{name:"Mínimo de palavras",exact:true}), max=d.getByRole("textbox",{name:"Máximo de palavras",exact:true});
    await expect(min).toHaveValue("1e3");await expect(min).toHaveAttribute("aria-invalid","true");
    await expect(d.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true})).toBeDisabled();
    await min.fill("10");await max.fill("2");await expect(d.getByRole("alert")).toBeVisible();expect(f.calls).toHaveLength(0);
    await apply(page,d,"0","100");await page.keyboard.press("Escape");await expect(link(page,24)).toBeVisible();
    const next=page.waitForResponse(r=>catalog(r)&&r.request().postDataJSON()?.p_cursor_id===works[23].id);
    await page.getByRole("button",{name:"Carregar mais",exact:true}).click();expect((await next).ok()).toBe(true);await expect(link(page,26)).toBeVisible();
    const p=await panel(page);f.fail(true);
    await min.fill("1");await max.fill("50");
    const bad=wordResponse(page,1,50);await p.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true}).click();expect((await bad).status()).toBe(503);
    await page.keyboard.press("Escape");await expect(link(page,1)).toHaveCount(0); await expect(link(page,26)).toHaveCount(0);
    const notice=page.getByRole("alert").filter({hasText:/catálogo/});await expect(notice).toBeVisible();
    f.fail(false);const retry=wordResponse(page,1,50);await notice.getByRole("button",{name:"Tentar novamente",exact:true}).click();await retry;
    await expect(link(page,1)).toBeVisible();await expect(notice).toHaveCount(0);
    expect(f.calls.at(-1).p_cursor_id).toBeNull();
    const p2=await panel(page);f.delay(2);await min.fill("2");
    const request=page.waitForRequest(r=>new URL(r.url()).pathname.endsWith("/listar_obras_catalogo")&&r.postDataJSON()?.p_palavras_minimas===2);
    await p2.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true}).click();await request;
    const old=wordResponse(page,2,50);await apply(page,p2,"3","40");f.release();await old;
    await page.keyboard.press("Escape");await expect(chip(page)).toContainText("3–40");await expect(link(page,26)).toHaveCount(0);
    expect(f.calls.at(-1).p_cursor_id).toBeNull();expect(f.writes).toEqual([]);
  });

  test(`palavras: filtro real no Supabase local, confirmado e sem fallback amplo — ${device}`,async({page,baseURL})=>{
    expect(["127.0.0.1","localhost"]).toContain(new URL(baseURL).hostname);
    expect(["127.0.0.1","localhost"]).toContain(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    await page.setViewportSize(viewport);const calls=[];
    page.on("request",r=>{if(new URL(r.url()).pathname.endsWith("/listar_obras_catalogo"))calls.push(r.postDataJSON());});
    const r=wordResponse(page,0,0);await page.goto("/explorar?palavrasMinimas=0&palavrasMaximas=0");expect((await r).ok()).toBe(true);
    await expect(chip(page)).toContainText("0–0");
    await expect(page.getByText("Nenhuma obra encontrada",{exact:true})).toBeVisible();
    const applied=calls.filter(c=>Object.hasOwn(c,"p_palavras_minimas"));expect(applied).toHaveLength(1);
    expect(Object.keys(applied[0])).toHaveLength(17);
    expect(calls).toHaveLength(1);
  });

  test(`palavras: sessão real, cache antigo, logout e troca de conta em outra aba — ${device}`,async({page,context})=>{
    expect(["127.0.0.1","localhost"]).toContain(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    await page.setViewportSize(viewport);await loginAsAuthor(page);
    const f=await fixture(page,viewport,true);
    let r=wordResponse(page,0,100);await page.goto("/explorar?palavrasMinimas=0&palavrasMaximas=100");await r;await expect(link(page,1)).toBeVisible();
    f.fail(true);r=wordResponse(page,0,100);await page.reload();expect((await r).status()).toBe(503);
    await expect(link(page,1)).toHaveCount(0); // Author cache survives reload but cannot certify words.
    f.fail(false);r=wordResponse(page,0,100);await page.getByRole("button",{name:"Tentar novamente",exact:true}).click();await r;await expect(link(page,1)).toBeVisible();
    const d=await panel(page);f.delay(2);await d.getByRole("textbox",{name:"Mínimo de palavras",exact:true}).fill("2");
    const pending=page.waitForRequest(r=>new URL(r.url()).pathname.endsWith("/listar_obras_catalogo")&&r.postDataJSON()?.p_palavras_minimas===2);
    await d.getByRole("button",{name:"Aplicar intervalo de palavras",exact:true}).click();await pending;await page.keyboard.press("Escape");
    const other=await context.newPage();
    try {
      await other.goto("/configuracoes");
      const anon=wordResponse(page,2,100);
      await other.getByRole("button",{name:/Sair da conta/}).click();await expect(other).toHaveURL(/\/login/);await anon;
      await expect(link(page,1)).toBeVisible();
      const late=wordResponse(page,2,100);f.release();await late;await expect(link(page,26)).toHaveCount(0);
      const visitor=wordResponse(page,2,100);await loginAsVisitor(other);await visitor;
      await expect(link(page,1)).toBeVisible();await expect(link(page,26)).toHaveCount(0);
    } finally {f.release();await other.close();}
    await expect(chip(page)).toContainText("2–100");expect(f.writes).toEqual([]);
  });
}
