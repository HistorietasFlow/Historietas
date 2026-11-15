import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function adiar(){let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};}
function hooks(t){
  const slots=[],efeitos=[];let indice=0,pendentes=[];
  const react={
    useRef(valor){const i=indice++;return slots[i]??={current:valor};},
    useState(inicial){const i=indice++;if(!slots[i]){const slot={valor:typeof inicial==="function"?inicial():inicial};slot.set=novo=>{slot.valor=typeof novo==="function"?novo(slot.valor):novo;};slots[i]=slot;}return[slots[i].valor,slots[i].set];},
    useCallback(callback,deps){const i=indice++;if(!slots[i]||deps.some((d,j)=>!Object.is(d,slots[i].deps[j])))slots[i]={valor:callback,deps};return slots[i].valor;},
    useEffect(callback,deps){const i=indice++;if(!efeitos[i]||!deps||deps.some((d,j)=>!Object.is(d,efeitos[i].deps[j])))pendentes.push(()=>{efeitos[i]?.cleanup?.();efeitos[i]={deps,cleanup:callback()};});},
    useLayoutEffect(callback,deps){react.useEffect(callback,deps);},
  };
  function desmontar(){for(const efeito of efeitos)efeito?.cleanup?.();efeitos.length=0;}
  t.after(desmontar);
  return{react,desmontar,render(callback,executarEfeitos=true){indice=0;pendentes=[];const retorno=callback();if(executarEfeitos)for(const efeito of pendentes)efeito();return retorno;}};
}
const ticket=(id="c1",extra={})=>({id,userId:"leitor",emailContato:"",categoria:"leitura",titulo:id,descricao:"",paginaUrl:"",navegador:"",dispositivo:"",status:"aberto",prioridade:"normal",observacaoAdmin:"",analisadoPor:"",analisadoEm:"",criadoEm:"v0",atualizadoEm:"v1",...extra});
const linha=(id="c1",extra={})=>({id,user_id:"leitor",status:"em_analise",prioridade:"normal",observacao_admin:"",analisado_por:"A",analisado_em:"v2",atualizado_em:"v2",...extra});
function contexto(usuarioId="A",registros=[ticket()]){return{usuarioId,ehAdmin:true,ativo:true,geracao:1,leitura:0,revisao:0,registros:new Map(registros.map(item=>[item.id,item])),fila:Promise.resolve(),pendentes:new Map(),ultimaChave:""};}
function acoes(t){
  const runtime=hooks(t),chamadas=[],contextoRef={current:contexto()};
  let usuarioId="A",ehAdmin=true;
  const estado={problemas:[ticket()],observacoes:{c1:""},acaoEmAndamento:"",erro:"",sucesso:""};
  const setters=Object.fromEntries(["Problemas","Observacoes","AcaoEmAndamento","Erro","Sucesso"].map(nome=>{const chave=nome[0].toLowerCase()+nome.slice(1);return["set"+nome,valor=>{estado[chave]=typeof valor==="function"?valor(estado[chave]):valor;}];}));
  const modulo=loadApplicationModule("app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-actions.ts",{react:runtime.react,
    "../actions/atualizar-problema-tecnico-admin":{atualizarProblemaTecnicoAdmin(args){const resposta=adiar();chamadas.push({args,resposta});return resposta.promise;}},
  });
  return{estado,chamadas,contextoRef,desmontar:runtime.desmontar,
    render(){return runtime.render(()=>modulo.useAdminProblemasTecnicosActions({usuarioId,ehAdmin,t:texto=>texto.pt,contextoRef,...setters}));},
    trocar(id,admin=true){usuarioId=id;ehAdmin=admin;contextoRef.current.ativo=false;contextoRef.current=contexto(id,[ticket()]);contextoRef.current.ehAdmin=admin;},
  };
}

test("cliques repetidos não enviam duas mutações nem geram duas confirmações",async t=>{
  const c=acoes(t),acao=c.render();const a=acao.atualizarChamado(ticket(),{status:"em_analise"},"Atualizado");const b=acao.atualizarChamado(ticket(),{status:"em_analise"},"Atualizado");
  await tick();assert.equal(c.chamadas.length,1);
  c.chamadas[0].resposta.resolve({data:linha(),error:null});await Promise.all([a,b]);assert.equal(c.estado.sucesso,"Atualizado");
});

test("representação de outro registro não confirma nem altera o chamado solicitado",async t=>{
  const c=acoes(t);const tarefa=c.render().atualizarChamado(ticket(),{status:"em_analise"},"Atualizado");await tick();
  c.chamadas[0].resposta.resolve({data:linha("outro"),error:null});await tarefa;
  assert.equal(c.estado.sucesso,"");assert.equal(c.estado.problemas[0].status,"aberto");assert.ok(c.estado.erro);
});

test("status e prioridade simultâneos usam versões confirmadas em sequência e preservam histórico",async t=>{
  const c=acoes(t),acao=c.render();
  const a=acao.atualizarChamado(ticket(),{status:"em_analise"},"Status");
  const b=acao.atualizarChamado(ticket(),{prioridade:"alta"},"Prioridade");
  await tick();assert.equal(c.chamadas.length,1);assert.equal(c.chamadas[0].args.atualizadoEmEsperado,"v1");
  c.chamadas[0].resposta.resolve({data:linha(),error:null});await tick();
  assert.equal(c.chamadas.length,2);assert.equal(c.chamadas[1].args.atualizadoEmEsperado,"v2");
  assert.deepEqual(c.chamadas[1].args.payload,{prioridade:"alta"});
  c.chamadas[1].resposta.resolve({data:linha("c1",{prioridade:"alta",analisado_por:"A",analisado_em:"v3",atualizado_em:"v3"}),error:null});
  await Promise.all([a,b]);assert.equal(c.estado.problemas[0].status,"em_analise");assert.equal(c.estado.problemas[0].prioridade,"alta");
  assert.equal(c.estado.problemas[0].analisadoEm,"v3");assert.equal(c.estado.sucesso,"Prioridade");assert.equal(c.estado.acaoEmAndamento,"");
});

for(const [nome,retorno] of [
  ["registro excluído",{data:null,error:null}],
  ["falha remota",{data:null,error:new Error("offline")}],
  ["campo não confirmado",{data:linha("c1",{status:"aberto"}),error:null}],
])test(`${nome} não produz sucesso e permite nova tentativa`,async t=>{
  const c=acoes(t),acao=c.render();const a=acao.atualizarChamado(ticket(),{status:"em_analise"},"OK");await tick();
  c.chamadas[0].resposta.resolve(retorno);await a;
  assert.equal(c.estado.sucesso,"");assert.equal(c.estado.problemas[0].status,"aberto");assert.ok(c.estado.erro);assert.equal(c.estado.acaoEmAndamento,"");
  const b=acao.atualizarChamado(ticket(),{status:"em_analise"},"Recuperado");await tick();c.chamadas[1].resposta.resolve({data:linha(),error:null});await b;
  assert.equal(c.estado.erro,"");assert.equal(c.estado.sucesso,"Recuperado");
});

for(const [nome,retorno] of [["sucesso",{data:linha(),error:null}],["erro",{data:null,error:new Error("atrasado")}]] )
  test(`resposta antiga de ${nome} não altera outra sessão nem sua operação ativa`,async t=>{
    const c=acoes(t),antiga=c.render();const a=antiga.atualizarChamado(ticket(),{status:"em_analise"},"A");
    const enfileirada=antiga.atualizarChamado(ticket(),{prioridade:"alta"},"A2");await tick();
    c.trocar("B");const b=c.render().atualizarChamado(ticket(),{status:"em_analise"},"B");await tick();
    c.estado.sucesso="B anterior";c.chamadas[0].resposta.resolve(retorno);await Promise.all([a,enfileirada]);
    assert.equal(c.chamadas.length,2);assert.equal(c.estado.sucesso,"B anterior");assert.equal(c.estado.erro,"");assert.equal(c.estado.acaoEmAndamento,"c1");assert.equal(c.estado.problemas[0].status,"aberto");
    c.chamadas[1].resposta.resolve({data:linha("c1",{analisado_por:"B"}),error:null});await b;assert.equal(c.estado.sucesso,"B");
  });

test("A → B → A descarta operação da primeira sessão A",async t=>{
  const c=acoes(t),acao=c.render();const a=acao.atualizarChamado(ticket(),{status:"em_analise"},"Antigo");await tick();
  c.trocar("B");c.render();c.trocar("A");c.render();c.chamadas[0].resposta.resolve({data:linha(),error:null});await a;
  assert.equal(c.estado.sucesso,"");assert.equal(c.estado.problemas[0].status,"aberto");
});

test("negação administrativa, chamado ausente e desmontagem não mutam a interface",async t=>{
  const c=acoes(t);c.trocar("A",false);await c.render().atualizarChamado(ticket(),{status:"em_analise"},"OK");assert.equal(c.chamadas.length,0);assert.match(c.estado.erro,/Apenas administradores/);
  c.trocar("A");c.contextoRef.current.registros.clear();await c.render().atualizarChamado(ticket(),{status:"em_analise"},"OK");assert.equal(c.chamadas.length,0);assert.ok(c.estado.erro);
  c.trocar("A");const a=c.render().atualizarChamado(ticket(),{status:"em_analise"},"OK");await tick();c.desmontar();
  const antes=structuredClone(c.estado);c.chamadas[0].resposta.resolve({data:linha(),error:null});await a;assert.deepEqual(c.estado,antes);
});

test("rascunho de observação editado durante resposta é preservado",async t=>{
  const c=acoes(t),acao=c.render();c.estado.observacoes.c1="  salvar  ";const a=acao.atualizarChamado(ticket(),{observacaoAdmin:"  salvar  "},"Salvo");await tick();
  assert.deepEqual(c.chamadas[0].args.payload,{observacao_admin:"salvar"});c.estado.observacoes.c1="nova edição";
  c.chamadas[0].resposta.resolve({data:linha("c1",{status:"aberto",observacao_admin:"salvar"}),error:null});await a;
  assert.equal(c.estado.problemas[0].observacaoAdmin,"salvar");assert.equal(c.estado.observacoes.c1,"nova edição");
  await acao.atualizarChamado(ticket(),{observacaoAdmin:"salvar"},"Repetido");assert.equal(c.chamadas.length,1);
});

function dados(t,{adiarAdmin=false}={}){
  const runtime=hooks(t),leituras=[],perfis=[],admins=[],usuarios=[],feedback={erro:"",sucesso:"",acao:""},redirecionamentos=[];
  let listener,identidade="A",admin=true,unsubscribe=0;const verificacoes=[];
  const props={router:{replace:href=>redirecionamentos.push(href)},t:texto=>texto.pt,setErro:v=>{feedback.erro=v;},setSucesso:v=>{feedback.sucesso=v;},setAcaoEmAndamento:v=>{feedback.acao=v;}};
  const modulo=loadApplicationModule("app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-initial-data.ts",{
    react:runtime.react,
    "../../../../lib/supabase/client":{supabase:{auth:{getUser(){usuarios.push(identidade);return Promise.resolve({data:{user:identidade?{id:identidade}:null},error:null});},onAuthStateChange(callback){listener=callback;return{data:{subscription:{unsubscribe(){unsubscribe++;}}}};}}}},
    "../loaders/verificar-administrador-problemas-tecnicos":{verificarAdministradorProblemasTecnicos(){admins.push(identidade);if(adiarAdmin){const resposta=adiar();verificacoes.push(resposta);return resposta.promise;}return Promise.resolve(admin);}},
    "../loaders/buscar-problemas-tecnicos-admin":{buscarProblemasTecnicosAdmin(){const resposta=adiar();leituras.push(resposta);return resposta.promise;}},
    "../loaders/buscar-perfis-problemas-tecnicos-admin":{buscarPerfisProblemasTecnicosAdmin(ids){const resposta=adiar();perfis.push({ids,resposta});return resposta.promise;}},
  });
  return{leituras,perfis,admins,verificacoes,usuarios,feedback,redirecionamentos,desmontar:runtime.desmontar,get unsubscribe(){return unsubscribe;},
    render(executarEfeitos=true){return runtime.render(()=>modulo.useAdminProblemasTecnicosInitialData(props),executarEfeitos);},
    trocar(id,permitido=true,evento="SIGNED_IN"){identidade=id;admin=permitido;listener(evento,id?{user:{id}}:null);},
    async completar(indice=leituras.length-1,rows=[linha()]){leituras[indice].resolve({data:rows,error:null});await tick();const p=perfis.at(-1);if(p)p.resposta.resolve({porUserId:{data:[{id:"perfil",user_id:"leitor",nome:" Nome ",username:"user"}],error:null},porId:{data:[],error:null}});await tick();},
  };
}

test("carregamento confirma administrador, normaliza chamado e nomes antes de publicar",async t=>{
  const c=dados(t);c.render();await tick();assert.deepEqual(c.admins,["A"]);assert.equal(c.render().problemas.length,0);
  await c.completar(0,[linha("c1",{status:"inválido",prioridade:"inválida",categoria:"inválida"})]);const estado=c.render();
  assert.equal(estado.carregando,false);assert.equal(estado.usuarioId,"A");assert.equal(estado.ehAdmin,true);assert.equal(estado.problemas[0].status,"aberto");assert.equal(estado.problemas[0].prioridade,"normal");assert.equal(estado.problemas[0].categoria,"outro");
  assert.deepEqual(estado.nomesUsuarios,{leitor:"Nome",perfil:"Nome"});assert.equal(estado.contextoRef.current.registros.get("c1").atualizadoEm,"v2");
});

for(const fase of ["chamados","perfis"])test(`troca de administrador descarta ${fase} atrasados e limpa dados da conta anterior`,async t=>{
  const c=dados(t);c.render();await tick();if(fase==="perfis"){c.leituras[0].resolve({data:[linha("antigo")],error:null});await tick();}
  c.trocar("B");assert.deepEqual(c.render().problemas,[]);assert.deepEqual(c.render().observacoes,{});assert.equal(c.render().ehAdmin,false);await tick();
  if(fase==="chamados"){c.leituras[0].resolve({data:[linha("antigo")],error:null});await tick();assert.equal(c.perfis.length,0);}
  else{c.perfis[0].resposta.resolve({porUserId:{data:[{id:"antigo",nome:"Antigo"}],error:null},porId:{data:[],error:null}});await tick();}
  assert.deepEqual(c.render().problemas,[]);assert.deepEqual(c.render().nomesUsuarios,{});
  await c.completar(1,[linha("novo")]);assert.equal(c.render().usuarioId,"B");assert.equal(c.render().problemas[0].id,"novo");assert.equal(c.render().carregando,false);
});

test("recargas rápidas aplicam só a leitura mais recente",async t=>{
  const c=dados(t);c.render();await tick();await c.completar();const inicial=c.render();
  const a=inicial.carregarProblemas();await tick();const b=inicial.carregarProblemas();
  c.leituras[1].resolve({data:[linha("velho")],error:null});await tick();assert.equal(c.render().problemas[0].id,"c1");assert.equal(c.leituras.length,3);
  await c.completar(2,[linha("recente")]);await Promise.all([a,b]);assert.equal(c.render().problemas[0].id,"recente");
});

test("leitura iniciada antes de alteração não sobrescreve resultado da action real",async t=>{
  const c=dados(t);c.render();await tick();await c.completar();const estado=c.render();const leitura=estado.carregarProblemas();await tick();
  const runtime=hooks(t),resposta=adiar(),chamadas=[];
  const modulo=loadApplicationModule("app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-actions.ts",{react:runtime.react,"../actions/atualizar-problema-tecnico-admin":{atualizarProblemaTecnicoAdmin(args){chamadas.push(args);return resposta.promise;}}});
  const acao=runtime.render(()=>modulo.useAdminProblemasTecnicosActions({...estado,usuarioId:"A",ehAdmin:true,t:valor=>valor.pt,setAcaoEmAndamento:()=>{},setErro:()=>{},setSucesso:()=>{}}));
  const escrita=acao.atualizarChamado(estado.problemas[0],{status:"resolvido"},"OK");
  assert.equal(chamadas.length,0);c.leituras[1].resolve({data:[linha()],error:null});await leitura;await tick();
  assert.equal(chamadas.length,1);resposta.resolve({data:linha("c1",{status:"resolvido",atualizado_em:"v3"}),error:null});await escrita;
  assert.equal(c.render().problemas[0].status,"resolvido");assert.equal(c.render().problemas[0].atualizadoEm,"v3");
});

test("falha de carga recupera; acesso negado e sessão encerrada não carregam chamados",async t=>{
  const c=dados(t);c.render();await tick();c.leituras[0].resolve({data:null,error:new Error("offline")});await tick();assert.equal(c.render().carregando,false);assert.match(c.feedback.erro,/offline/);
  const a=c.render().carregarProblemas();await tick();await c.completar();await a;assert.equal(c.feedback.erro,"");assert.equal(c.render().problemas.length,1);
  c.trocar("B",false);await tick();assert.equal(c.render().ehAdmin,false);assert.deepEqual(c.render().problemas,[]);assert.equal(c.leituras.length,2);
  c.trocar("");await tick();assert.equal(c.render().carregando,false);assert.equal(c.redirecionamentos.length,1);assert.equal(c.leituras.length,2);
  c.desmontar();assert.equal(c.unsubscribe,1);
});

for(const fase of ["chamados","perfis"])test(`desmontagem cancela publicação de ${fase}`,async t=>{
  const c=dados(t);c.render();await tick();if(fase==="perfis"){c.leituras[0].resolve({data:[linha()],error:null});await tick();}
  const ref=c.render().contextoRef;c.desmontar();assert.equal(ref.current.ativo,false);
  if(fase==="chamados")c.leituras[0].resolve({data:[linha()],error:null});else c.perfis[0].resposta.resolve({porUserId:{data:[],error:null},porId:{data:[],error:null}});
  await tick();assert.deepEqual(c.render(false).problemas,[]);assert.deepEqual(c.render(false).nomesUsuarios,{});
});

function mutacao({identidade="A",erro=null,atual=()=>true,retorno={data:linha(),error:null}}={}){
  const chamadas=[],usuario=adiar();
  const query={update(payload){chamadas.push(["update",payload]);return this;},eq(...args){chamadas.push(["eq",...args]);return this;},select(campos){chamadas.push(["select",campos]);return this;},maybeSingle(){chamadas.push(["maybeSingle"]);return Promise.resolve(retorno);}};
  const modulo=loadApplicationModule("app/admin/problemas-tecnicos/actions/atualizar-problema-tecnico-admin.ts",{"../../../../lib/supabase/client":{supabase:{auth:{getUser(){return usuario.promise;}},from(tabela){chamadas.push(["from",tabela]);return query;}}}});
  const tarefa=modulo.atualizarProblemaTecnicoAdmin({id:"c1",payload:{status:"em_analise"},usuarioIdEsperado:"A",atualizadoEmEsperado:"v1",execucaoEstaAtual:atual});
  usuario.resolve({data:{user:identidade?{id:identidade}:null},error:erro});return{chamadas,tarefa};
}

test("mutation condiciona ID e versão sem alterar payload ou histórico",async()=>{
  const c=mutacao();await c.tarefa;assert.deepEqual(c.chamadas.slice(0,4),[["from","problemas_tecnicos"],["update",{status:"em_analise"}],["eq","id","c1"],["eq","atualizado_em","v1"]]);assert.equal(c.chamadas.at(-1)[0],"maybeSingle");
});
for(const identidade of ["B",""])test(`mutation recusa identidade divergente (${identidade || "sem sessão"})`,async()=>{const c=mutacao({identidade});assert.ok((await c.tarefa).error);assert.deepEqual(c.chamadas,[]);});
test("mutation revalida geração após getUser atrasado",async()=>{let ativo=true;const c=mutacao({atual:()=>ativo});ativo=false;assert.ok((await c.tarefa).error);assert.deepEqual(c.chamadas,[]);});
test("mutation preserva ausência de linha para conflito/exclusão e erro de autenticação",async()=>{const c=mutacao({retorno:{data:null,error:null}});assert.deepEqual(await c.tarefa,{data:null,error:null});const erro=mutacao({erro:new Error("sessão inválida")});assert.ok((await erro.tarefa).error);assert.deepEqual(erro.chamadas,[]);});

test("recarga repetida é única e resposta de sessão antiga não limpa ação ou feedback novo",async t=>{
  const runtime=hooks(t),modulo=loadApplicationModule("app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-action-state.ts",{react:runtime.react});
  const render=()=>runtime.render(()=>modulo.useAdminProblemasTecnicosActionState());let ativo=true,contagem=0;const espera=adiar(),atual=()=>ativo;
  const a=render().recarregarProblemasTecnicos(()=>{contagem++;return espera.promise;},atual);await render().recarregarProblemasTecnicos(()=>{contagem++;return Promise.resolve();},()=>ativo);assert.equal(contagem,1);
  ativo=false;render().setAcaoEmAndamento("novo");render().setSucesso("Novo sucesso");espera.reject(new Error("antigo"));await a;
  assert.equal(render().acaoEmAndamento,"novo");assert.equal(render().sucesso,"Novo sucesso");assert.equal(render().erro,"");
  const falha=render().recarregarProblemasTecnicos(()=>Promise.reject(new Error("offline")),()=>true);await falha;assert.match(render().erro,/offline/);assert.equal(render().acaoEmAndamento,"");
  await render().recarregarProblemasTecnicos(()=>Promise.resolve(),()=>true);assert.equal(render().erro,"");
});


test("A → B → A em mudanças de status respeita a última intenção sem deduplicar além do clique consecutivo",async t=>{
  const c=acoes(t),acao=c.render();const tarefas=["em_analise","resolvido","em_analise"].map(status=>acao.atualizarChamado(ticket(),{status},status));
  for(const [indice,status] of ["em_analise","resolvido","em_analise"].entries()){
    await tick();assert.equal(c.chamadas.length,indice+1);c.chamadas[indice].resposta.resolve({data:linha("c1",{status,atualizado_em:`v${indice+2}`}),error:null});
  }
  await Promise.all(tarefas);assert.equal(c.estado.problemas[0].status,"em_analise");assert.equal(c.estado.sucesso,"em_analise");
});

test("eventos da mesma identidade preservam os dados e rascunhos carregados",async t=>{
  const c=dados(t);c.render();await tick();await c.completar();const estado=c.render();estado.setObservacoes({c1:"rascunho"});
  for(const evento of ["SIGNED_IN","TOKEN_REFRESHED","INITIAL_SESSION","USER_UPDATED"])c.trocar("A",true,evento);
  await tick();assert.equal(c.leituras.length,1);assert.equal(c.render().carregando,false);assert.deepEqual(c.render().observacoes,{c1:"rascunho"});assert.equal(c.render().contextoRef,estado.contextoRef);
});

test("erro de leitura substituída não reaparece sobre recarga nova",async t=>{
  const c=dados(t);c.render();await tick();await c.completar();const a=c.render().carregarProblemas();await tick();const b=c.render().carregarProblemas();
  c.leituras[1].resolve({data:null,error:new Error("antigo")});await a;await tick();await c.completar(2);await b;assert.equal(c.feedback.erro,"");assert.equal(c.render().problemas[0].id,"c1");
});


test("checagem administrativa atrasada não autoriza a conta nova; falha mantém acesso fechado",async t=>{
  const c=dados(t,{adiarAdmin:true});c.render();await tick();c.trocar("B");await tick();
  c.verificacoes[0].resolve(true);await tick();assert.equal(c.leituras.length,0);assert.equal(c.render().usuarioId,"");assert.equal(c.render().ehAdmin,false);
  c.verificacoes[1].reject(new Error("checagem indisponível"));await tick();assert.equal(c.render().carregando,false);assert.equal(c.render().ehAdmin,false);assert.match(c.feedback.erro,/checagem indisponível/);assert.equal(c.leituras.length,0);
  c.trocar("C");await tick();c.verificacoes[2].resolve(true);await tick();await c.completar();assert.equal(c.render().usuarioId,"C");assert.equal(c.render().ehAdmin,true);
});

test("normalização não transforma resposta inválida em confirmação de campo solicitado",async t=>{
  const c=acoes(t);const base=ticket("c1",{status:"em_analise"});c.contextoRef.current.registros.set("c1",base);c.estado.problemas=[base];
  const a=c.render().atualizarChamado(base,{status:"aberto"},"OK");await tick();c.chamadas[0].resposta.resolve({data:linha("c1",{status:"inválido"}),error:null});await a;
  assert.equal(c.estado.problemas[0].status,"em_analise");assert.equal(c.estado.sucesso,"");assert.match(c.estado.erro,/não foi confirmada/);
});

test("filtro de versão rejeita alteração concorrente e exclusão sem escrever nem fabricar linha",async()=>{
  for(const excluido of [false,true]){
    let registro=linha("c1",{status:"aberto",atualizado_em:"v1"}),escritas=0;const filtros={};let payload;
    const usuario=adiar(),query={update(valor){payload=valor;return this;},eq(chave,valor){filtros[chave]=valor;return this;},select(){return this;},maybeSingle(){if(!registro||Object.entries(filtros).some(([chave,valor])=>registro[chave]!==valor))return Promise.resolve({data:null,error:null});escritas++;registro={...registro,...payload,atualizado_em:"v3"};return Promise.resolve({data:registro,error:null});}};
    const modulo=loadApplicationModule("app/admin/problemas-tecnicos/actions/atualizar-problema-tecnico-admin.ts",{"../../../../lib/supabase/client":{supabase:{auth:{getUser:()=>usuario.promise},from:()=>query}}});
    const executar=versao=>modulo.atualizarProblemaTecnicoAdmin({id:"c1",payload:{status:"resolvido"},usuarioIdEsperado:"A",atualizadoEmEsperado:versao,execucaoEstaAtual:()=>true});
    const antiga=executar("v1");registro=excluido?null:linha("c1",{status:"em_analise",atualizado_em:"v2"});usuario.resolve({data:{user:{id:"A"}},error:null});
    assert.deepEqual(await antiga,{data:null,error:null});assert.equal(escritas,0);
    if(!excluido){assert.equal((await executar("v2")).data.status,"resolvido");assert.equal(escritas,1);}
  }
});

test("reexecução dos efeitos abandona a carga anterior e mantém a sessão nova ativa",async t=>{
  const c=dados(t);c.render();await tick();const anterior=c.render().contextoRef.current;c.desmontar();c.render();await tick();
  assert.equal(anterior.ativo,false);assert.equal(c.render().contextoRef.current.ativo,true);assert.equal(c.unsubscribe,1);
  c.leituras[0].resolve({data:[linha("antigo")],error:null});await tick();assert.deepEqual(c.render().problemas,[]);
  await c.completar(1,[linha("novo")]);assert.equal(c.render().problemas[0].id,"novo");assert.equal(c.render().carregando,false);
});
