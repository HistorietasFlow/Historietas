import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const origin = process.env.E2E_BASE_URL;
const root = path.resolve(import.meta.dirname,"../..");
const output = path.join(root,"qa/reports/story-stage3");
const check = result => { expect(result.error).toBeNull(); return result.data; };
const options = {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
let reader, author, slug, workId;
test.use({trace:"off",video:"off"});
test.beforeEach(async ({page},testInfo)=>{
  const events=[];
  const started=Date.now();
  const stage=request=>{
    const pathname=new URL(request.url()).pathname;
    if(pathname==="/api/story-avaliacao")return request.postDataJSON()?.acao==="gerar"?"geracao":"confirmacao";
    if(pathname==="/auth/v1/user")return "auth";
    if(pathname==="/rest/v1/rpc/obter_metricas_conteudos")return "avaliacao";
    if(pathname==="/api/obra-publica")return "obra";
    return null;
  };
  for(const name of ["request","requestfinished","requestfailed"])page.on(name,request=>{
    const etapa=stage(request);if(etapa)events.push({etapa,evento:name,ms:Date.now()-started});
  });
  page.on("response",response=>{
    const etapa=stage(response.request());
    if(etapa)events.push({etapa,evento:"response",http:response.status(),ms:Date.now()-started});
    if(etapa==="auth"&&response.status()===200)void response.json().then(user=>events.push({etapa:"identidade",proprietario:user.id===reader?.id,ms:Date.now()-started})).catch(()=>{});
  });
  testInfo.storyDiagnostics=events;
});
test.afterEach(async ({},testInfo)=>{
  await testInfo.attach("story-diagnostics",{body:Buffer.from(JSON.stringify(testInfo.storyDiagnostics)),contentType:"application/json"});
});
test.beforeAll(async () => {
  for (const value of [api,origin]) expect(["localhost","127.0.0.1","[::1]"]).toContain(new URL(value).hostname);
  const admin = createClient(api,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
  async function account(nome,tipo) {
    const email=`qa-story-ui-${randomUUID()}@historietas.test`,password=randomBytes(24).toString("base64url");
    const created=check(await admin.auth.admin.createUser({email,password,email_confirm:true}));
    const client=createClient(api,key,options), auth=check(await client.auth.signInWithPassword({email,password}));
    const id=created.user.id;
    check(await client.from("profiles").insert({id,user_id:id,nome,tipo}));
    check(await client.rpc("aceitar_termos_publicacao",{p_termos_versao:"2026-08-05",p_diretrizes_versao:"2026-08-05",p_politica_versao:"2026-08-05"}));
    return {id,client,session:auth.session};
  }
  author=await account("Helena Duarte","autor");reader=await account("Lucas Almeida","leitor");
  check(await reader.client.from("preferencias_privacidade").upsert({user_id:reader.id,visibilidade_biblioteca:"publico",mostrar_avaliacoes:true},{onConflict:"user_id"}));
  const cover=await sharp(readFileSync(path.join(root,"qa/references/Historietas_Modelo_Stories_Aprovado.png"))).extract({left:195,top:298,width:550,height:764}).png().toBuffer();
  const file=`${author.id}/story-ui-${randomUUID()}.png`;
  check(await author.client.storage.from("capas-obras").upload(file,cover,{contentType:"image/png"}));
  workId=randomUUID();slug=`qa-story-ui-${randomUUID()}`;
  check(await author.client.from("obras").insert({id:workId,user_id:author.id,slug,titulo:"A Última Luz",autor:"Helena Duarte",genero:"Fantasia",formato:"Conto",classificacao_indicativa:"Livre",sinopse:"Fixture local do compartilhamento de avaliação.",capa_url:author.client.storage.from("capas-obras").getPublicUrl(file).data.publicUrl,publicado:false}));
  check(await author.client.from("obras").update({publicado:true}).eq("id",workId).eq("user_id",author.id));
  check(await reader.client.from("obra_avaliacoes").insert({obra_id:workId,user_id:reader.id,nota:4.5,visibilidade:"publico"}));
  mkdirSync(output,{recursive:true});
});
async function login(context,who=reader) {
  await context.clearCookies();
  const jar = new Map();
  const ssr=createServerClient(api,key,{cookies:{getAll:()=>[],setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
  check(await ssr.auth.setSession(who.session));
  await context.addCookies([...jar].map(([name,value])=>({name,value,url:origin,sameSite:"Lax"})));
}
async function post(context,acao="gerar",leitorId=reader.id) {
  return context.request.post(`${origin}/api/story-avaliacao`,{headers:{Origin:origin},data:{slug,leitorId,acao}});
}
async function openWork(page, expectedReader = reader.id) {
  // Observar desde ANTES da navegação evita perder respostas rápidas. A espera
  // por métricas só começa após seus pré-requisitos reais; o limite total do
  // teste (45 s), da navegação e das asserções continua sendo o da configuração.
  const progress={identity:false,publicStatus:null,metricsStatus:null,metricsFinished:false};
  const observe=async response=>{
    const url=new URL(response.url());
    if(url.pathname==="/auth/v1/user"&&response.status()===200) {
      await response.finished();const user=await response.json();
      if(user.id===expectedReader)progress.identity=true;
    } else if(url.pathname==="/api/obra-publica"&&url.searchParams.get("slug")===slug) {
      await response.finished();progress.publicStatus=response.status();
    } else if(url.pathname==="/rest/v1/rpc/obter_metricas_conteudos"&&
      (response.request().postDataJSON()?.p_obra_ids||[]).includes(workId)) {
      progress.metricsStatus=response.status();
      if(await response.finished()===null)progress.metricsFinished=true;
    }
  };
  const listener=response=>{void observe(response).catch(()=>{});};
  page.on("response",listener);
  try {
    await test.step("navegação da obra",()=>page.goto(`/obra/${slug}`,{waitUntil:"domcontentloaded"}));
    if(expectedReader)await test.step("Auth concluído da conta esperada",async()=>{
      await expect.poll(()=>progress.identity).toBe(true);
    });
    await test.step("revalidação pública concluída",async()=>{
      await expect.poll(()=>progress.publicStatus).toBe(200);
    });
    await test.step("métricas da avaliação concluídas",async()=>{
      await expect.poll(()=>progress.metricsStatus).toBe(200);
      await expect.poll(()=>progress.metricsFinished).toBe(true);
    });
  } finally {page.off("response",listener);}
}
for (const mode of ["desktop","mobile"]) {
  test.describe(mode,()=>{
    test.use({viewport:mode==="mobile"?{width:390,height:844}:{width:1440,height:900},isMobile:mode==="mobile",hasTouch:mode==="mobile"});
    test("prévia, download, compartilhar arquivo, cancelamento e fallback",async({page,context})=>{
      await login(context);
      await openWork(page);
      const trigger=page.getByRole("button",{name:"Compartilhar minha avaliação",exact:true});
      await expect(trigger).toBeVisible();
      await page.locator('[data-obra-responsive="rating"]').screenshot({path:path.join(output,`${mode}-button.png`)});
      await trigger.click();
      const dialog=page.getByRole("dialog",{name:"Story da minha avaliação"});
      const preview=dialog.getByRole("img",{name:"Prévia do Story da sua avaliação"});
      await expect(preview).toBeVisible();
      await expect.poll(()=>preview.evaluate(img=>[img.naturalWidth,img.naturalHeight])).toEqual([1080,1920]);
      await expect(dialog.getByRole("button",{name:"Fechar",exact:true})).toBeFocused();
      const accessibility = await new AxeBuilder({page}).include("dialog[open]").analyze();
      expect(accessibility.violations).toEqual([]);
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button",{name:"Compartilhar",exact:true})).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button",{name:"Fechar",exact:true})).toBeFocused();
      await page.screenshot({path:path.join(output,`${mode}-preview.png`)});
      const downloading=page.waitForEvent("download");await dialog.getByRole("button",{name:"Baixar imagem",exact:true}).click();
      const download=await downloading;expect(download.suggestedFilename()).toBe("historietas-avaliacao.png");
      await download.saveAs(path.join(output,`${mode}-download.png`));
      const meta=await sharp(await download.path()).metadata();expect([meta.width,meta.height]).toEqual([1080,1920]);
      // Só a integração do SO é adaptada: arquivo e geração vêm do backend real.
      await page.evaluate(()=>{
        window.storyShares=[];window.storyShareMode="success";
        Object.defineProperty(navigator,"canShare",{configurable:true,value:()=>true});
        Object.defineProperty(navigator,"share",{configurable:true,value:async({files})=>{
          if(window.storyShareMode==="cancel")throw new DOMException("cancel","AbortError");
          window.storyShares.push({name:files[0].name,type:files[0].type,size:files[0].size});
        }});
      });
      await dialog.getByRole("button",{name:"Compartilhar",exact:true}).click();
      await expect.poll(()=>page.evaluate(()=>window.storyShares.length)).toBe(1);
      expect(await page.evaluate(()=>window.storyShares[0])).toMatchObject({name:"historietas-avaliacao.png",type:"image/png"});
      let extraDownloads=0;page.on("download",()=>extraDownloads++);
      await page.evaluate(()=>{window.storyShareMode="cancel";});
      await dialog.getByRole("button",{name:"Compartilhar",exact:true}).click();
      await expect(dialog.getByRole("status")).toHaveText("Compartilhamento cancelado.");expect(extraDownloads).toBe(0);
      await page.evaluate(()=>Object.defineProperty(navigator,"canShare",{configurable:true,value:()=>false}));
      const fallback=page.waitForEvent("download");await dialog.getByRole("button",{name:"Compartilhar",exact:true}).click();await fallback;
      await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
    });
    test("privacidade e propriedade verificadas pelo servidor",async({page,context})=>{
      await context.clearCookies();expect((await post(context)).status()).toBe(403);
      await openWork(page,null);await expect(page.locator('[data-obra-responsive="rating"]')).toBeVisible();
      await expect(page.getByRole("button",{name:"Compartilhar minha avaliação",exact:true})).toHaveCount(0);
      await login(context,author);expect((await post(context)).status()).toBe(403);
      await login(context);
      expect((await post(context,"confirmar")).status()).toBe(200);
      check(await reader.client.from("obra_avaliacoes").update({visibilidade:"privado"}).eq("obra_id",workId).eq("user_id",reader.id));
      try {
        expect((await post(context,"confirmar")).status()).toBe(403);expect((await post(context)).status()).toBe(403);
        await openWork(page);await expect(page.locator('[data-obra-responsive="rating"]')).toBeVisible();
        await expect(page.getByRole("button",{name:"Compartilhar minha avaliação",exact:true})).toHaveCount(0);
      } finally {check(await reader.client.from("obra_avaliacoes").update({visibilidade:"publico"}).eq("obra_id",workId).eq("user_id",reader.id));}
      check(await author.client.from("obras").update({publicado:false}).eq("id",workId).eq("user_id",author.id));
      try {expect((await post(context)).status()).toBe(403);}
      finally {check(await author.client.from("obras").update({publicado:true}).eq("id",workId).eq("user_id",author.id));}
    });
    test("falha, fechamento durante geração e troca de conta",async({page,context})=>{
      await login(context);await openWork(page);
      const trigger=page.getByRole("button",{name:"Compartilhar minha avaliação",exact:true});await expect(trigger).toBeVisible();
      await page.route("**/api/story-avaliacao",async route=>{
        if(route.request().postDataJSON().acao==="gerar")await route.fulfill({status:503,contentType:"application/json",body:'{"disponivel":false}'});else await route.continue();
      });
      await trigger.click();await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Não foi possível gerar");
      await page.getByRole("button",{name:"Fechar",exact:true}).click();await page.unroute("**/api/story-avaliacao");
      await trigger.click();await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);
      await trigger.click();await expect(page.getByRole("img",{name:"Prévia do Story da sua avaliação"})).toBeVisible();
      await login(context,author);
      await page.evaluate(({session,storageKey})=>{
        const channel=new BroadcastChannel(storageKey);channel.postMessage({event:"SIGNED_IN",session});channel.close();
      },{session:author.session,storageKey:`sb-${new URL(api).hostname.split(".")[0]}-auth-token`});
      await expect(page.getByRole("dialog")).toHaveCount(0);await expect(trigger).toHaveCount(0);
      expect((await post(context)).status()).toBe(403);
    });
    test("interface em inglês e espanhol",async({page,context},testInfo)=>{
      await login(context);
      await openWork(page);
      for(const [language,open,title,close,download,share] of [["en","Share my rating","My rating Story","Close","Download image","Share"],["es","Compartir mi valoración","Story de mi valoración","Cerrar","Descargar imagen","Compartir"]]) {
        await page.evaluate(value=>localStorage.setItem("historietas-idioma",value),language);
        await page.reload();
        await page.getByRole("button",{name:open,exact:true}).click();
        const dialog=page.getByRole("dialog",{name:title,exact:true});await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("button",{name:download,exact:true})).toBeVisible();
        await expect(dialog.getByRole("button",{name:share,exact:true})).toBeVisible();
        await dialog.getByRole("button",{name:close,exact:true}).click();await expect(dialog).not.toBeVisible();
      }
      expect(testInfo.storyDiagnostics.some(e=>e.etapa==="identidade"&&e.proprietario===true)).toBe(true);
      expect(testInfo.storyDiagnostics.some(e=>e.etapa==="avaliacao"&&e.evento==="response"&&e.http===200)).toBe(true);
      expect(testInfo.storyDiagnostics.some(e=>e.etapa==="avaliacao"&&e.evento==="requestfinished")).toBe(true);
    });
    test("alteração salva e exclusão da avaliação não reutilizam confirmação antiga",async({page,context})=>{
      await login(context);await openWork(page);
      const trigger=page.getByRole("button",{name:"Compartilhar minha avaliação",exact:true});
      await expect(trigger).toBeVisible();
      try {
        for(const nota of [3,3.5]) {
          check(await reader.client.from("obra_avaliacoes").update({nota}).eq("obra_id",workId).eq("user_id",reader.id));
          const result=await post(context,"confirmar");expect(result.status()).toBe(200);
          expect(await result.json()).toEqual({disponivel:true,nota});
        }
        await page.reload();await expect(trigger).toBeVisible();
        await trigger.click();await expect(page.getByRole("dialog").getByRole("img")).toBeVisible();
        await page.keyboard.press("Escape");
        check(await reader.client.from("obra_avaliacoes").delete().eq("obra_id",workId).eq("user_id",reader.id));
        expect((await post(context,"confirmar")).status()).toBe(403);
        expect((await post(context)).status()).toBe(403);
        await openWork(page);
        await expect(trigger).toHaveCount(0);
      } finally {
        check(await reader.client.from("obra_avaliacoes").upsert({obra_id:workId,user_id:reader.id,nota:4.5,visibilidade:"publico"},{onConflict:"obra_id,user_id"}));
      }
    });
  });
}
