import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import {loadApplicationModule as load} from '../helpers/load-application-module.mjs';
const tick=()=>new Promise(r=>setImmediate(r));
function setup(t) {
 const old=globalThis.window;globalThis.window={scrollTo(){}};t.after(()=>{globalThis.window=old;});
 const calls=[];let vigente=true,blocked=false,release;
 const config={persistError:false,estado:'confirmada',pending:false};
 const capture={podeSalvar:true,confirmado:null,escolha:null,vigente:()=>vigente,concluir:r=>{if(r.estado!=='confirmada')blocked=true;}};
 const mocks={react:{...React,useRef:v=>({current:v})}};
 const mock=(name,fn)=>mocks['../lib/editar-obra-'+name]=fn;
 mock('file-backup-storage',{carregarBackupArquivosObras:()=>({})});
 mock('remote-storage',{removerArquivosStorageEdicaoObra:async()=>calls.push('cleanup')});
 mock('diary-sync',{sincronizarDiarioEdicaoObra:async()=>calls.push('diary')});
 mock('form-validation',{validarFormularioEdicaoObra:()=>null});
 mock('save-auth-identity',{obterIdentidadeSalvamentoEdicaoObra:async()=>({userId:'A',nomeProfileAtualizado:'Autor'})});
 mock('save-work-ownership',{confirmarPropriedadeObraParaSalvamentoEdicao:async()=>({obraLocalAtual:{id:'obra'},obraRemotaAtual:{id:'obra'}})});
 mock('save-preparation',{prepararValoresSalvamentoEdicaoObra:()=>({tituloFinal:'Título',autorFinal:'Autor'})});
 mock('save-assets-preparation',{prepararEEnviarAssetsEdicaoObra:async()=>({capaFinal:'capa',arquivosAntigosParaRemover:[]})});
 mock('remote-update',{atualizarObraRemotaEdicaoObra:async()=>{calls.push('write');if(config.pending)await new Promise(r=>{release=r;});return {estado:config.estado};}});
 mock('local-persistence',{persistirObraLocalEBackupEdicaoObra:()=>{calls.push('persist');if(config.persistError)throw Error('quota');return [];}});
 const props={editorial:{capturar:()=>({...capture,podeSalvar:!blocked})},obraId:'obra',processando:false};
 for(const key of ['Erro','Salvou','Processando','NomeAutorProfile','Obras','Autor','Capa','CapaNome','CapaArquivo','CapaRemovidaManualmente','ArquivoObra','ArquivoObraArquivo','ArquivoObraRemovidoManualmente']) props['set'+key]=v=>calls.push([key,v]);
 const {useEditarObraSaveAction}=load('app/editar-obra/hooks/use-editar-obra-save-action.ts',mocks);
 const {salvarEdicao}=Reflect.apply(useEditarObraSaveAction,null,[props]);
 return {calls,config,submit:()=>salvarEdicao({preventDefault(){}}),release:()=>release(),invalidate:()=>{vigente=false;}};
}
test('clique duplo no mesmo render envia uma única escrita',async t=>{const h=setup(t);h.config.pending=true;const a=h.submit(),b=h.submit();await tick();assert.equal(h.calls.filter(c=>c==='write').length,1);h.release();await Promise.all([a,b]);assert.ok(h.calls.some(c=>c[0]==='Salvou'&&c[1]===true));});
for(const estado of ['incerta','sem_linha','rejeitada']) test(`resposta ${estado} não limpa assets, persiste ou repete escrita`,async t=>{const h=setup(t);h.config.estado=estado;await h.submit();await h.submit();assert.equal(h.calls.filter(c=>c==='write').length,1);assert.ok(!h.calls.includes('cleanup'));assert.ok(!h.calls.includes('persist'));assert.ok(!h.calls.some(c=>c[0]==='Salvou'&&c[1]===true));});
test('falha local após confirmação não indica sucesso nem repete PATCH no retry',async t=>{const h=setup(t);h.config.persistError=true;await h.submit();await h.submit();assert.equal(h.calls.filter(c=>c==='write').length,1);assert.ok(!h.calls.some(c=>c[0]==='Salvou'&&c[1]===true));});
test('troca de identidade durante PATCH descarta persistência e sucesso',async t=>{const h=setup(t);h.config.pending=true;const p=h.submit();await tick();h.invalidate();h.release();await p;assert.ok(!h.calls.includes('persist'));assert.ok(!h.calls.some(c=>c[0]==='Salvou'&&c[1]===true));});

test('cache concorrente preserva rascunhos e mudanças de outras obras, com isolamento por conta',t=>{
 const old=globalThis.window,storage=globalThis.localStorage;globalThis.window={};
 const db=new Map([['historietas-obras:A',JSON.stringify([{id:'obra',autorId:'A',titulo:'antigo'},{id:'rascunho',autorId:'',titulo:'novo'}])],['historietas-obras:B','nao tocar']]);
 globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};t.after(()=>{globalThis.window=old;globalThis.localStorage=storage;});
 const m=load('app/editar-obra/lib/editar-obra-local-work-storage.ts',{'./editar-obra-file-backup-storage':{carregarBackupArquivosObras:()=>({}),sincronizarBackupArquivosObras(){},restaurarArquivoObraComBackup:o=>o}});
 m.salvarObrasDoUsuarioPreservandoOutrasContas([{id:'obra',autorId:'A',titulo:'editada'},{id:'rascunho',autorId:'A',titulo:'obsoleto'}],'A','obra');
 const rows=JSON.parse(db.get('historietas-obras:A'));assert.equal(rows.find(o=>o.id==='rascunho').titulo,'novo');assert.equal(db.get('historietas-obras:B'),'nao tocar');
 db.set('historietas-obras:A','{invalido');assert.deepEqual(m.carregarObrasLocalStorageEdicaoObra('A'),[]);assert.equal(db.get('historietas-obras:A'),'{invalido');assert.throws(()=>m.salvarObrasDoUsuarioPreservandoOutrasContas([],'A','obra'));assert.equal(db.get('historietas-obras:A'),'{invalido');
});

for (const etapa of ['read','write']) test(`falha de storage ${etapa} é propagada sem confirmar persistência`,t=>{
 const old=globalThis.window,storage=globalThis.localStorage;globalThis.window={};
 globalThis.localStorage={getItem(){if(etapa==='read')throw Error('storage indisponivel');return '[]';},setItem(){throw Error('quota');}};
 t.after(()=>{globalThis.window=old;globalThis.localStorage=storage;});
 const m=load('app/editar-obra/lib/editar-obra-local-work-storage.ts',{'./editar-obra-file-backup-storage':{carregarBackupArquivosObras:()=>({}),sincronizarBackupArquivosObras(){},restaurarArquivoObraComBackup:o=>o}});
 assert.throws(()=>m.salvarObrasDoUsuarioPreservandoOutrasContas([{id:'obra',autorId:'A'}],'A','obra'),etapa==='read'?/indisponivel/:/quota/);
});

test('carga remota confirmada permanece visível se cache falha',async t=>{
 const old=globalThis.window;globalThis.window={setTimeout:fn=>fn()};t.after(()=>{globalThis.window=old;});
 let effect;const writes=[];
 const mocks={react:{...React,useEffect:fn=>{effect=fn;}},'next/navigation':{useSearchParams:()=>new URLSearchParams('obraId=obra')},
 '../../../lib/supabase/client':{supabase:{auth:{getUser:async()=>({data:{user:{id:'A'}}})}}}};
 const mock=(name,value)=>mocks['../lib/editar-obra-'+name]=value;
 mock('profile-loader',{carregarNomeAutorProfileEdicaoObra:async()=>'',obterTextoMetadataUsuarioEdicaoObra:()=>''});
 mock('local-work-storage',{carregarObrasLocalStorageEdicaoObra:()=>[],salvarObrasDoUsuarioPreservandoOutrasContas:()=>{throw Error('quota');}});
 mock('work-loader',{carregarObraSupabaseEdicaoObra:async()=>({id:'obra',user_id:'A'})});
 mock('chapters-loader',{carregarCapitulosSupabaseEdicaoObra:async()=>[]});
 mock('supabase-work-normalizer',{normalizarObraSupabase:()=>({id:'obra'})});
 mock('loaded-work-merge',{prepararObrasCarregadasEdicaoObra:()=>({obraSupabaseComAutorProfile:{id:'obra'},obrasAtualizadas:[]})});
 mock('form-preparation',{prepararValoresFormularioEdicaoObra:()=>({titulo:'remota'})});
 const {useEditarObraInitialLoad}=load('app/editar-obra/hooks/use-editar-obra-initial-load.ts',mocks);
 const props=new Proxy({router:{replace(){}},iniciarCargaEditorial:()=>({atual:()=>true,identificar:()=>true,confirmar(){},cancelar(){}})}, {get:(obj,key)=>key in obj?obj[key]:value=>writes.push([key,value])});
 const warn=console.warn;console.warn=()=>{};t.after(()=>{console.warn=warn;});
 Reflect.apply(useEditarObraInitialLoad,null,[props]);effect();await tick();
 assert.ok(writes.some(([key,v])=>key==='setTitulo'&&v==='remota'));
 assert.ok(writes.some(([key,v])=>key==='setObraEncontrada'&&v===true));
 assert.deepEqual(writes.filter(([key])=>key==='setCarregando').at(-1),['setCarregando',false]);
});
