import assert from "node:assert/strict";
import test from "node:test";
import {loadApplicationModule as load} from "../helpers/load-application-module.mjs";

const row = {id:"obra",user_id:"A",status_editorial:null,status_editorial_versao:"00000000-0000-4000-8000-000000000001"};
function harness() {
  const slots=[],effects=[];let index=0,listener,read=async()=>row;
  const react={
    useState(initial){const n=index++;if(!(n in slots))slots[n]=initial;return[slots[n],v=>{slots[n]=typeof v==="function"?v(slots[n]):v;}];},
    useRef(initial){const n=index++;if(!(n in slots))slots[n]={current:initial};return slots[n];},
    useCallback(callback){const n=index++;if(!(n in slots))slots[n]=callback;return slots[n];},
    useEffect(effect){const n=index++;if(!(n in slots)){slots[n]=true;effects.push(effect);}},
  };
  const {useEditarObraEditorial}=load("app/editar-obra/hooks/use-editar-obra-editorial.ts",{
    react,
    "../../../lib/supabase/client":{supabase:{auth:{
      onAuthStateChange(fn){listener=fn;return{data:{subscription:{unsubscribe(){}}}};},
      async getUser(){return{data:{user:{id:"A"}},error:null};},
    }}},
    "../lib/editar-obra-work-loader":{carregarObraSupabaseEdicaoObra:()=>read()},
  });
  function useRender(){index=0;return useEditarObraEditorial();}
  const render=useRender;
  render();const cleanup=effects.map(effect=>effect());
  return{render,auth:id=>listener("SIGNED_IN",id?{user:{id}}:null),read:fn=>{read=fn;},unmount:()=>cleanup.forEach(fn=>fn?.())};
}
function ready(h){h.auth("A");const carga=h.render().iniciarCarga("obra");assert.equal(carga.identificar("A"),true);carga.confirmar(row);return carga;}

test("identidade A→B→A, logout e desmontagem invalidam confirmações e respostas antigas",()=>{
  const h=harness(),carga=ready(h),captura=h.render().capturar();
  h.render().escolher("pausada");h.auth("B");h.auth("A");
  assert.equal(captura.vigente(),false);assert.equal(carga.atual(),false);
  carga.confirmar(row);assert.equal(h.render().confirmado,null);assert.equal(h.render().escolha,"");
  const nova=ready(h);assert.ok(h.render().confirmado);h.auth("");nova.confirmar(row);assert.equal(h.render().confirmado,null);
  const ultima=ready(h);h.unmount();assert.equal(ultima.atual(),false);
});
test("nova carga e navegação A→B→A não aceitam confirmação da primeira carga",()=>{
  const h=harness(),old=ready(h);
  h.render().iniciarCarga("outra");const latest=h.render().iniciarCarga("obra");latest.identificar("A");
  old.confirmar(row);assert.equal(h.render().confirmado,null);
  latest.confirmar(row);assert.equal(h.render().confirmado.id,"obra");
  latest.confirmar({...row,status_editorial_versao:undefined});assert.equal(h.render().confirmado,null);
});
test("a URL da outra obra bloqueia a captura antes de o efeito de navegação executar",()=>{
  const original=globalThis.window;
  try {
    globalThis.window={location:{search:"?obraId=obra"}};
    const h=harness();ready(h);const captured=h.render().capturar();
    assert.equal(captured.vigente(),true);
    globalThis.window.location.search="?obraId=outra";
    assert.equal(captured.vigente(),false);
    h.unmount();
  } finally {if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});
test("reconciliação mantém intenção; leitura posterior nunca confirma escrita nem reaplica automaticamente",async()=>{
  const h=harness();ready(h);h.render().escolher("pausada");
  h.render().capturar().concluir({estado:"incerta"});assert.equal(h.render().bloqueado,true);
  h.read(async()=>({...row,status_editorial:"concluida"}));await h.render().reconciliar();
  assert.equal(h.render().resultado,"incerta");assert.equal(h.render().escolha,"pausada");
  assert.equal(h.render().confirmado.status,"concluida");assert.equal(h.render().capturar().podeSalvar,false);
  h.render().decidirManterEscolha();assert.equal(h.render().capturar().podeSalvar,true);assert.equal(h.render().escolha,"pausada");
  h.render().capturar().concluir({estado:"sem_linha"});await h.render().reconciliar();h.render().decidirUsarAtual();
  assert.equal(h.render().escolha,"concluida");assert.equal(h.render().resultado,null);
});
test("falha e resposta tardia de reconciliação não confirmam outra obra nem prendem nova carga",async()=>{
  const h=harness();ready(h);
  h.read(async()=>{throw new TypeError("Rede indisponível");});await h.render().reconciliar();
  assert.equal(h.render().confirmado,null);assert.equal(h.render().resultado,"indisponivel");
  ready(h);let release;h.read(()=>new Promise(resolve=>{release=resolve;}));
  const pending=h.render().reconciliar();await Promise.resolve();
  const nova=h.render().iniciarCarga("outra");nova.identificar("A");
  release(row);await pending;
  assert.equal(h.render().confirmado,null);assert.equal(h.render().reconciliando,false);
});
