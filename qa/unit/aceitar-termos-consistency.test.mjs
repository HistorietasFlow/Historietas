import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function adiar(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};}
function hooks(t){
  const slots=[],efeitos=[];let indice=0,pendentes=[];
  const react={
    useState(valor){const i=indice++;if(!slots[i]){const slot={valor};slot.set=novo=>{slot.valor=typeof novo==="function"?novo(slot.valor):novo;};slots[i]=slot;}return[slots[i].valor,slots[i].set];},
    useRef(valor){const i=indice++;return slots[i]??={current:valor};},
    useLayoutEffect(callback,deps){react.useEffect(callback,deps);},
    useEffect(callback,deps){const i=indice++;if(!efeitos[i]||deps.some((d,j)=>!Object.is(d,efeitos[i].deps[j])))pendentes.push(()=>{efeitos[i]?.cleanup?.();efeitos[i]={deps,cleanup:callback()};});},
  };
  function desmontar(){for(const e of efeitos)e?.cleanup?.();efeitos.length=0;}
  t.after(desmontar);
  return{react,desmontar,render(callback){indice=0;pendentes=[];const retorno=callback();for(const efeito of pendentes)efeito();return retorno;}};
}
const contexto=(id="A")=>({usuarioId:id,ativo:true,pronto:true,enviando:false,aceito:false});
function acoes(t){
  const runtime=hooks(t),escritas=[],navegacoes=[],contextoRef={current:contexto()},estado={erro:"",salvando:false};let identidade="A";
  const props={contextoRef,router:{replace:href=>navegacoes.push(href),refresh:()=>navegacoes.push("refresh")},salvando:false,confirmouTermos:true,confirmouPrivacidade:true,redirectTo:"/publicar",t:chave=>chave,setErro:v=>{estado.erro=v;},setSalvando:v=>{estado.salvando=v;}};
  const modulo=loadApplicationModule("app/aceitar-termos/hooks/use-aceitar-termos-action.ts",{react:runtime.react,
    "../../../lib/aceiteTermos":{registrarAceiteTermosPublicacao(){const resposta=adiar();escritas.push(resposta);return resposta.promise;}},
    "../../../lib/supabase/client":{supabase:{auth:{getUser:async()=>({data:{user:identidade?{id:identidade}:null},error:null})}}},
  });
  return{sessao(id){identidade=id;},props,estado,escritas,navegacoes,contextoRef,desmontar:runtime.desmontar,render(){return runtime.render(()=>modulo.useAceitarTermosAction(props));},trocar(id){identidade=id;contextoRef.current.ativo=false;contextoRef.current=contexto(id);}};
}

test("duas submissões antes do render enviam só um aceite",async t=>{
  const c=acoes(t),acao=c.render();const a=acao.aceitar(),b=acao.aceitar();await tick();assert.equal(c.escritas.length,1);
  c.escritas[0].resolve({aceito:true,erro:""});await Promise.all([a,b]);assert.deepEqual(c.navegacoes,["/publicar","refresh"]);
});
test("sucesso atrasado da conta A não navega a sessão B",async t=>{
  const c=acoes(t),a=c.render().aceitar();await tick();c.trocar("B");c.render();c.escritas[0].resolve({aceito:true,erro:""});await a;assert.deepEqual(c.navegacoes,[]);
});

for(const [nome,resposta]of [["negativa",{aceito:false,erro:""}],["remota",{aceito:false,erro:"offline"}],["exceção",new Error("interrompido")]])test(`falha ${nome} não confirma e libera nova tentativa`,async t=>{
  const c=acoes(t),acao=c.render(),a=acao.aceitar();await tick();
  if(resposta instanceof Error)c.escritas[0].reject(resposta);else c.escritas[0].resolve(resposta);await a;
  assert.equal(c.estado.salvando,false);assert.ok(c.estado.erro);assert.deepEqual(c.navegacoes,[]);assert.equal(c.contextoRef.current.aceito,false);
  const b=acao.aceitar();await tick();c.escritas[1].resolve({aceito:true,erro:""});await b;assert.deepEqual(c.navegacoes,["/publicar","refresh"]);assert.equal(c.estado.salvando,false);
  await acao.aceitar();assert.equal(c.escritas.length,2);
});
test("as duas confirmações e a carga pronta são obrigatórias",async t=>{
  const c=acoes(t);c.props.confirmouPrivacidade=false;await c.render().aceitar();assert.equal(c.estado.erro,"erroMarcar");assert.equal(c.escritas.length,0);
  c.props.confirmouPrivacidade=true;c.contextoRef.current.pronto=false;await c.render().aceitar();assert.equal(c.estado.erro,"erroLogin");assert.equal(c.escritas.length,0);
});
for(const resultado of [{aceito:true,erro:""},{aceito:false,erro:"atrasado"}])test("resposta antiga não limpa loading/erro da nova conta nem sobrevive A→B→A",async t=>{
  const c=acoes(t),a=c.render().aceitar();await tick();c.trocar("B");c.render();c.trocar("A");const b=c.render().aceitar();await tick();
  c.estado.erro="nova conta";c.escritas[0].resolve(resultado);await a;assert.equal(c.estado.salvando,true);assert.equal(c.estado.erro,"nova conta");assert.deepEqual(c.navegacoes,[]);
  c.escritas[1].resolve({aceito:true,erro:""});await b;assert.equal(c.estado.salvando,false);
});

function pagina(t,{adiarUsuario=false}={}){
  const runtime=hooks(t),usuarios=[],status=[],escritas=[],navegacoes=[];let listener,identidade="A",unsubscribe=0;
  const estado={redirectTo:"/",jaAceito:false,erro:"",carregando:true,salvando:false,confirmouTermos:false,confirmouPrivacidade:false};
  const setters=Object.fromEntries(Object.keys(estado).map(chave=>["set"+chave[0].toUpperCase()+chave.slice(1),valor=>{estado[chave]=typeof valor==="function"?valor(estado[chave]):valor;}]));
  const props={...setters,router:{replace:href=>navegacoes.push(href),refresh:()=>navegacoes.push("refresh")},t:chave=>chave};
  const mocks={react:runtime.react,
    "../../../lib/supabase/client":{supabase:{auth:{getUser(){if(adiarUsuario){const p=adiar();usuarios.push(p);return p.promise;}return Promise.resolve({data:{user:identidade?{id:identidade}:null},error:null});},onAuthStateChange(cb){listener=cb;return{data:{subscription:{unsubscribe(){unsubscribe++;}}}};}}}},
    "../../../lib/aceiteTermos":{obterRedirectToAceiteTermos:valor=>valor||"/",verificarAceiteTermosPublicacao(){const p=adiar();status.push(p);return p.promise;},registrarAceiteTermosPublicacao(){const p=adiar();escritas.push(p);return p.promise;}},
  };
  const initial=loadApplicationModule("app/aceitar-termos/hooks/use-aceitar-termos-initial-load.ts",mocks),action=loadApplicationModule("app/aceitar-termos/hooks/use-aceitar-termos-action.ts",mocks);
  const anterior=Object.getOwnPropertyDescriptor(globalThis,"window");Object.defineProperty(globalThis,"window",{value:{location:{search:"?redirectTo=%2Fpublicar"}},configurable:true});t.after(()=>{if(anterior)Object.defineProperty(globalThis,"window",anterior);else delete globalThis.window;});
  return{props,estado,status,usuarios,escritas,navegacoes,get unsubscribe(){return unsubscribe;},desmontar:runtime.desmontar,
    render(){return runtime.render(()=>{const carga=initial.useAceitarTermosInitialLoad(props);const a=action.useAceitarTermosAction({...props,...estado,contextoRef:carga.contextoRef});return{...carga,...a};});},
    trocar(id,evento="SIGNED_IN"){identidade=id;listener(evento,id?{user:{id}}:null);},
  };
}

test("carga só mostra comprovante após confirmação remota e limpa loading",async t=>{
  const c=pagina(t);c.render();await tick();assert.equal(c.estado.jaAceito,false);c.status[0].resolve({aceito:true,erro:""});await tick();assert.equal(c.estado.jaAceito,true);assert.equal(c.estado.carregando,false);assert.equal(c.render().contextoRef.current.aceito,true);assert.deepEqual(c.navegacoes,[]);
});
for(const fase of ["usuário","status"])test(`exceção de ${fase} encerra loading e retry recupera`,async t=>{
  const c=pagina(t,{adiarUsuario:fase==="usuário"});c.render();await tick();(fase==="usuário"?c.usuarios[0]:c.status[0]).reject(new Error("offline"));await tick();assert.equal(c.estado.carregando,false);assert.equal(c.estado.jaAceito,false);assert.match(c.estado.erro,/offline/);
  c.render().recarregar();c.render();await tick();if(fase==="usuário"){c.usuarios[1].resolve({data:{user:{id:"A"}},error:null});await tick();}
  c.status.at(-1).resolve({aceito:false,erro:""});await tick();if(fase==="usuário"){c.usuarios[2].resolve({data:{user:{id:"A"}},error:null});await tick();}assert.equal(c.estado.erro,"");assert.equal(c.estado.carregando,false);assert.equal(c.render().contextoRef.current.pronto,true);
});

test("status atrasado não confirma aceite de outra conta e limpa consentimentos na troca",async t=>{
  const c=pagina(t);c.render();await tick();c.estado.confirmouTermos=true;c.estado.confirmouPrivacidade=true;c.estado.salvando=true;
  c.trocar("B");assert.equal(c.estado.confirmouTermos,false);assert.equal(c.estado.confirmouPrivacidade,false);assert.equal(c.estado.salvando,false);assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.carregando,true);await tick();
  c.status[0].resolve({aceito:true,erro:""});await tick();assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.carregando,true);
  c.status[1].resolve({aceito:false,erro:""});await tick();assert.equal(c.estado.carregando,false);assert.equal(c.render().contextoRef.current.usuarioId,"B");
});

test("sessão expirada encaminha ao login sem loading permanente nem escrita",async t=>{
  const c=pagina(t);c.render();await tick();c.trocar("","SIGNED_OUT");await tick();assert.equal(c.estado.carregando,false);assert.equal(c.estado.jaAceito,false);assert.match(c.navegacoes[0],/^\/login\?/);assert.match(decodeURIComponent(c.navegacoes[0]),/aceitar-termos/);assert.equal(c.escritas.length,0);
  c.status[0].resolve({aceito:true,erro:""});await tick();assert.equal(c.estado.jaAceito,false);
});

test("getUser inicial atrasado não substitui evento de conta nova",async t=>{
  const c=pagina(t,{adiarUsuario:true});c.render();c.trocar("B");await tick();c.usuarios[0].resolve({data:{user:{id:"A"}},error:null});await tick();assert.equal(c.status.length,0);
  c.usuarios[1].resolve({data:{user:{id:"B"}},error:null});await tick();c.status[0].resolve({aceito:false,erro:""});await tick();c.usuarios[2].resolve({data:{user:{id:"B"}},error:null});await tick();assert.equal(c.render().contextoRef.current.usuarioId,"B");assert.equal(c.estado.carregando,false);
});

test("mesma identidade preserva confirmações; desmontagem invalida resposta de submissão",async t=>{
  const c=pagina(t);c.render();await tick();c.status[0].resolve({aceito:false,erro:""});await tick();c.estado.confirmouTermos=true;c.estado.confirmouPrivacidade=true;
  const atual=c.render();c.trocar("A","TOKEN_REFRESHED");c.trocar("A");assert.equal(c.status.length,1);assert.equal(c.estado.confirmouTermos,true);
  const a=atual.aceitar();await tick();c.desmontar();const antes=structuredClone(c.estado);c.escritas[0].resolve({aceito:true,erro:""});await a;assert.deepEqual(c.estado,antes);assert.deepEqual(c.navegacoes,[]);assert.equal(c.unsubscribe,1);
});

test("troca de conta durante submissão real não navega nem confirma; conta B exige novos checks",async t=>{
  const c=pagina(t);c.render();await tick();c.status[0].resolve({aceito:false,erro:""});await tick();c.estado.confirmouTermos=true;c.estado.confirmouPrivacidade=true;
  const a=c.render().aceitar();await tick();c.trocar("B");await tick();c.escritas[0].resolve({aceito:true,erro:""});await a;assert.deepEqual(c.navegacoes,[]);assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.salvando,false);
  c.status[1].resolve({aceito:false,erro:""});await tick();await c.render().aceitar();assert.equal(c.estado.erro,"erroMarcar");assert.equal(c.escritas.length,1);
});

for(const id of ["","B"])test(`identidade fresca divergente (${id||"expirada"}) bloqueia RPC e sucesso sem depender de evento`,async t=>{
  const c=acoes(t);c.sessao(id);await c.render().aceitar();assert.equal(c.escritas.length,0);assert.equal(c.estado.salvando,false);assert.equal(c.estado.erro,"erroLogin");assert.deepEqual(c.navegacoes,[]);
  const d=acoes(t);const a=d.render().aceitar();await tick();d.sessao(id);d.escritas[0].resolve({aceito:true,erro:""});await a;assert.deepEqual(d.navegacoes,[]);assert.equal(d.estado.salvando,false);assert.equal(d.contextoRef.current.aceito,false);
});

test("sessão expirada após consulta de status não produz comprovante visual",async t=>{
  const c=pagina(t,{adiarUsuario:true});c.render();c.usuarios[0].resolve({data:{user:{id:"A"}},error:null});await tick();c.status[0].resolve({aceito:true,erro:""});await tick();
  c.usuarios[1].resolve({data:{user:null},error:null});await tick();assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.carregando,false);assert.equal(c.estado.erro,"erroLogin");
});

test("handler do render A não reutiliza os checks de A numa sessão B já carregada",async t=>{
  const c=acoes(t),antiga=c.render();c.trocar("B");c.props.confirmouTermos=false;c.props.confirmouPrivacidade=false;c.render();
  const a=antiga.aceitar();await tick();assert.equal(c.escritas.length,0);await a;assert.deepEqual(c.navegacoes,[]);
});

for(const data of [true,false,null,"true"])test(`RPC existente mantém versões legais e confirmação estrita (${JSON.stringify(data)})`,async()=>{
  const chamadas=[];const modulo=loadApplicationModule("lib/aceiteTermos.ts",{"./supabase/client":{supabase:{rpc:async(...args)=>{chamadas.push(args);return{data,error:null};}}}});
  const resultado=await modulo.registrarAceiteTermosPublicacao();assert.equal(resultado.aceito,data===true);
  assert.deepEqual(chamadas,[["aceitar_termos_publicacao",{p_termos_versao:"2026-08-05",p_diretrizes_versao:"2026-08-05",p_politica_versao:"2026-08-05"}]]);
  assert.deepEqual(modulo.criarMetadataAceiteTermos("comprovante-existente"),{termos_uso_versao:"2026-08-05",termos_uso_aceitos_em:"comprovante-existente",diretrizes_comunidade_versao:"2026-08-05",diretrizes_comunidade_aceitas_em:"comprovante-existente",politica_privacidade_versao:"2026-08-05",politica_privacidade_ciente_em:"comprovante-existente"});
});

test("reexecução dos efeitos não reaplica consulta da montagem anterior",async t=>{
  const c=pagina(t);c.render();await tick();const antigo=c.render().contextoRef.current;c.desmontar();c.render();await tick();
  assert.equal(antigo.ativo,false);c.status[0].resolve({aceito:true,erro:""});await tick();assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.carregando,true);
  c.status[1].resolve({aceito:false,erro:""});await tick();assert.equal(c.estado.carregando,false);assert.equal(c.unsubscribe,1);
});


test("troca de idioma não refaz carga nem descarta confirmações da mesma conta",async t=>{
  const c=pagina(t);c.render();await tick();c.status[0].resolve({aceito:false,erro:""});await tick();c.estado.confirmouTermos=true;c.estado.confirmouPrivacidade=true;
  c.props.t=chave=>"traduzido:"+chave;c.render();await tick();assert.equal(c.status.length,1);assert.equal(c.estado.confirmouTermos,true);assert.equal(c.estado.confirmouPrivacidade,true);
});

test("INITIAL_SESSION sem sessão invalida getUser antigo ainda pendente",async t=>{
  const c=pagina(t,{adiarUsuario:true});c.render();c.trocar("","INITIAL_SESSION");await tick();c.usuarios[0].resolve({data:{user:{id:"A"}},error:null});await tick();assert.equal(c.status.length,0);
  c.usuarios[1].resolve({data:{user:null},error:null});await tick();assert.equal(c.estado.jaAceito,false);assert.equal(c.estado.carregando,false);assert.match(c.navegacoes[0],/^\/login\?/);
});
