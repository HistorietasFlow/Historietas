import assert from 'node:assert/strict';
import {execFileSync, spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';
import {checkDatabase, monitorSql} from '../scripts/chapter-scheduling-monitor.mjs';

test('identidade SQL do monitor: autenticacao real, TLS, ACL e timeouts locais',async t=>{
  const invocation=criarInvocacaoStatusSupabase();
  const raw=execFileSync(invocation.comando,invocation.argumentos,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
  const env=Object.fromEntries(raw.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{
    const i=l.indexOf('='),v=l.slice(i+1).trim();return [l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];
  }));
  for(const value of [env.DB_URL,env.API_URL])
    assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(value).hostname),'Somente Supabase local.');
  const names=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],
    {encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);
  assert.equal(names.length,1);assert.match(names[0],/^supabase_db_/);
  const container=names[0],login='historietas_agendamento_monitor_login';
  const poolerName=container.replace('supabase_db_','supabase_pooler_');
  const options={encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']};
  const docker=(args,input)=>execFileSync('docker',args,{...options,input}).trim();
  const restartPooler=async()=>{
    // Senhas efemeras mudam entre testes; Supavisor pode reter autenticacao e
    // sessoes anteriores. Invalidar somente a fixture, nunca repetir um login.
    docker(['restart',poolerName]);
    const deadline=Date.now()+30000;
    while(Date.now()<deadline) {
      const health=docker(['inspect','--format','{{.State.Health.Status}}',poolerName]);
      if(health==='healthy') return;
      assert.notEqual(health,'unhealthy','Pooler descartavel indisponivel.');
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert.fail('Pooler descartavel nao iniciou.');
  };
  const adminArgs=['exec','-i',container,'psql','-U','postgres','-d','postgres','-XqAt','-w','-v','ON_ERROR_STOP=1'];
  const sql=s=>docker(adminArgs,s);
  // Exclusivamente configuracao do container descartavel; nunca a conexao do monitor.
  const configure=s=>execFileSync('docker',['exec','-i','--env','PGPASSWORD',container,
    'psql','-h','127.0.0.1','-U','supabase_admin','-d','postgres','-XqAt','-w','-v','ON_ERROR_STOP=1'],
  {...options,input:s,env:{...process.env,PGPASSWORD:decodeURIComponent(new URL(env.DB_URL).password)}}).trim();
  const quote=s=>`'${s.replaceAll("'","''")}'`;
  const config=JSON.parse(sql(`select jsonb_object_agg(name,setting) from pg_settings
    where name in ('ssl','ssl_cert_file','ssl_key_file','hba_file');`));
  assert.match(config.hba_file,/^\/[a-zA-Z0-9_/.\-]+$/);
  // Nunca substituir uma credencial existente, mesmo no ambiente local.
  assert.equal(sql(`select rolpassword is null from pg_authid where rolname='${login}';`),'t');
  assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  const before=sql(`select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]'))
    from historietas_privado.capitulo_cache_outbox x;`);
  const password=randomBytes(32).toString('hex'); // Credencial efemera, exclusivamente local.
  const localDir=mkdtempSync(join(tmpdir(),'historietas-monitor-'));
  const remoteDir=docker(['exec','--user','postgres',container,'mktemp','-d','/tmp/historietas-monitor-XXXXXX']);
  assert.match(remoteDir,/^\/tmp\/historietas-monitor-[a-zA-Z0-9]+$/);
  const originalHba=join(localDir,'original-pg_hba.conf');
  docker(['cp',`${container}:${config.hba_file}`,originalHba]);
  const connectionArgs=['exec','-i','--env','PGPASSWORD','--env','PGSSLMODE','--env','PGSSLROOTCERT',
    '--env','PGOPTIONS','--env','PGGSSENCMODE',
    container,'psql','-h','localhost','-p','5432','-U',login,'-d','postgres','-XqAt','-w',
    '-v','ON_ERROR_STOP=1','-v','VERBOSITY=sqlstate'];
  const connect=(s,changes={})=>execFileSync('docker',connectionArgs,{...options,input:s,
    env:{...process.env,PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:`${remoteDir}/server.crt`,
      PGOPTIONS:'',PGGSSENCMODE:'disable',...changes}}).trim();
  const denied=(s,code,changes)=>{
    let caught;
    try {connect(s,changes);} catch(e) {caught=e;}
    assert.ok(caught,'A operacao proibida nao pode ter sucesso.');
    assert.match(String(caught.stderr),code);
  };
  try {
    await restartPooler();
    const gitOpenSsl=join(process.env.ProgramFiles??'C:/Program Files','Git','usr','bin','openssl.exe');
    const openssl=process.platform==='win32'&&existsSync(gitOpenSsl)?gitOpenSsl:'openssl';
    execFileSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes',
      '-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost',
      '-out',join(localDir,'server.crt'),'-keyout',join(localDir,'server.key')],options);
    for(const file of ['server.crt','server.key']) docker(['cp',join(localDir,file),`${container}:${remoteDir}/${file}`]);
    docker(['exec','--user','root',container,'chown','postgres:postgres',`${remoteDir}/server.crt`,`${remoteDir}/server.key`]);
    docker(['exec','--user','postgres',container,'chmod','600',`${remoteDir}/server.key`]);
    const hba=join(localDir,'pg_hba.conf');
    writeFileSync(hba,`hostssl all ${login} 127.0.0.1/32 scram-sha-256\n`+
      `hostssl all ${login} ::1/128 scram-sha-256\n`+
      `host all ${login} 127.0.0.1/32 reject\nhost all ${login} ::1/128 reject\n`+
      readFileSync(originalHba,'utf8'));
    // hba_file e postmaster-only; trocar apenas o arquivo da fixture e recarregar.
    docker(['cp',hba,`${container}:${config.hba_file}`]);
    configure(`alter system set ssl='on'; alter system set ssl_cert_file=${quote(`${remoteDir}/server.crt`)};
      alter system set ssl_key_file=${quote(`${remoteDir}/server.key`)};
      alter role ${login} password ${quote(password)}; select pg_reload_conf();`);

    await t.test('sessao autentica aplica defaults, SET ROLE explicito e snapshot fixo em READ ONLY',async()=>{
      assert.deepEqual(JSON.parse(connect(`select jsonb_build_array(session_user,current_user,
        current_setting('default_transaction_read_only'),current_setting('statement_timeout'),
        current_setting('lock_timeout'),current_setting('idle_in_transaction_session_timeout'));`)),
      [login,login,'on','5s','500ms','5s']);
      const value=JSON.parse(connect(monitorSql));
      assert.equal(value.conexao.sessao,login);assert.equal(value.conexao.papel,'historietas_agendamento_monitor');
      assert.equal(value.snapshot.saude.habilitado,false);
      // Configuracao gerenciada e validada pelas unidades; este adaptador usa
      // TCP/TLS local real para exercitar o MESMO SQL, sem alegar homologar Supavisor remoto.
      const report=await checkDatabase({AGENDAMENTO_MONITOR_PROJECT_REF:'abcdefghijklmnopqrst',
        PGUSER:`${login}.abcdefghijklmnopqrst`,PGHOST:'aws-0-sa-east-1.pooler.supabase.com',PGPORT:'5432',
        PGDATABASE:'postgres',PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:'fixture'},
      async(_cmd,args)=>({stdout:connect(args.at(-1))}));
      assert.ok(report.codigos.includes('RUNNER_DESATIVADO'));
      assert.ok(!report.codigos.includes('BANCO_INDISPONIVEL'));
    });
    await t.test('Supavisor SESSION local preserva a identidade SQL do usuario com sufixo do projeto',()=>{
      const project=container.slice('supabase_db_'.length);
      const pooler=execFileSync('docker',['ps','--filter',`name=^supabase_pooler_${project}$`,'--format','{{.Names}}'],options).trim();
      assert.equal(pooler,`supabase_pooler_${project}`,'Habilite db.pooler SESSION no descartavel.');
      // O tenant da CLI (ex.: pooler-dev) nao e necessariamente project_id.
      const tenant=docker(['exec','-i',container,'psql','-U','postgres','-d','_supabase','-XqAt','-w',
        '-v','ON_ERROR_STOP=1'],'select external_id from _supavisor.tenants;');
      assert.match(tenant,/^[a-zA-Z0-9_-]+$/,'Um unico tenant local conhecido.');
      const args=[...connectionArgs];
      args[args.indexOf('localhost')]=pooler;args[args.indexOf('-U')+1]=`${login}.${tenant}`;
      // O pooler local da CLI nao fornece TLS. TLS verify-full e comprovado
      // na conexao direta acima; o workflow continua recusando downgrade.
      const value=JSON.parse(execFileSync('docker',args,{...options,input:monitorSql,
        env:{...process.env,PGPASSWORD:password,PGSSLMODE:'disable',PGSSLROOTCERT:'',PGGSSENCMODE:'disable',
          PGOPTIONS:'-c statement_timeout=5000 -c lock_timeout=500 -c idle_in_transaction_session_timeout=5000 -c default_transaction_read_only=on'}}));
      assert.equal(value.conexao.sessao,login);assert.equal(value.conexao.papel,'historietas_agendamento_monitor');
      assert.equal(value.conexao.somenteLeitura,'on');assert.equal(value.snapshot.saude.habilitado,false);
    });
    await t.test('senha incorreta e TLS nao confiavel falham sem fallback',()=>{
      // Erros do handshake libpq antecedem VERBOSITY do psql e nao exibem SQLSTATE.
      denied('select 1;',/password authentication failed/,{PGPASSWORD:randomBytes(32).toString('hex')});
      denied('select 1;',/rejected|rejects|28000/i,{PGSSLMODE:'disable'});
      denied('select 1;',/certificate|root certificate/i,{PGSSLROOTCERT:'/etc/ssl/certs/ca-certificates.crt'});
      const wrongHost=[...connectionArgs];wrongHost[wrongHost.indexOf('localhost')]='127.0.0.1';
      assert.throws(()=>execFileSync('docker',wrongHost,{...options,input:'select 1;',
        env:{...process.env,PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:`${remoteDir}/server.crt`}}),
      error=>/certificate.*does not match|server certificate.*match/i.test(String(error.stderr)));
    });
    await t.test('sem acesso direto, escalada ou escrita, inclusive ao desativar read-only',()=>{
      denied('select historietas_privado.snapshot_monitor_capitulos();',/42501/);
      for(const s of ['select * from public.profiles;','select * from auth.users;',
        'set role postgres;','set role service_role;',
        'set role historietas_agendamento_monitor; select historietas_privado.acionar_runner_capitulos();',
        'begin read write; set local role historietas_agendamento_monitor; update historietas_privado.capitulo_runner_controle set habilitado=true;'])
        denied(s,/42501/);
      denied('update public.profiles set nome=nome;',/25006|42501/);
    });
    await t.test('statement_timeout real cancela instrucao sem publicar ou alterar eventos',()=>{
      denied('select pg_sleep(6);',/57014/);
    });
    await t.test('idle timeout real encerra transacao abandonada',async()=>{
      const child=spawn('docker',connectionArgs,{windowsHide:true,stdio:['pipe','pipe','pipe'],
        env:{...process.env,PGPASSWORD:password,PGSSLMODE:'verify-full',PGSSLROOTCERT:`${remoteDir}/server.crt`}});
      let stderr='',timer;
      child.stderr.on('data',d=>{stderr+=d;});
      const ended=new Promise((resolve,reject)=>{child.once('exit',resolve);child.once('error',reject);});
      child.stdout.once('data',()=>{timer=setTimeout(()=>child.stdin.end('select 1;\n'),6000);});
      child.stdin.write("begin; select 'QA_READY';\n");
      try {assert.notEqual(await ended,0);assert.match(stderr,/25P03/);}
      finally {clearTimeout(timer);child.stdin.end();}
    });
    await t.test('lock_timeout real do snapshot aborta diante de escrita concorrente',async()=>{
      const child=spawn('docker',adminArgs,{windowsHide:true,stdio:['pipe','pipe','pipe']});
      let output='',timer;
      const ended=new Promise(resolve=>child.once('exit',resolve));
      const ready=new Promise((resolve,reject)=>{
        timer=setTimeout(()=>reject(Error('Barreira local nao iniciou.')),10000);
        child.stdout.on('data',d=>{output+=d;if(output.includes('QA_READY'))resolve();});
        child.once('error',reject);
      });
      child.stdin.write('begin; lock table historietas_privado.capitulo_runner_controle in access exclusive mode;\n\\echo QA_READY\n');
      try {await ready;clearTimeout(timer);denied(monitorSql,/55P03/);}
      finally {clearTimeout(timer);child.stdin.end('rollback;\n');assert.equal(await ended,0);}
    });
    await t.test('TEMP nao injeta codigo no snapshot privilegiado nem na verificacao da fonte',()=>{
      assert.equal(sql('select count(*) from historietas_privado.capitulo_runner_monitor;'),'0',
        'Descartavel sem configuracao operacional; nunca substituir monitor existente.');
      // Configuracao sintetica sem extensao/job, somente para atingir o ramo
      // que consulta pg_extension. Nenhum runner ou Cron e habilitado.
      sql(`insert into historietas_privado.capitulo_runner_monitor
        (singleton,job_id,extensao_oid,identidade_job,intervalo_segundos)
        values(true,-1,0,'{}',60);`);
      try {
        const value=JSON.parse(connect(`begin read write;
          create function pg_temp.canario_monitor() returns name language plpgsql as $$
          begin raise exception 'TEMP_CANARIO_EXECUTADO' using errcode='HSC01'; end $$;
          create temp view pg_extension as select 0::oid as oid,
            pg_temp.canario_monitor() as extname,'1.6.4'::text as extversion;
          set local role historietas_agendamento_monitor;
          select historietas_privado.snapshot_monitor_capitulos(); rollback;`));
        assert.equal(value.versao,1);assert.equal(value.fonteValida,false);
      } finally {
        sql('delete from historietas_privado.capitulo_runner_monitor where singleton and job_id=-1;');
      }
    });
    assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
    assert.equal(sql(`select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]'))
      from historietas_privado.capitulo_cache_outbox x;`),before);
  } finally {
    docker(['cp',originalHba,`${container}:${config.hba_file}`]);
    sql(`alter role ${login} password null;`);
    await restartPooler();
    configure(`${Object.entries(config).filter(([k])=>k!=='hba_file').map(([k,v])=>`alter system set ${k}=${quote(v)};`).join('\n')}
      select pg_reload_conf();`);
    // Arquivos exclusivos deste teste, nunca objetos/volumes do usuario.
    docker(['exec',container,'rm','-r','--',remoteDir]);
    rmSync(localDir,{recursive:true});
  }
});
