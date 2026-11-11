import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,connect} from 'node:tls';
import test from 'node:test';
import {monitorCaFile,verifyMonitorCa} from '../scripts/chapter-monitor-ca.mjs';

test('CA oficial versionada tem pin DER, assinatura e validade verificadas',()=>{
  const ca=verifyMonitorCa();
  assert.match(ca.subject,/CN=Supabase Root 2021 CA/);
  assert.equal(ca.subject,ca.issuer);
  assert.throws(()=>verifyMonitorCa(monitorCaFile,Date.parse(ca.validFrom)-1));
  assert.throws(()=>verifyMonitorCa(monitorCaFile,Date.parse(ca.validTo)));
  assert.throws(()=>verifyMonitorCa(monitorCaFile,NaN));
});

test('CA ausente, invalida ou acrescida de outro material falha fechada',()=>{
  const dir=mkdtempSync(join(tmpdir(),'historietas-ca-'));
  try {
    const file=join(dir,'invalid.crt');
    assert.throws(()=>verifyMonitorCa(file));
    for(const pem of ['', 'not a certificate', 'x'.repeat(4097),
      readFileSync(monitorCaFile,'utf8')+'\nnot part of the CA']) {
      writeFileSync(file,pem);
      assert.throws(()=>verifyMonitorCa(file));
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('workflow fixa CA e schedule aprovado sem download, downgrade ou novo secret',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/agendamento-monitor.yml',import.meta.url),'utf8');
  assert.match(workflow,/node qa\/scripts\/chapter-monitor-ca\.mjs/);
  assert.match(workflow,/PGSSLROOTCERT: \$\{\{ github\.workspace \}\}\/qa\/certificates\/supabase-prod-ca-2021\.crt/);
  assert.doesNotMatch(workflow,/ca-certificates\.crt|curl |wget |rejectUnauthorized|NODE_TLS_REJECT_UNAUTHORIZED/m);
  assert.equal((workflow.match(/^\s+schedule:/gm)??[]).length,1);
  assert.match(workflow,/^\s+- cron: '10,25,40,55 \* \* \* \*'$/m);
  assert.match(workflow,/if: vars\.AGENDAMENTO_MONITOR_AUTORIZADO == 'true'/);
  assert.match(workflow,/PGSSLMODE: verify-full/);
  assert.match(workflow,/PGUSER: historietas_agendamento_monitor_login\./);
  assert.match(workflow,/if: \$\{\{ !inputs\.teste_entrega \}\}/);
});

test('TLS real local: CA correta conecta; CA errada, ausente e hostname incorreto nao conectam',async()=>{
  // PKI sintetica SOMENTE loopback: nao substitui a CA oficial nem homologa o pooler.
  const dir=mkdtempSync(join(tmpdir(),'historietas-ca-tls-'));
  let server;
  const sockets=new Set();
  try {
    const gitOpenSsl=join(process.env.ProgramFiles??'C:/Program Files','Git','usr','bin','openssl.exe');
    const openssl=process.platform==='win32'&&existsSync(gitOpenSsl)?gitOpenSsl:'openssl';
    execFileSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-days','1',
      '-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost',
      '-out',join(dir,'server.crt'),'-keyout',join(dir,'server.key')],{stdio:'pipe',windowsHide:true});
    const ca=readFileSync(join(dir,'server.crt'));
    assert.throws(()=>verifyMonitorCa(join(dir,'server.crt')),'Nao aceitar a raiz sintetica como oficial.');
    server=createServer({cert:ca,key:readFileSync(join(dir,'server.key'))});
    server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
    server.on('tlsClientError',()=>{}); // Os clientes abaixo devem rejeitar a negociacao.
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const handshake=(changes={})=>new Promise((resolve,reject)=>{
      const socket=connect({host:'127.0.0.1',port:server.address().port,
        servername:'localhost',ca,rejectUnauthorized:true,...changes});
      socket.once('secureConnect',()=>{socket.destroy();resolve(true);});
      socket.once('error',error=>{socket.destroy();reject(error);});
    });
    assert.equal(await handshake(),true);
    await assert.rejects(handshake({ca:readFileSync(monitorCaFile)}),/self.signed|certificate/i);
    await assert.rejects(handshake({ca:[]}),/self.signed|certificate/i);
    await assert.rejects(handshake({servername:'wrong.invalid'}),{code:'ERR_TLS_CERT_ALTNAME_INVALID'});
  } finally {
    for(const socket of sockets) socket.destroy();
    if(server) await new Promise(resolve=>server.close(resolve));
    rmSync(dir,{recursive:true,force:true});
  }
});
