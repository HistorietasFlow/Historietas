import assert from "node:assert/strict";
const origem="https://historietas-28f6eys37-historietas.vercel.app";
async function previa(papel,token){
 const cookies=new Map();
 if(token) cookies.set("sb-cirxcvigrfyzbvzbfjvu-auth-token",encodeURIComponent(JSON.stringify({access_token:token})));
 let url=new URL("/api/obras/qa-previa-seguidores/previa",origem);
 url.search=process.env.QA_PREVIA_SHARE;
 for(let i=0;i<5;i++){
  if(url.origin!==origem)throw Error("redirecionamento externo");
  const r=await fetch(url,{redirect:"manual",headers:{cookie:[...cookies].map(([k,v])=>k+"="+v).join("; ")}});
  for(const c of r.headers.getSetCookie()){const par=c.split(";")[0],p=par.indexOf("=");cookies.set(par.slice(0,p),par.slice(p+1));}
  if([301,302,303,307,308].includes(r.status)){url=new URL(r.headers.get("location"),url);continue;}
  const body=await r.json().catch(()=>null);
  const ok=papel==="seguidor"?r.status===200&&Object.keys(body??{}).join()==="trecho"&&body.trecho==="A".repeat(599)+"🌿":r.status===404&&body!==null&&Object.keys(body).length===0;
  console.log("RESULTADO_QA",papel,r.status,ok,/private/.test(r.headers.get("cache-control")??"")&&/no-store/.test(r.headers.get("cache-control")??""));
  return ok&&/private/.test(r.headers.get("cache-control")??"")&&/no-store/.test(r.headers.get("cache-control")??"");
 }
 throw Error("limite de redirecionamentos");
}
const resultados=[];
for(const p of ["seguidor","outro"]){
 const auth=await fetch("https://cirxcvigrfyzbvzbfjvu.supabase.co/auth/v1/token?grant_type=password",{method:"POST",redirect:"error",headers:{apikey:process.env.QA_PREVIA_PUB,"content-type":"application/json"},body:JSON.stringify({email:"qa-previa-"+p+"@example.invalid",password:process.env["QA_PREVIA_SENHA_"+p.toUpperCase()]})});
 console.log("AUTH_QA",p,auth.status);
 assert.equal(auth.status,200);
 const sessao=await auth.json();assert.equal(sessao.user.email,"qa-previa-"+p+"@example.invalid");assert.ok(sessao.access_token);
 resultados.push(await previa(p,sessao.access_token));
}
resultados.push(await previa("anon",null));
assert.ok(resultados.every(Boolean));
