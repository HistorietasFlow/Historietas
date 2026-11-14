import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const root=new URL('../../',import.meta.url);
function load(path,deps){const m={exports:{}};const js=ts.transpileModule(readFileSync(new URL(path,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(n=>{assert.ok(n in deps,n);return deps[n]},m,m.exports);return m.exports;}
const identity=load('app/obra/[slug]/lib/obra-auth-identity.ts',{});
const gate=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
function authHarness(getUser){let effect,listener,cleanup;const states=[],refs=[];let si=0,ri=0;let resets=0;
 const hook=load('app/obra/[slug]/hooks/use-obra-auth-identity-lifecycle.ts',{react:{useState(v){const i=si++;if(!(i in states))states[i]=v;return [states[i],v=>states[i]=typeof v==="function"?v(states[i]):v]},useRef(v){const i=ri++;return refs[i]??=( {current:v})},useEffect(fn){effect=fn}},'../../../../lib/supabase/client':{supabase:{auth:{getUser,onAuthStateChange(fn){listener=fn;return {data:{subscription:{unsubscribe(){}}}}}}}},'../lib/obra-auth-identity':identity});
 const reset=()=>resets++;
 const render=()=>{si=ri=0;return hook.useObraAuthIdentityLifecycle({onIdentidadeMudou:reset})};
 render();cleanup=effect();return {render,retry(){render().tentarAutenticacaoNovamente();cleanup();render();cleanup=effect()},event:(e,id)=>listener(e,id?{user:{id}}:null),stop:()=>cleanup(),get resets(){return resets}};
}
const auth=(id,error=null)=>({data:{user:id?{id}:null},error});
test('Auth retornado com erro não confirma usuário mesmo com data preenchida',async()=>{const h=authHarness(async()=>auth('A',{name:'AuthRetryableFetchError'}));await flush();assert.equal(h.render().autenticacaoCarregada,false);assert.equal(h.render().usuarioIdLogado,'');h.event('INITIAL_SESSION','A');assert.equal(h.render().autenticacaoCarregada,false);h.stop()});
test('exceção Auth não equivale a visitante confirmado',async()=>{const h=authHarness(async()=>{throw Error('offline')});await flush();assert.equal(h.render().autenticacaoCarregada,false);h.stop()});
test('sessão ausente normal confirma visitante',async()=>{const h=authHarness(async()=>auth(null,{name:'AuthSessionMissingError'}));await flush();assert.equal(h.render().autenticacaoCarregada,true);h.stop()});
test('logout e A B A vencem getUser atrasado e INITIAL_SESSION',async()=>{const g=gate(),h=authHarness(()=>g.promise);h.event('SIGNED_IN','A');const first=h.render().versaoIdentidade;h.event('SIGNED_IN','B');h.event('SIGNED_OUT',null);assert.equal(h.render().usuarioIdLogado,'');h.event('SIGNED_IN','A');h.event('INITIAL_SESSION','B');g.resolve(auth('B'));await flush();assert.equal(h.render().usuarioIdLogado,'A');assert.ok(h.render().versaoIdentidade>first);const v=h.render().versaoIdentidade;h.event('TOKEN_REFRESHED','A');assert.equal(h.render().versaoIdentidade,v);h.stop()});
test('getUser após unmount não aplica identidade',async()=>{const g=gate(),h=authHarness(()=>g.promise);h.stop();g.resolve(auth('A'));await flush();assert.equal(h.render().usuarioIdLogado,'');assert.equal(h.resets,0)});
function workHarness(local){let effect,cleanup;const timers=[],calls=[],pending=[];const ref={current:{usuarioId:'A',versao:1}};const state={};const set=k=>v=>{calls.push(k);state[k]=v}; // Timers are injected as a dependency of the transpiled hook, not global state.
 const code=readFileSync(new URL('app/obra/[slug]/hooks/use-obra-public-work-load.ts',root),'utf8');
 const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};const deps={react:{useEffect(fn){effect=fn}},'../lib/obra-auth-identity':identity,'../lib/obra-local-works-utils':{carregarObrasLocaisComBackup:local},'../lib/obra-public-work-loader':{carregarObraSupabasePorSlug(slug,works,user,current){const g=gate();pending.push({slug,works,user,current,...g});return g.promise}}};
 new Function('require','module','exports','window',js)(n=>deps[n],m,m.exports,{setTimeout(fn){timers.push(fn)}});
 return {state,calls,pending,ref,start(slug){cleanup?.();m.exports.useObraPublicWorkLoad({autenticacaoCarregada:true,slug,usuarioIdLogado:ref.current.usuarioId,identidadeAutenticadaObraRef:ref,setObrasLocais:set('obras'),setCarregandoObras:set('loading'),setErroCarregamentoObra:set('erro')});cleanup=effect()},tick(){while(timers.length)timers.shift()()},stop(){cleanup?.()}};
}
test('storage inválido não impede remoto nem reutiliza cache como confirmação',async()=>{const h=workHarness(()=>{throw Error('invalid JSON')});h.start('a');h.tick();assert.equal(h.pending.length,1);assert.deepEqual(h.pending[0].works,[]);h.pending[0].resolve({obras:[{id:'publica'}],status:'carregada'});await flush();h.tick();assert.equal(h.state.obras[0].id,'publica');assert.equal(h.state.loading,false);h.stop()});
test('A B A rápido ignora resposta e timers da primeira rota',async()=>{const h=workHarness(()=>[]);h.start('a');h.start('b');h.start('a');h.pending[2].resolve({obras:[{id:'nova'}],status:'carregada'});await flush();h.pending[0].resolve({obras:[{id:'antiga'}],status:'carregada'});h.pending[1].resolve({obras:[],status:'erro'});await flush();h.tick();assert.equal(h.state.obras[0].id,'nova');assert.equal(h.state.erro,false);assert.equal(h.state.loading,false);h.stop()});
test('troca de identidade e unmount invalidam resposta, timers e loading antigos',async()=>{const h=workHarness(()=>[]);h.start('a');h.ref.current={usuarioId:'B',versao:2};h.pending[0].resolve({obras:[{id:'privadaA'}],status:'carregada'});await flush();h.tick();assert.equal(h.calls.length,0);h.start('b');h.stop();h.pending[1].resolve({obras:[],status:'erro'});await flush();h.tick();assert.equal(h.calls.length,0)});
test('falha remota encerra loading com erro explícito',async()=>{const h=workHarness(()=>[]);h.start('a');h.pending[0].resolve({obras:[],status:'erro'});await flush();h.tick();assert.equal(h.state.erro,true);assert.equal(h.state.loading,false);h.stop()});

test('retry manual recupera falha Auth sem confirmar sessão em erro',async()=>{let fail=true;const h=authHarness(async()=>fail?auth(null,{name:'AuthRetryableFetchError'}):auth('A'));await flush();assert.equal(h.render().erroAutenticacao,true);fail=false;h.retry();await flush();assert.equal(h.render().erroAutenticacao,false);assert.equal(h.render().autenticacaoCarregada,true);assert.equal(h.render().usuarioIdLogado,'A');h.stop()});
