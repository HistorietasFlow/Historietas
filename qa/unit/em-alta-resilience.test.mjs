import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const tick = () => new Promise(resolve => setImmediate(resolve));
function adiar() { let resolve, reject; const promise = new Promise((r,j) => { resolve=r; reject=j; }); return { promise, resolve, reject }; }
const obra = (id = "obra", extras = {}) => ({
  id, titulo: id, autor: "Autora", autorId: "autora", genero: "Fantasia", formato: "Romance",
  classificacaoIndicativa: "Livre", publicado: true, capitulos: [], criadaEm: "2026-01-01", slug: id,
  totalViewsRanking: 5, ...extras,
});
const utils = { criarSlugBase: texto => texto.toLowerCase(), normalizarTexto: texto => texto.toLowerCase(), idObraSupabaseValido: id => id === "obra" };

test("duplicação por ID não duplica cards nem pontuação de autor; obras homônimas são distintas", () => {
  const { calcularRankingObrasLocais } = loadApplicationModule("app/em-alta/lib/em-alta-local-ranking-utils.ts", { "../../../lib/utils": utils });
  const lista = calcularRankingObrasLocais([obra(), obra(), obra("outra", { titulo: "obra" })], {}, {});
  assert.deepEqual(lista.map(item => item.storageId), ["obra", "outra"]);
});

test("coleção remota vazia confirmada não ressuscita favorito removido pelo cache", async () => {
  const escritas = [];
  const modulo = loadApplicationModule("app/em-alta/lib/em-alta-ranking-collections-loader.ts", {
    "./em-alta-collection-supabase-sync": { aguardarColecoesEmAlta: async () => {}, obterVersaoColecoesEmAlta: () => 0 },
    "./em-alta-collection-supabase-loader": { carregarIdsColecaoUsuarioSupabaseEmAlta: async () => [] },
    "./em-alta-local-storage-utils": { FAVORITES_STORAGE_KEY: "favoritos", COMPLETED_STORAGE_KEY: "concluidas", carregarListaIdsLocalEmAlta: () => ["antiga"], salvarListaIdsLocalEmAlta: (...args) => escritas.push(args) },
    "../../../lib/utils": utils,
  });
  assert.deepEqual((await modulo.carregarColecoesRankingEmAlta("A")).obrasFavoritasNormalizadas, []);
});

test("erro de persistência não é sucesso nem autoriza insert após falha de delete", async () => {
  const chamadas = [];
  const supabase = { auth: { getUser: async () => ({ data: { user: { id: "A" } }, error: null }) },
    from: () => ({ delete() { chamadas.push("delete"); return this; }, eq() { return this; },
      then(resolve) { resolve({ error: { message: "falhou" } }); },
      async insert() { chamadas.push("insert"); return { error: { message: "falhou" } }; },
      upsert() { chamadas.push("upsert"); return { select: () => ({ maybeSingle: async () => ({ error: { message: "falhou" } }) }) }; },
    }),
  };
  const modulo = loadApplicationModule("app/em-alta/lib/em-alta-collection-supabase-sync.ts", { "../../../lib/supabase/client": { supabase }, "../../../lib/utils": utils });
  const resultado = await modulo.sincronizarColecaoRankingSupabase("favoritos", { storageId: "obra", titulo: "Obra" }, true, "A");
  assert.equal(resultado?.ok, false);
  assert.ok(!chamadas.includes("insert"));
});

function hooks(t) {
  const slots = [], efeitos = [];
  let indice = 0, pendentes = [];
  const react = {
    useRef(inicial) { const i=indice++; return slots[i] ??= { current: inicial }; },
    useState(inicial) {
      const i=indice++;
      if (!slots[i]) { const slot={ valor: typeof inicial === "function" ? inicial() : inicial }; slot.set=novo => { slot.valor=typeof novo === "function" ? novo(slot.valor) : novo; }; slots[i]=slot; }
      return [slots[i].valor, slots[i].set];
    },
    useMemo(callback, deps) { const i=indice++; if (!slots[i] || deps.some((v,j)=>!Object.is(v,slots[i].deps[j]))) slots[i]={ deps, valor: callback() }; return slots[i].valor; },
    useEffect(callback, deps) { const i=indice++; if (!efeitos[i] || !deps || deps.some((v,j)=>!Object.is(v,efeitos[i].deps[j]))) pendentes.push(()=>{ efeitos[i]?.cleanup?.(); efeitos[i]={ deps, cleanup: callback() }; }); },
    useLayoutEffect(callback, deps) { react.useEffect(callback,deps); },
  };
  function desmontar() { for (const efeito of efeitos) efeito?.cleanup?.(); efeitos.length=0; }
  t.after(desmontar);
  return { react, desmontar, render(callback) { indice=0;pendentes=[];const retorno=callback();for(const efeito of pendentes) efeito();return retorno; } };
}

function loader(t) {
  const runtime=hooks(t), cargas=[], estado={}, ref={ current:{ usuarioId:"A",versao:1,carregada:true } };
  const setters=Object.fromEntries(["CarregandoRanking","ObrasLocais","ObrasFavoritas","ObrasConcluidas","VisualizacoesRegistradas","AvaliacoesLocaisRegistradas"].map(nome=>["set"+nome,valor=>{estado[nome]=valor;}]));
  let colecoes, versaoColecoes=0;
  const modulo=loadApplicationModule("app/em-alta/hooks/use-em-alta-ranking-loader.ts", {
    react:runtime.react,
    "../lib/em-alta-ranking-collections-loader": { carregarColecoesRankingEmAlta(id, atual) { colecoes=adiar(); cargas.push({id,atual,colecoes});return colecoes.promise; } },
    "../lib/em-alta-ranking-local-interactions":{carregarInteracoesLocaisRankingEmAlta:id=>({visualizacoesNormalizadas:{[id]:1},avaliacoesLocaisNormalizadas:{}})},
    "../lib/em-alta-supabase-works-loader":{carregarObrasSupabasePublicadas:(_obras,_id,opcoes)=>{const obras=adiar();cargas.at(-1).obras=obras;cargas.at(-1).opcoes=opcoes;return obras.promise;}},
    "../lib/em-alta-collection-supabase-sync":{obterVersaoColecoesEmAlta:()=>versaoColecoes},
  });
  return {estado,cargas,ref,desmontar:runtime.desmontar,
    render(carregada=true) { return runtime.render(()=>modulo.useEmAltaRankingLoader({usuarioLogadoId:ref.current.usuarioId,versaoIdentidade:ref.current.versao,autenticacaoCarregada:carregada,identidadeSessaoRef:ref,...setters})); },
    trocar(id) {ref.current={usuarioId:id,versao:ref.current.versao+1,carregada:true};},
    alterarColecoes(){versaoColecoes++;},
    confirmar(indice, extra={}) { const c=cargas[indice];c.colecoes.resolve({obrasFavoritasNormalizadas:[c.id],obrasConcluidasNormalizadas:[],versao:0,falhaTemporaria:false,...extra});c.obras.resolve([obra(c.id)]); },
  };
}

test("loader espera identificação e encerra sucesso sem timers atrasados",async t=>{
  const c=loader(t);
  c.render(false);assert.equal(c.cargas.length,0);
  assert.equal(c.render().dadosDaIdentidadeAtual,false);
  c.confirmar(0);await tick();
  assert.equal(c.estado.CarregandoRanking,false);
  assert.equal(c.render().dadosDaIdentidadeAtual,true);
  assert.deepEqual(c.estado.ObrasFavoritas,["A"]);
});

test("troca de identidade e ABA descartam resposta, cache e finally antigos",async t=>{
  const c=loader(t);c.render();
  c.trocar("B");assert.equal(c.render().dadosDaIdentidadeAtual,false);
  assert.deepEqual(c.estado.ObrasFavoritas,[]);
  c.confirmar(1);await tick();
  c.confirmar(0);await tick();
  assert.equal(c.estado.ObrasLocais[0].id,"B");
  c.trocar("A");c.render();c.trocar("B");c.render();
  c.confirmar(3);await tick();c.confirmar(2);await tick();
  assert.equal(c.estado.ObrasLocais[0].id,"B");
  assert.equal(c.estado.CarregandoRanking,false);
});

test("falha remota não mantém classificação antiga; erro encerra loading e retry recupera",async t=>{
  const c=loader(t);c.render();c.confirmar(0);await tick();
  c.render().tentarCarregarRanking();c.render();
  c.cargas[1].colecoes.resolve({obrasFavoritasNormalizadas:["A"],obrasConcluidasNormalizadas:[],versao:0});
  c.cargas[1].obras.reject(new Error("offline"));await tick();
  assert.equal(c.estado.CarregandoRanking,false);
  assert.deepEqual(c.estado.ObrasLocais,[]);
  assert.equal(c.render().erroRanking,true);
  c.render().tentarCarregarRanking();c.render();c.confirmar(2);await tick();
  assert.equal(c.render().erroRanking,false);
});

test("falha isolada de coleções não impede ranking público nem mantém coleções de outra conta",async t=>{
  const c=loader(t);c.render();c.cargas[0].colecoes.reject(new Error("coleções"));c.cargas[0].obras.resolve([obra()]);await tick();
  assert.equal(c.estado.ObrasLocais.length,1);
  assert.deepEqual(c.estado.ObrasFavoritas,[]);
  assert.equal(c.render().erroRanking,true);
  assert.equal(c.estado.CarregandoRanking,false);
});

test("resposta de coleção anterior a uma mutação não substitui favorito confirmado",async t=>{
  const c=loader(t);c.render();c.alterarColecoes();c.estado.ObrasFavoritas=["nova"];
  c.confirmar(0);await tick();
  assert.deepEqual(c.estado.ObrasFavoritas,["nova"]);
});

test("unmount impede resultado e encerramento de loading antigos",async t=>{
  const c=loader(t);c.render();c.desmontar();const antes=structuredClone(c.estado);
  c.confirmar(0);await tick();assert.deepEqual(c.estado,antes);
});

test("derivação recompõe todas as ordenações ao mudar métricas e filtros de publicação/18+",t=>{
  const runtime=hooks(t);
  const modulo=loadApplicationModule("app/em-alta/hooks/use-em-alta-ranking-derived-data.ts",{react:runtime.react,"../../../lib/utils":utils});
  let obras=[obra("a",{totalViewsRanking:2}),obra("b",{totalViewsRanking:9})];
  const render=()=>runtime.render(()=>modulo.useEmAltaRankingDerivedData({obrasLocais:obras,avaliacoesLocaisRegistradas:{},visualizacoesRegistradas:{}}));
  assert.equal(render().rankingMaisLidas[0].storageId,"b");
  obras=[obra("a",{totalViewsRanking:20}),obra("b",{classificacaoIndicativa:"18+"})];
  assert.deepEqual(render().ranking.map(o=>o.storageId),["a"]);
  obras=[obra("a",{publicado:false}),obra("b",{totalViewsRanking:1})];
  assert.deepEqual(render().rankingGeral.map(o=>o.storageId),["b"]);
  assert.equal(render().rankingAutores[0].obras,1);
});

test("duplicatas com restrições conflitantes não exibem versão pública antiga",()=>{
  const modulo=loadApplicationModule("app/em-alta/lib/em-alta-local-ranking-utils.ts",{"../../../lib/utils":utils});
  for(const restrita of [{publicado:false},{classificacaoIndicativa:"18+"}]) {
    assert.deepEqual(modulo.calcularRankingObrasLocais([obra(),obra("obra",restrita)],{},{}),[]);
    assert.deepEqual(modulo.calcularRankingObrasLocais([obra("obra",restrita),obra()],{},{}),[]);
  }
});

function auth(t) {
  const runtime=hooks(t),resposta=adiar(),estado={},callbacks=[],respostas=[resposta.promise];
  let user={id:"A"};
  const modulo=loadApplicationModule("app/em-alta/hooks/use-em-alta-auth-session.ts",{react:runtime.react,"../../../lib/supabase/client":{supabase:{auth:{
    getUser:()=>respostas.shift()??Promise.resolve({data:{user:null},error:null}),
    onAuthStateChange(callback){callbacks.push(callback);return{data:{subscription:{unsubscribe(){callbacks.splice(callbacks.indexOf(callback),1);}}}};},
  }}}});
  const props={setUsuarioLogado:valor=>{estado.logado=valor;},setUsuarioLogadoId:valor=>{estado.id=valor;}};
  return {estado,resposta,callbacks,desmontar:runtime.desmontar,
    render:()=>runtime.render(()=>modulo.useEmAltaAuthSession(props)),
    proximaResposta(){const nova=adiar();respostas.push(nova.promise);return nova;},
    evento(id,tipo="SIGNED_IN"){user=id?{id}:null;for(const callback of [...callbacks])callback(tipo,user?{user}:null);},
  };
}

test("evento de conta nova prevalece sobre getUser atrasado e refresh não muda versão",async t=>{
  const c=auth(t);c.render();c.evento("B");const acesso=c.render();const versao=acesso.versaoIdentidade;
  c.resposta.resolve({data:{user:{id:"A"}},error:null});await tick();
  assert.equal(c.estado.id,"B");c.evento("B");assert.equal(c.render().versaoIdentidade,versao);
  c.evento("");assert.equal(c.estado.logado,false);assert.equal(acesso.identidadeSessaoRef.current.usuarioId,"");
  c.desmontar();assert.equal(c.callbacks.length,0);
});

function acoes(t,{usuarioId="A",verificar=async()=>true}={}) {
  const runtime=hooks(t), escritas=[],cache=[],diario=[],avisos=[],ref={current:{usuarioId,versao:1,carregada:true}};
  let favoritas=[],concluidas=[];
  const modulo=loadApplicationModule("app/em-alta/hooks/use-em-alta-ranking-collection-actions.ts",{
    react:runtime.react,"../../../lib/utils":utils,
    "../lib/em-alta-collection-supabase-sync":{sincronizarColecaoRankingSupabase(...args){const resposta=adiar();escritas.push({args,resposta});return resposta.promise;}},
    "../lib/em-alta-local-storage-utils":{FAVORITES_STORAGE_KEY:"favoritos",COMPLETED_STORAGE_KEY:"concluidas",salvarListaIdsLocalEmAlta:(...args)=>cache.push(args)},
    "../lib/em-alta-diary-activity":{registrarColecaoRankingNoDiario:(...args)=>diario.push(args)},
  });
  const setters={setObrasFavoritas:lista=>{favoritas=lista;},setObrasConcluidas:lista=>{concluidas=lista;}};
  const item={storageId:"obra",id:"local-obra",titulo:"Obra",href:"/obra/obra"};
  return {escritas,cache,diario,avisos,ref,desmontar:runtime.desmontar,
    get favoritas(){return favoritas;},get concluidas(){return concluidas;},
    render(){return runtime.render(()=>modulo.useEmAltaRankingCollectionActions({ranking:[item],obrasFavoritas:favoritas,obrasConcluidas:concluidas,usuarioLogadoId:ref.current.usuarioId,identidadeSessaoRef:ref,usuarioTemSessaoAtiva:verificar,avisarLoginRanking(){avisos.push("login");},...setters}));},
    trocar(id){ref.current={usuarioId:id,versao:ref.current.versao+1,carregada:true};},
  };
}

test("favoritar/desfavoritar rápido compõe intenções e ordena gravações sem duplicar Diário",async t=>{
  const c=acoes(t),acao=c.render();
  const a=acao.alternarFavorito("obra"), b=acao.alternarFavorito("obra");await tick();
  assert.equal(c.escritas.length,1);assert.equal(c.escritas[0].args[2],true);
  assert.deepEqual(c.favoritas,[]);assert.equal(c.render().salvandoColecao,true);
  c.escritas[0].resposta.resolve({ok:true});await a;await tick();
  assert.deepEqual(c.favoritas,["obra"]);assert.equal(c.escritas[1].args[2],false);
  c.escritas[1].resposta.resolve({ok:true});await b;
  assert.deepEqual(c.favoritas,[]);assert.equal(c.diario.length,1);assert.equal(c.render().salvandoColecao,false);
});

test("falha de favorito não altera cache nem Diário; ação seguinte recupera",async t=>{
  const c=acoes(t);const a=c.render().alternarFavorito("obra");await tick();
  c.escritas[0].resposta.resolve({ok:false,erro:"offline"});await a;
  assert.deepEqual(c.favoritas,[]);assert.equal(c.cache.length,0);assert.equal(c.diario.length,0);
  assert.match(c.render().mensagemColecao,/Não foi possível/);assert.equal(c.render().salvandoColecao,false);
  const b=c.render().alternarFavorito("obra");await tick();c.escritas[1].resposta.resolve({ok:true});await b;
  assert.deepEqual(c.favoritas,["obra"]);assert.equal(c.render().mensagemColecao,"");
});

test("coleções independentes encerram loading depois da última resposta e preservam confirmação",async t=>{
  const c=acoes(t), acao=c.render();const a=acao.alternarFavorito("obra"),b=acao.alternarConcluido("obra");await tick();
  c.escritas[1].resposta.resolve({ok:true});await b;
  assert.deepEqual(c.concluidas,["obra"]);assert.equal(c.render().salvandoColecao,true);
  c.escritas[0].resposta.resolve({ok:false});await a;
  assert.deepEqual(c.concluidas,["obra"]);assert.equal(c.render().salvandoColecao,false);
});

test("troca de conta ou unmount descarta resultado e trabalho ainda na fila",async t=>{
  const c=acoes(t),acao=c.render();const a=acao.alternarFavorito("obra"),b=acao.alternarFavorito("obra");await tick();
  c.trocar("B");c.render();c.escritas[0].resposta.resolve({ok:true});await Promise.all([a,b]);
  assert.equal(c.escritas.length,1);assert.equal(c.cache.length,0);assert.equal(c.diario.length,0);
  assert.equal(c.escritas[0].args[4](),false);
  const nova=c.render().alternarConcluido("obra");await tick();c.desmontar();c.escritas[1].resposta.resolve({ok:true});await nova;
  assert.equal(c.cache.length,0);
});

test("obra ausente do ranking não cria favorito fantasma",async t=>{
  const c=acoes(t);await c.render().alternarFavorito("inexistente");assert.equal(c.escritas.length,0);assert.equal(c.cache.length,0);
});

function sincronizacao() {
  const linhas=new Map(),chamadas=[];
  let usuario="A",erro=null,pausa=null;
  const supabase={auth:{getUser:async()=>({data:{user:{id:usuario}},error:null})},from(tabela){
    let operacao="select",payload=null;const filtros={};
    const builder={
      upsert(valor,opcoes){operacao="upsert";payload=valor;chamadas.push({tabela,operacao,valor,opcoes});return this;},
      delete(){operacao="delete";chamadas.push({tabela,operacao});return this;},
      select(){return this;},eq(campo,valor){filtros[campo]=valor;return this;},
      async executar(){
        if(pausa)await pausa.promise;
        if(erro)return{error:{message:erro},data:null};
        const chave=`${tabela}:${payload?.user_id||filtros.user_id}:${payload?.obra_id||filtros.obra_id}`;
        if(operacao==="delete"){linhas.delete(chave);return{error:null};}
        if(operacao==="upsert"){
          if(linhas.has(chave))return{data:null,error:null};
          linhas.set(chave,payload);return{data:payload,error:null};
        }
        return{data:linhas.get(chave)||null,error:null};
      },
      maybeSingle(){return this.executar();},then(resolve,reject){return this.executar().then(resolve,reject);},
    };return builder;
  }};
  const modulo=loadApplicationModule("app/em-alta/lib/em-alta-collection-supabase-sync.ts",{"../../../lib/utils":utils,"../../../lib/supabase/client":{supabase}});
  return {...modulo,linhas,chamadas,mudarUsuario:id=>{usuario=id;},falhar:valor=>{erro=valor;},pausar(){pausa=adiar();return pausa;}};
}

test("inclusão idempotente preserva visibilidade privada e nunca remove antes de inserir",async()=>{
  const c=sincronizacao();c.linhas.set("favoritos:A:obra",{user_id:"A",obra_id:"obra",visibilidade:"somente_eu"});
  assert.equal((await c.sincronizarColecaoRankingSupabase("favoritos",{storageId:"obra"},true,"A")).ok,true);
  assert.equal(c.linhas.get("favoritos:A:obra").visibilidade,"somente_eu");
  assert.deepEqual(c.chamadas[0].opcoes,{onConflict:"user_id,obra_id",ignoreDuplicates:true});
  assert.ok(!c.chamadas.some(c=>c.operacao==="delete"));
});

test("gravação falha preserva favorito confirmado e não regrava sem visibilidade",async()=>{
  const c=sincronizacao();c.linhas.set("favoritos:A:obra",{obra_id:"obra",visibilidade:"somente_eu"});c.falhar("offline");
  assert.equal((await c.sincronizarColecaoRankingSupabase("favoritos",{storageId:"obra"},true,"A")).ok,false);
  assert.equal(c.chamadas.length,1);assert.ok(c.linhas.has("favoritos:A:obra"));
});

test("operações concorrentes da mesma obra são serializadas e não migram para outra conta",async()=>{
  const c=sincronizacao(),pausa=c.pausar();const a=c.sincronizarColecaoRankingSupabase("favoritos",{storageId:"obra"},true,"A");
  const b=c.sincronizarColecaoRankingSupabase("favoritos",{storageId:"obra"},false,"A");await tick();assert.equal(c.chamadas.length,1);
  c.mudarUsuario("B");pausa.resolve();await a;
  assert.equal((await b).ok,false);assert.equal(c.chamadas.length,1);
});

function colecoes({favoritos=[],concluidas=[],falharFavoritos=false,atual=()=>true}={}){
  const cache=[],versao={valor:0},resposta=adiar();
  const modulo=loadApplicationModule("app/em-alta/lib/em-alta-ranking-collections-loader.ts",{
    "./em-alta-collection-supabase-loader":{carregarIdsColecaoUsuarioSupabaseEmAlta:async tabela=>{await resposta.promise;if(tabela==="favoritos"&&falharFavoritos)throw new Error("offline");return tabela==="favoritos"?favoritos:concluidas;}},
    "./em-alta-collection-supabase-sync":{aguardarColecoesEmAlta:async()=>{},obterVersaoColecoesEmAlta:()=>versao.valor},
    "./em-alta-local-storage-utils":{FAVORITES_STORAGE_KEY:"favoritos",COMPLETED_STORAGE_KEY:"concluidas",carregarListaIdsLocalEmAlta:()=>["local"],salvarListaIdsLocalEmAlta:(...args)=>cache.push(args)},
    "../../../lib/utils":utils,
  });
  return{cache,versao,resposta,tarefa:modulo.carregarColecoesRankingEmAlta("A",atual)};
}

test("falha parcial mantém cache somente da coleção afetada, sem tratá-lo como remoto vazio",async()=>{
  const c=colecoes({falharFavoritos:true,concluidas:["certa","certa"]});c.resposta.resolve();const dados=await c.tarefa;
  assert.deepEqual(dados.obrasFavoritasNormalizadas,["local"]);assert.deepEqual(dados.obrasConcluidasNormalizadas,["certa"]);
  assert.equal(dados.falhaTemporaria,true);assert.equal(c.cache.length,1);assert.equal(c.cache[0][0],"concluidas");
});

test("leitura antiga após mutação ou cancelamento não reescreve cache",async()=>{
  for(const cancelar of [false,true]){
    const c=colecoes({atual:()=>!cancelar});await tick();c.versao.valor++;c.resposta.resolve();
    assert.equal((await c.tarefa).obsoletas,true);assert.equal(c.cache.length,0);
  }
});

test("ausência de usuário, obra ou ID inválido não grava coleções",async()=>{
  const c=sincronizacao();
  for(const [item,id] of [[null,"A"],[{storageId:"inválida"},"A"],[{storageId:"obra"},""]]) {
    assert.equal((await c.sincronizarColecaoRankingSupabase("favoritos",item,true,id)).ok,false);
  }
  assert.equal(c.chamadas.length,0);
});

test("uma interação local inválida não apaga outra válida nem interfere no ranking remoto",t=>{
  const antes=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
  globalThis.localStorage={getItem:chave=>chave.includes("visualizacoes")?"{inválido":JSON.stringify({obra:4})};
  t.after(()=>{if(antes)Object.defineProperty(globalThis,"localStorage",antes);else delete globalThis.localStorage;});
  const modulo=loadApplicationModule("app/em-alta/lib/em-alta-ranking-local-interactions.ts",{"../../../lib/utils":utils});
  const dados=modulo.carregarInteracoesLocaisRankingEmAlta("A");
  assert.deepEqual(dados.visualizacoesNormalizadas,{});assert.deepEqual(dados.avaliacoesLocaisNormalizadas,{obra:4});
});

test("ranking preserva pesos, todos os tops e desempates sem mutar os dados de entrada",t=>{
  const runtime=hooks(t);
  const modulo=loadApplicationModule("app/em-alta/hooks/use-em-alta-ranking-derived-data.ts",{react:runtime.react,"../../../lib/utils":utils});
  const obras=[obra("a",{totalCurtidasRanking:2,totalComentariosRanking:3,totalSalvosRanking:4,totalViewsRanking:5}),obra("b",{totalViewsRanking:40})];
  const antes=structuredClone(obras);
  const dados=runtime.render(()=>modulo.useEmAltaRankingDerivedData({obrasLocais:obras,avaliacoesLocaisRegistradas:{},visualizacoesRegistradas:{}}));
  assert.equal(dados.ranking[0].pontuacao,34);
  assert.equal(dados.rankingGeral[0].storageId,"b");
  assert.equal(dados.rankingMaisCurtidas[0].storageId,"a");
  assert.equal(dados.rankingMaisSalvas[0].storageId,"a");
  assert.deepEqual(obras,antes);
});

test("SIGNED_OUT invalida revalidação atrasada mesmo quando a página já mostrava visitante",async t=>{
  const c=auth(t);c.render();c.resposta.resolve({data:{user:null},error:null});await tick();
  const acesso=c.render(),versao=acesso.versaoIdentidade,nova=c.proximaResposta();
  const pendente=acesso.usuarioTemSessaoAtiva();c.evento("","SIGNED_OUT");
  nova.resolve({data:{user:{id:"A"}},error:null});assert.equal(await pendente,false);
  assert.equal(c.estado.id,"");assert.equal(c.render().versaoIdentidade,versao);
});

for(const desktop of [false,true]) {
  test(`feedback de ranking e coleção é acessível sem anunciar vazio confirmado (${desktop?"desktop":"mobile"})`,()=>{
    let erroRanking=true;
    const {default:Pagina}=loadApplicationModule("app/em-alta/page.tsx",{
      react:{useState:inicial=>[inicial===true?false:inicial,()=>{}]},
      "next/navigation":{useRouter:()=>({})},"../../lib/historietasTheme":{useHistorietasTheme:()=>({pageThemeStyle:{}})},
      "./hooks/use-em-alta-auth-session":{useEmAltaAuthSession:()=>({})},
      "./hooks/use-em-alta-desktop-mode":{useEmAltaDesktopMode:()=>desktop},
      "./hooks/use-em-alta-ranking-loader":{useEmAltaRankingLoader:()=>({erroRanking,dadosDaIdentidadeAtual:true,tentarCarregarRanking(){}})},
      "./hooks/use-em-alta-ranking-derived-data":{useEmAltaRankingDerivedData:()=>({ranking:[],rankingTemAtividadeReal:false})},
      "./hooks/use-em-alta-ranking-collection-actions":{useEmAltaRankingCollectionActions:()=>({mensagemColecao:"Não foi possível confirmar a alteração da coleção. Tente novamente.",salvandoColecao:true})},
      "./components/em-alta-ranking-content":{EmAltaRankingContent:()=>React.createElement("section",null,"CATÁLOGO VAZIO")},
      "./components/em-alta-header":{EmAltaHeader:()=>null},"./components/em-alta-page-decorations":{EmAltaPageDecorations:()=>null},
      "./components/em-alta-page-shell":{EmAltaPageShell:({children})=>React.createElement("main",null,children)},
    });
    const render=()=>renderToStaticMarkup(React.createElement(Pagina));
    assert.match(render(),/role="alert"/);assert.match(render(),/role="status"/);assert.match(render(),/<button type="button"/);
    assert.ok(!render().includes("CATÁLOGO VAZIO"));
    erroRanking=false;assert.ok(render().includes("CATÁLOGO VAZIO"));
  });
}

test("novas mensagens preservam tradução PT/EN/ES pelo bridge existente",()=>{
  const {traduzirTextoEmAlta}=loadApplicationModule("app/em-alta/lib/em-alta-translations.ts");
  for(const texto of ["Não foi possível atualizar todos os dados do Em Alta.","Tentar novamente","Salvando coleção…","Não foi possível confirmar a alteração da coleção. Tente novamente."]) {
    assert.equal(traduzirTextoEmAlta(texto,"pt-BR"),texto);
    assert.notEqual(traduzirTextoEmAlta(texto,"en"),texto);assert.notEqual(traduzirTextoEmAlta(texto,"es"),texto);
  }
});

test("amostra limitada por falha do catálogo conserva resultados com aviso explícito",async t=>{
  const c=loader(t);c.render();c.cargas[0].opcoes.aoUsarAmostraLimitada();c.confirmar(0);await tick();
  assert.equal(c.estado.ObrasLocais.length,1);assert.equal(c.render().erroRanking,true);assert.equal(c.estado.CarregandoRanking,false);
});

test("visitante continua sendo encaminhado ao login antes de qualquer alteração pessoal",async t=>{
  const c=acoes(t,{usuarioId:"",verificar:async()=>false}),acao=c.render();
  await acao.alternarFavorito("obra");await acao.alternarConcluido("obra");
  assert.deepEqual(c.avisos,["login","login"]);assert.equal(c.escritas.length,0);assert.equal(c.cache.length,0);
});

test("identificação inicial bem-sucedida habilita carga uma vez",async t=>{
  const c=auth(t);assert.equal(c.render().autenticacaoCarregada,false);
  c.resposta.resolve({data:{user:{id:"A"}},error:null});await tick();
  assert.equal(c.estado.id,"A");assert.equal(c.estado.logado,true);assert.equal(c.render().autenticacaoCarregada,true);
});

test("falha de identificação libera ranking público sem assumir conta antiga",async t=>{
  const c=auth(t);c.render();c.resposta.reject(new Error("offline"));await tick();
  assert.equal(c.estado.id,"");assert.equal(c.estado.logado,false);assert.equal(c.render().autenticacaoCarregada,true);
});

test("remoção confirmada usa a conta e obra esperadas; falha anterior não bloqueia a fila",async()=>{
  const c=sincronizacao();c.linhas.set("concluidas:A:obra",{obra_id:"obra",visibilidade:"somente_eu"});
  c.falhar("offline");assert.equal((await c.sincronizarColecaoRankingSupabase("concluidas",{storageId:"obra"},false,"A")).ok,false);
  assert.ok(c.linhas.has("concluidas:A:obra"));
  c.falhar(null);assert.equal((await c.sincronizarColecaoRankingSupabase("concluidas",{storageId:"obra"},false,"A")).ok,true);
  assert.equal(c.linhas.has("concluidas:A:obra"),false);assert.ok(c.chamadas.every(chamada=>chamada.operacao==="delete"));
});
