import { randomUUID, randomBytes } from 'node:crypto';
import { requireThat, intersectionQuery, exactResponse } from './core.mjs';

export const API_IDS = Object.freeze([
  'fixture.real_auth', ...['a','b','third','anon'].map(v=>`public.${v}`),'public.reverse_pair',
  ...['private_library','hide_favorites'].flatMap(p=>['a','b'].flatMap(s=>['a','b','third','anon'].map(v=>`${p}.${s}.${v}`))),
  ...['a','b'].flatMap(s=>['seguidores','seguindo'].map(m=>`library.${s}.${m}`)),
  'block.a_b','block.b_a','block.third_a','block.a_third',
  ...['a','b'].flatMap(s=>['privado','parcial','removed'].map(v=>`revocation.${s}.${v}`)),
  'work.revocation.draft','work.revocation.adult','auth.account_switch',
  'pagination.keyset','pagination.offset','count.head','pagination.invalid_cursor',
  'privacy.raw_private_favorites','privacy.raw_hidden_references','cleanup.sessions','cleanup.accounts',
]);

// Assertions deliberately fail on a mismatch; known owner/privacy limitations
// are NOT converted to successful feature-security gates.
export async function runDataApi(api, check) {
  const accounts = [], sessions = [], books = [];
  const tag = `qa-common-${randomUUID()}-`;
  let ready = false;
  const rpc = (actor,name,args) => api.ok(actor,`rest/v1/rpc/${name}`,{method:'POST',body:args});
  const login = async account => {
    const session = await api.ok(null,'auth/v1/token?grant_type=password',{method:'POST',body:{email:account.email,password:account.password}});
    requireThat(typeof session.access_token === 'string' && session.user?.id === account.id,'auth_mismatch');
    const actor = { token:session.access_token, id:account.id };
    sessions.push(actor);
    const confirmed = await api.request(actor,'auth/v1/user');
    requireThat(confirmed.status === 200 && confirmed.data?.id === account.id,'auth_mismatch');
    return actor;
  };
  const preference = (account, patch) => api.ok(account.actor,'rest/v1/preferencias_privacidade?on_conflict=user_id',{method:'POST',body:{user_id:account.id,...patch}});
  const favorite = async (account,work,visibility) => {
    await api.ok(account.actor,`rest/v1/favoritos?user_id=eq.${account.id}&obra_id=eq.${work.id}`,{method:'DELETE'});
    if (visibility !== null) await api.ok(account.actor,'rest/v1/favoritos',{method:'POST',body:{user_id:account.id,obra_id:work.id,visibilidade:visibility}});
  };
  try {
    ready = await check('fixture.real_auth',async () => {
      for (const label of ['A','B','C','D']) {
        const account = {label,email:`${tag}${label.toLowerCase()}@historietas.test`,password:randomBytes(32).toString('base64url')};
        const created = await api.ok(null,'auth/v1/admin/users',{method:'POST',fixtureAdmin:true,body:{email:account.email,password:account.password,email_confirm:true}});
        account.id = created.id ?? created.user?.id;
        requireThat(/^[0-9a-f-]{36}$/.test(account.id),'fixture_error');
        accounts.push(account); // tracked before any further operation can fail
        account.actor = await login(account);
        await api.ok(account.actor,'rest/v1/profiles',{method:'POST',body:{id:account.id,user_id:account.id,nome:`QA comum ${label}`,tipo:['A','D'].includes(label)?'autor':'leitor'}});
        await rpc(account.actor,'aceitar_termos_publicacao',{p_termos_versao:'2026-08-05',p_diretrizes_versao:'2026-08-05',p_politica_versao:'2026-08-05'});
        await preference(account,{visibilidade_biblioteca:'publico',mostrar_favoritos:true,perfil_privado:false});
      }
      const [A,B,,D] = accounts;
      const definitions = [
        ...Array.from({length:23},(_,n)=>({kind:`public_${n}`,visibilityA:'publico',visibilityB:'publico'})),
        {kind:'private_a',visibilityA:'privado',visibilityB:'publico'},
        {kind:'private_b',visibilityA:'publico',visibilityB:'privado'},
        {kind:'partial_a',visibilityA:'parcial',visibilityB:'publico'},
        {kind:'partial_b',visibilityA:'publico',visibilityB:'parcial'},
        {kind:'draft',draft:true}, {kind:'adult',adult:true},
        {kind:'own_draft',draft:true,own:true}, {kind:'own_adult',adult:true,own:true},
      ];
      for (const def of definitions) {
        const owner = def.own ? A : D;
        const work = { ...def,id:randomUUID(),owner };
        books.push(work);
        await api.ok(owner.actor,'rest/v1/obras',{method:'POST',body:{id:work.id,user_id:owner.id,titulo:'QA comum sintetica',autor:'QA sintetico',genero:'Fantasia',formato:'Conto',classificacao_indicativa:def.adult?'18+':'Livre',avisos_conteudo:def.adult?['terror']:[],publicado:!def.draft,slug:`${tag}${def.kind}`}});
      }
      // Includes legacy references to hidden works: fixture-only service writes.
      // No permission assertion or visibility read uses this credential.
      const rows = books.flatMap(work=>[A,B].map(account=>({user_id:account.id,obra_id:work.id,visibilidade:account===A?(work.visibilityA??'publico'):(work.visibilityB??'publico')})));
      await api.ok(null,'rest/v1/favoritos',{method:'POST',fixtureAdmin:true,body:rows});
      return {accounts:4,works:books.length};
    });
    if (!ready) return;
    const [A,B,C] = accounts;
    const visible = books.filter(w=>w.kind.startsWith('public_')).map(w=>w.id).sort();
    const query = (options={}) => intersectionQuery({a:A.id,b:B.id,slugPrefix:tag,...options});
    const expect = async (actor,ids=visible,options={}) => {
      const r = await api.request(actor,query(options));
      const metrics = exactResponse(r,ids.slice(0,options.limit??20),ids.length);
      return {...metrics,http:r.status};
    };
    for (const [name,actor] of [['a',A.actor],['b',B.actor],['third',C.actor],['anon',null]]) {
      await check(`public.${name}`,()=>expect(actor));
    }
    await check('public.reverse_pair',()=>expect(B.actor,visible,{a:B.id,b:A.id}));
    for (const side of [A,B]) {
      const sideName = side===A?'a':'b';
      for (const patchKind of ['private_library','hide_favorites']) {
        for (const [viewer,actor] of [['a',A.actor],['b',B.actor],['third',C.actor],['anon',null]]) {
          await check(`${patchKind}.${sideName}.${viewer}`,async()=>{
            try {
              await preference(side,patchKind==='private_library'?{visibilidade_biblioteca:'somente_eu'}:{mostrar_favoritos:false});
              return await expect(actor,[]);
            } finally { await preference(side,{visibilidade_biblioteca:'publico',mostrar_favoritos:true}); }
          });
        }
      }
      const peer = side===A?B:A;
      for (const mode of ['seguidores','seguindo']) {
        const follower = mode==='seguidores'?peer:side;
        const followed = mode==='seguidores'?side:peer;
        await check(`library.${sideName}.${mode}`,async()=>{
          try {
            await preference(side,{visibilidade_biblioteca:mode});
            await expect(peer.actor,[]);
            await rpc(follower.actor,'solicitar_ou_seguir_usuario',{p_seguido_id:followed.id});
            await expect(peer.actor);
            await expect(C.actor,[]); await expect(null,[]);
            await rpc(follower.actor,'deixar_de_seguir_usuario',{p_seguido_id:followed.id});
            return await expect(peer.actor,[]);
          } finally {
            await rpc(follower.actor,'deixar_de_seguir_usuario',{p_seguido_id:followed.id});
            await preference(side,{visibilidade_biblioteca:'publico'});
          }
        });
      }
    }
    for (const blocker of [A,B]) {
      const target = blocker===A?B:A;
      await check(`block.${blocker===A?'a_b':'b_a'}`,async()=>{
        try {
          await rpc(blocker.actor,'bloquear_usuario',{p_bloqueado_id:target.id});
          await expect(A.actor,[]); await expect(B.actor,[]);
          // Public third-party interests are evidence, not a claim of pair secrecy.
          await expect(C.actor); await expect(null);
        } finally { await rpc(blocker.actor,'desbloquear_usuario',{p_bloqueado_id:target.id}); }
        return await expect(A.actor);
      });
    }
    for (const blocker of [A,C]) {
      const target=blocker===A?C:A;
      await check(`block.${blocker===A?'a_third':'third_a'}`,async()=>{
        try {
          await rpc(blocker.actor,'bloquear_usuario',{p_bloqueado_id:target.id});
          await expect(C.actor,[]); await expect(A.actor);
        } finally { await rpc(blocker.actor,'desbloquear_usuario',{p_bloqueado_id:target.id}); }
        return await expect(C.actor);
      });
    }
    const firstWork = books.find(w=>w.id===visible[0]);
    for (const side of [A,B]) {
      for (const state of ['privado','parcial','removed']) {
        await check(`revocation.${side===A?'a':'b'}.${state}`,async()=>{
          try {
            await favorite(side,firstWork,state==='removed'?null:state);
            for (const actor of [A.actor,B.actor,C.actor,null]) await expect(actor,visible.slice(1));
            return {rows:22,total:22};
          } finally { await favorite(side,firstWork,'publico'); }
        });
      }
    }
    for (const state of ['draft','adult']) {
      await check(`work.revocation.${state}`,async()=>{
        const path=`rest/v1/obras?id=eq.${firstWork.id}&user_id=eq.${firstWork.owner.id}`;
        try {
          await api.ok(firstWork.owner.actor,path,{method:'PATCH',body:state==='draft'?{publicado:false}:{classificacao_indicativa:'18+',avisos_conteudo:['terror']}});
          for (const actor of [A.actor,B.actor,C.actor,null]) await expect(actor,visible.slice(1));
          return {rows:22,total:22};
        } finally { await api.ok(firstWork.owner.actor,path,{method:'PATCH',body:{publicado:true,classificacao_indicativa:'Livre',avisos_conteudo:[]}}); }
      });
    }
    await check('auth.account_switch',async()=>{
      const slot = await login(A);
      await expect(slot);
      await api.ok(slot,'auth/v1/logout?scope=local',{method:'POST'});
      slot.token = undefined;
      const newActor = await login(B); // login waits for completed Auth and getUser
      slot.token = newActor.token; slot.id = newActor.id;
      requireThat(slot.id===B.id,'auth_mismatch');
      await preference(A,{visibilidade_biblioteca:'somente_eu'});
      try { return await expect(slot,[]); }
      finally { await preference(A,{visibilidade_biblioteca:'publico'}); }
    });
    await check('pagination.keyset',async()=>{
      const all=[]; let cursor;
      for (let page=0;page<4;page++) {
        const remaining=visible.filter(id=>cursor===undefined||id>cursor);
        const r=await api.request(A.actor,query({cursor,limit:7}));
        exactResponse(r,remaining.slice(0,7),remaining.length);
        all.push(...r.data.map(row=>row.id)); cursor=all.at(-1);
      }
      requireThat(JSON.stringify(all)===JSON.stringify(visible)&&new Set(all).size===23,'unexpected_rows');
      exactResponse(await api.request(A.actor,query({cursor,limit:7})),[],0);
      return {rows:23,total:23};
    });
    await check('pagination.offset',async()=>{
      const r=await api.request(A.actor,query({offset:20}));
      return {...exactResponse(r,visible.slice(20),23),http:r.status};
    });
    await check('count.head',async()=>{
      const r=await api.request(C.actor,query(),{method:'HEAD'});
      requireThat([200,206].includes(r.status)&&r.range?.endsWith('/23'),'unexpected_count');
      return {total:23,http:r.status};
    });
    await check('pagination.invalid_cursor',async()=>{
      const bad=query().replace(/&order=/,'&id=gt.invalid-uuid&order=');
      const r=await api.request(A.actor,bad);
      requireThat(r.status===400,'response_error');
      return {http:r.status};
    });
    // Explicit negative gate for direct inference through existing endpoints.
    await check('privacy.raw_private_favorites',async()=>{
      const path=`rest/v1/favoritos?select=obra_id&user_id=in.(${A.id},${B.id})&visibilidade=eq.privado`;
      for (const actor of [C.actor,null]) exactResponse(await api.request(actor,path),[],0);
      return {rows:0,total:0};
    });
    await check('privacy.raw_hidden_references',async()=>{
      const hidden=books.filter(w=>['draft','adult'].includes(w.kind)).map(w=>w.id);
      const path=`rest/v1/favoritos?select=obra_id&user_id=eq.${B.id}&obra_id=in.(${hidden.join(',')})`;
      for (const actor of [C.actor,null]) exactResponse(await api.request(actor,path),[],0);
      return {rows:0,total:0};
    });
  } finally {
    // Independent cleanup operations: one failed resource never skips others.
    await check('cleanup.sessions',async()=>{
      let failures=0;
      const unique=[...new Map(sessions.filter(s=>s.token).map(s=>[s.token,s])).values()];
      for (const session of unique) {
        try { const r=await api.request(session,'auth/v1/logout?scope=local',{method:'POST'}); if (![200,204,401,403].includes(r.status)) failures++; }
        catch { failures++; }
      }
      requireThat(failures===0,'cleanup_error'); return {resources:unique.length};
    });
    // Auth FK cascades remove only the accounts created by this invocation.
    await check('cleanup.accounts',async()=>{
      let failures=0;
      for (const account of accounts) {
        try { await api.ok(null,`auth/v1/admin/users/${account.id}`,{method:'DELETE',fixtureAdmin:true}); }
        catch { failures++; }
      }
      requireThat(failures===0,'cleanup_error'); return {resources:accounts.length};
    });
  }
}
