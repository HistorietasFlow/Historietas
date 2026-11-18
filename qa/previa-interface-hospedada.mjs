import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire('/tmp/leitor-ui/deps.cjs');
const { chromium } = require('playwright-core');
const imported = await import(require.resolve('@sparticuz/chromium'));
const executable = imported.default;
const origin = 'https://historietas-2ah3lwmga-historietas.vercel.app';
const banco = 'https://cirxcvigrfyzbvzbfjvu.supabase.co';
const auth = await fetch(banco+'/auth/v1/token?grant_type=password',{method:'POST',redirect:'error',headers:{apikey:process.env.QA_PREVIA_PUB,'content-type':'application/json'},body:JSON.stringify({email:'qa-previa-seguidor@example.invalid',password:process.env.QA_PREVIA_SENHA_SEGUIDOR})});
assert.equal(auth.status,200);
const session=await auth.json();
for(const width of [1440,390]){
 const browser=await chromium.launch({headless:true,args:executable.args,executablePath:await executable.executablePath()});
 try{
 const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,isMobile:width===390});
 const boot=await ctx.request.get(origin+'/api/obras/qa-previa-seguidores/previa?'+process.env.QA_PREVIA_SHARE,{maxRedirects:0});
 console.log('QA_UI_GATEWAY',boot.status());
 const key='sb-cirxcvigrfyzbvzbfjvu-auth-token', val='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');
 for(let i=0;i<val.length;i+=3000)await ctx.addCookies([{name:val.length<=3000?key:key+'.'+Math.floor(i/3000),value:val.slice(i,i+3000),url:origin,sameSite:'Lax'}]);
 await ctx.addInitScript(()=>localStorage.setItem('historietas-idioma','pt-BR'));
 const page=await ctx.newPage(),requests=[],writes=[];
 page.on('request',r=>{const u=new URL(r.url());if(u.pathname.endsWith('/previa'))requests.push(u.pathname);if(r.method()!=='GET'&&/progresso|historico|visualiza|registrar_leitura/i.test(u.pathname))writes.push(u.pathname);});
 page.on('response',r=>{const u=new URL(r.url());if(u.pathname.includes('listar_obras_catalogo'))console.log('QA_UI_CATALOGO',r.status());});
 const res=await page.goto(origin+'/explorar?categoria=Fantasia',{waitUntil:'domcontentloaded'});console.log('QA_UI_LISTA',width,res.status());
 const card=page.locator('article').filter({has:page.locator('a[href="/obra/qa-previa-seguidores"]')}).first();
 const btn=card.getByRole('button',{name:'Ler o começo'});
 await btn.waitFor({timeout:45000});assert.equal(requests.length,0);
 await btn.scrollIntoViewIfNeeded();await btn.focus();
 const url=page.url(),scroll=await page.evaluate(()=>scrollY);
 const resp=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/obras/qa-previa-seguidores/previa');
 if(width===390)await btn.tap();else await btn.press('Enter');
 assert.equal((await resp).status(),200);
 await card.getByRole('status').getByText('A'.repeat(599)+'🌿',{exact:true}).waitFor();
 const close=card.getByRole('button',{name:'Fechar prévia'});
 assert.equal(await close.getAttribute('aria-expanded'),'true');assert.equal(page.url(),url);
 assert.ok(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1));
 if(width===390)await close.tap();else await close.press('Space');
 await btn.waitFor();assert.equal(await btn.getAttribute('aria-expanded'),'false');
 assert.equal(page.url(),url);assert.equal(requests.length,1);assert.equal(writes.length,0);
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<=2);
 console.log('QA_UI_PASS',width,'200 600 caracteres, sem navegacao, uma leitura, zero escritas, sem overflow');
 }finally{await browser.close();}
}