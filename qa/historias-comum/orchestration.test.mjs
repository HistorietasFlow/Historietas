// Contract-level fake server; NOT an RLS/Auth integration or the original 43 SQL checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { API_IDS, runDataApi } from './data-api.mjs';
import { SafeError } from './core.mjs';

function model(currentContract = false) {
  const users=[],prefs=new Map(),works=new Map(),favorites=[],tokens=new Map(),follows=new Set(),blocks=new Set();
  let serial=0,requests=0;
  const relation=(a,b)=>`${a}:${b}`;
  const api={
    async ok(actor,path,{body,method='GET',fixtureAdmin=false}={}) {
      const u=new URL('http://localhost/'+path),q=u.searchParams;
      if(path==='auth/v1/admin/users'&&fixtureAdmin) {
        const id=`aa000000-0000-4000-8000-${String(users.length+1).padStart(12,'0')}`;
        users.push({...body,id});return {id};
      }
      if(path.startsWith('auth/v1/admin/users/')&&method==='DELETE') { const id=path.split('/').at(-1);users.splice(users.findIndex(u=>u.id===id),1);return {}; }
      if(path==='auth/v1/token?grant_type=password') {
        const user=users.find(u=>u.email===body.email&&u.password===body.password);assert.ok(user);
        const token=`issued-session-${++serial}`; tokens.set(token,user.id);return {access_token:token,user:{id:user.id}};
      }
      if(path==='auth/v1/user') return {id:tokens.get(actor.token)};
      if(path.startsWith('auth/v1/logout')) {tokens.delete(actor.token);return {};}
      if(path.startsWith('rest/v1/profiles')) return body;
      if(path.startsWith('rest/v1/preferencias_privacidade')) {prefs.set(body.user_id,{...prefs.get(body.user_id),...body});return [body];}
      if(u.pathname==='/rest/v1/obras') {
        if(method==='POST') works.set(body.id,body);
        else Object.assign(works.get(q.get('id').slice(3)),body);
        return [body];
      }
      if(u.pathname==='/rest/v1/favoritos') {
        if(method==='DELETE') {
          for(let i=favorites.length-1;i>=0;i--) if(favorites[i].user_id===q.get('user_id').slice(3)&&favorites[i].obra_id===q.get('obra_id').slice(3)) favorites.splice(i,1);
        } else favorites.push(...(Array.isArray(body)?body:[body]));
        return [];
      }
      if(u.pathname.startsWith('/rest/v1/rpc/')) {
        const name=u.pathname.split('/').at(-1),peer=body.p_seguido_id??body.p_bloqueado_id;
        const key=relation(actor.id,peer);
        if(name==='solicitar_ou_seguir_usuario') follows.add(key);
        if(name==='deixar_de_seguir_usuario') follows.delete(key);
        if(name==='bloquear_usuario') blocks.add(key);
        if(name==='desbloquear_usuario') blocks.delete(key);
        return true;
      }
      throw new SafeError('fixture_error');
    },
    async request(actor,path,options={}) {
      requests++;
      if(path==='auth/v1/user') return {status:200,data:await api.ok(actor,path)};
      if(path.startsWith('auth/v1/logout')) {await api.ok(actor,path,options);return {status:204,data:null};}
      const u=new URL('http://localhost/'+path),q=u.searchParams;
      // This model specifies desired denial; real endpoints may FAIL these gates.
      if(u.pathname==='/rest/v1/favoritos') {
        const data=currentContract&&q.has('obra_id')?[{obra_id:'synthetic-hidden-one'},{obra_id:'synthetic-hidden-two'}]:[];
        return {status:200,data,range:`*/${data.length}`};
      }
      if(q.get('id')==='gt.invalid-uuid') return {status:400,data:{code:'invalid'},range:null};
      const a=q.get('a.user_id').slice(3),b=q.get('b.user_id').slice(3),viewer=actor?.id;
      const allowed=id=>{
        const p=prefs.get(id);
        if(currentContract&&id===viewer) return true;
        if(!p?.mostrar_favoritos||p.visibilidade_biblioteca==='somente_eu') return false;
        if(id===viewer) return true;
        if(p.visibilidade_biblioteca==='seguidores') return follows.has(relation(viewer,id));
        if(p.visibilidade_biblioteca==='seguindo') return follows.has(relation(id,viewer));
        return true;
      };
      let rows=[];
      const blocked=((viewer===a||viewer===b)&&(blocks.has(relation(a,b))||blocks.has(relation(b,a))))
        || [a,b].some(id=>blocks.has(relation(viewer,id))||blocks.has(relation(id,viewer)));
      if(!blocked&&allowed(a)&&allowed(b)) rows=[...works.values()].filter(w=>w.publicado&&w.classificacao_indicativa!=='18+'
        && [a,b].every(id=>favorites.some(f=>f.obra_id===w.id&&f.user_id===id&&f.visibilidade==='publico'))).map(w=>({id:w.id})).sort((x,y)=>x.id.localeCompare(y.id));
      if(q.has('id')) rows=rows.filter(w=>w.id>q.get('id').slice(3));
      const total=rows.length;
      rows=rows.slice(Number(q.get('offset')??0));rows=rows.slice(0,Number(q.get('limit')));
      return {status:200,data:options.method==='HEAD'?null:rows,range:total?`0-${Math.max(0,rows.length-1)}/${total}`:'*/0'};
    },
  };
  return {api,users,tokens,requests:()=>requests};
}
test('all declared HTTP scenarios execute serially and release accounts/sessions in a fake transport',async()=>{
  const m=model(),records=[],errors=[];
  const check=async(id,fn)=>{
    assert.ok(API_IDS.includes(id));assert.ok(!records.includes(id));records.push(id);
    try {await fn();return true;}catch(error){errors.push({id,code:error.code});return false;}
  };
  await runDataApi(m.api,check);
  assert.deepEqual(errors,[]);
  assert.deepEqual([...records].sort(),[...API_IDS].sort());
  assert.equal(m.users.length,0);assert.equal(m.tokens.size,0);assert.ok(m.requests()>30);
});
test('session cleanup error does not skip cleanup of the synthetic accounts',async()=>{
  const m=model(),records=[];
  const original=m.api.request;
  m.api.request=async(actor,path,options)=>{
    if(path.startsWith('auth/v1/logout')) throw new SafeError('transport_error');
    return original(actor,path,options);
  };
  const check=async(id,fn)=>{records.push(id);if(!id.startsWith('fixture.')&&!id.startsWith('cleanup.'))return false;try{await fn();return true;}catch{return false;}};
  await runDataApi(m.api,check);
  assert.ok(records.includes('cleanup.accounts'));assert.equal(m.users.length,0);
});
test('known owner bypass and hidden-reference exposure are FAIL, not accepted observations',async()=>{
  const m=model(true),failures=[];
  const check=async(id,fn)=>{try{await fn();return true;}catch{failures.push(id);return false;}};
  await runDataApi(m.api,check);
  assert.deepEqual(failures.sort(),['private_library.a.a','private_library.b.b','hide_favorites.a.a','hide_favorites.b.b','privacy.raw_hidden_references'].sort());
  assert.equal(m.users.length,0);
});
