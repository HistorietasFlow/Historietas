import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const p = load("lib/catalogo-palavras.ts");
const route = load("app/explorar/lib/explorar-page-route-utils.ts");
const { ExplorarWordRangeFilter } = load("app/explorar/components/explorar-word-range-filter.tsx");
const { ExplorarActiveCatalogFilters } = load("app/explorar/components/explorar-active-catalog-filters.tsx");

test("intervalo estrito: vazio, zero, limites inclusivos e inteiro seguro", () => {
  for (const [min, max, expected] of [["", "", [null,null]], ["0", "", [0,null]], ["", "0", [null,0]], ["0", "0", [0,0]],
    ["001", "200", [1,200]], ["9007199254740991", "9007199254740991", [Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]]]) {
    const r = p.validarIntervaloPalavras({ minimo: min, maximo: max });
    assert.equal(r.valido, true); assert.deepEqual([r.palavrasMinimas,r.palavrasMaximas], expected);
  }
  for (const value of ["-1", "1.5", "1e3", "1E0", "NaN", "Infinity", "9007199254740992", " 1", "1 ", "1\n", "1\r\n", "+1", "0x10", "1,000", " ", "１"]) {
    assert.equal(p.validarIntervaloPalavras({minimo: value,maximo: ""}).valido, false, value);
    assert.equal(p.validarIntervaloPalavras({minimo: "",maximo: value}).valido, false, value);
    assert.equal(p.canonizarPalavrasUrl(value), value);
  }
  assert.equal(p.validarIntervaloPalavras({minimo: "2",maximo: "1"}).valido, false);
});

test("URL canônica, inválida preservada, combinações e Autores", () => {
  const base = "?busca=História&categoria=Fantasia&formato=HQ&tag=magia&statusEditorial=concluida&palavrasMinimas=000&palavrasMaximas=01000";
  const f = route.lerFiltrosCompartilhaveisExplorar(base);
  assert.equal(f.palavrasMinimas,"0"); assert.equal(f.palavrasMaximas,"1000");
  assert.deepEqual(route.lerFiltrosCompartilhaveisExplorar(new URL(route.criarUrlExplorar(f), "http://localhost").search),f);
  for (const raw of ["1e3","-1","2.5","Infinity","9007199254740992"]) {
    const invalid = route.lerFiltrosCompartilhaveisExplorar(`?palavrasMinimas=${encodeURIComponent(raw)}`);
    assert.equal(invalid.palavrasMinimas,raw);
    assert.equal(new URL(route.criarUrlExplorar(invalid),"http://localhost").searchParams.get("palavrasMinimas"),raw);
  }
  const authors = new URL(route.criarUrlExplorar({...f,modoConteudo: "autores"}),"http://localhost");
  assert.equal(authors.searchParams.has("palavrasMinimas"),false);
  assert.equal(route.lerFiltrosCompartilhaveisExplorar("?tipo=autores&palavrasMinimas=0").palavrasMinimas,undefined);
  const removed = new URL(route.criarUrlExplorar({...f,palavrasMinimas:"",palavrasMaximas:""}),"http://localhost");
  for (const key of ["tag","statusEditorial","formato","busca","categoria"]) assert.equal(removed.searchParams.get(key),new URLSearchParams(base).get(key));
});

test("cliente real valida antes da RPC e mantém variantes 10–15; ativa envia 17 argumentos exatos", async () => {
  const calls = [];
  const {listarPaginaCatalogo} = load("lib/catalogo.ts", {"./supabase/client": {supabase: {rpc: async (name,args) => {calls.push({name,args}); return {data:[],error:null};}}}});
  for (const value of [-1,0.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,"0",false]) await assert.rejects(listarPaginaCatalogo({palavrasMinimas:value}));
  await assert.rejects(listarPaginaCatalogo({palavrasMinimas:2,palavrasMaximas:1}));
  assert.equal(calls.length,0);
  for (const q of [{},{tag:"magia"},{notaMinima:3},{tagExcluida:"terror"},{generoExcluido:"Drama"},{statusEditorial:"concluida"}]) await listarPaginaCatalogo({...q,palavrasMinimas:null});
  assert.deepEqual(calls.map(c=>Object.keys(c.args).length),[10,11,12,13,14,15]);
  await listarPaginaCatalogo({palavrasMinimas:0,palavrasMaximas:5000,statusEditorial:"concluida",busca:"  magia  ",genero:"Fantasia",formato:"HQ",tag:"magia",tagExcluida:"terror",generoExcluido:"Drama",notaMinima:4,classificacao:"Livre",filtroCapitulos:"com-capitulos",ordenacao:"mais-capitulos",limite:7});
  assert.deepEqual(calls.at(-1),{name:"listar_obras_catalogo",args:{p_busca:"magia",p_genero:"Fantasia",p_formato:"HQ",p_classificacao:"Livre",p_filtro_capitulos:"com-capitulos",p_ordenacao:"mais-capitulos",p_limite:7,p_cursor_valor:null,p_cursor_data:null,p_cursor_id:null,p_tag:"magia",p_nota_minima:4,p_tag_excluida:"terror",p_genero_excluido:"drama",p_status_editorial:"concluida",p_palavras_minimas:0,p_palavras_maximas:5000}});
  const cursor={valor:5,data:"2026-01-01T00:00:00Z",id:"00000000-0000-4000-8000-000000000001"};
  await listarPaginaCatalogo({palavrasMaximas:0,cursor});
  assert.equal(calls.at(-1).args.p_cursor_id,cursor.id); assert.equal(calls.at(-1).args.p_palavras_minimas,null);
});

test("erro da variante ativa não repete consulta ampla", async () => {
  let calls=0;
  const {listarPaginaCatalogo}=load("lib/catalogo.ts",{"./supabase/client":{supabase:{rpc:async()=>{calls++;return {data:null,error:{message:"indisponível"}};}}}});
  await assert.rejects(listarPaginaCatalogo({palavrasMinimas:0}),/indisponível/); assert.equal(calls,1);
});

test("contagem única, cache não confirma palavras e filtros antigos intactos", () => {
  const base={usuarioLogado:false,filtroColecao:"todos",filtroFormato:"todos",filtroClassificacao:"todos",filtroCapitulos:"todos",ordenacao:"relevancia"};
  const {contarFiltrosAvancadosAtivosExplorar:contar}=load("app/explorar/lib/explorar-active-filter-count.ts");
  assert.equal(contar(base),0); assert.equal(contar({...base,palavrasAtivas:true}),1);
  assert.equal(contar({...base,palavrasAtivas:true,tagExcluida:"x",statusEditorial:"concluida"}),3);
  const {filtrarObrasExplorar}=load("app/explorar/lib/explorar-derived-utils.ts");
  const obra={id:"obra",titulo:"Teste",autor:"QA",genero:"Fantasia",formato:"HQ",sinopse:"",tags:[],capitulos:[]};
  const f={obrasBaseFiltradas:[obra],categoriaSelecionada:"",termoBusca:"",palavrasAtivas:true};
  assert.deepEqual(filtrarObrasExplorar(f),[]); assert.deepEqual(filtrarObrasExplorar({...f,obraIdsBuscaRemota:[]}),[]);
  assert.deepEqual(filtrarObrasExplorar({...f,obraIdsBuscaRemota:["obra"]}),[obra]);
});

test("controles e indicador: PT/EN/ES, zero, erros acessíveis, sem consultas", () => {
  const {descreverIntervaloPalavras}=load("app/explorar/lib/explorar-word-filter-text.ts");
  for(const [language,label,words] of [["pt-BR","Mínimo de palavras","Palavras"],["en","Minimum words","Words"],["es","Mínimo de palabras","Palabras"]]) {
    const html=renderToStaticMarkup(React.createElement(ExplorarWordRangeFilter,{language,intervalo:{minimo:"0",maximo:"1000"},onAplicar(){}}));
    assert.ok(html.includes(label)); assert.match(html,/inputMode="numeric"/); assert.match(html,/aria-describedby="explorar-palavras-ajuda"/);
    const error=renderToStaticMarkup(React.createElement(ExplorarWordRangeFilter,{language,intervalo:{minimo:"1e3",maximo:""},onAplicar(){}}));
    assert.match(error,/value="1e3"/); assert.match(error,/aria-invalid="true"/); assert.match(error,/role="alert"/);
    const props={language,modoConteudo:"obras",filtroFormato:"todos",filtroTag:"",tagExcluida:"",generoExcluido:"",notaMinima:null,intervaloPalavras:{minimo:"0",maximo:"0"},onAplicarPalavras(){},onFocarFiltros(){}};
    assert.ok(renderToStaticMarkup(React.createElement(ExplorarActiveCatalogFilters,props)).includes(`${words}: 0–0`));
    assert.equal(renderToStaticMarkup(React.createElement(ExplorarActiveCatalogFilters,{...props,modoConteudo:"autores"})),"");
  }
  assert.equal(descreverIntervaloPalavras(1000,5000,"pt-BR"),"1.000–5.000");
  assert.equal(descreverIntervaloPalavras(1000,null,"en"),"from 1,000");
  assert.equal(descreverIntervaloPalavras(null,5000,"pt-BR"),"até 5.000");
});
