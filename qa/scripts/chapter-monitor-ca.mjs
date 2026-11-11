import {X509Certificate} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const monitorCaFile = new URL('../certificates/supabase-prod-ca-2021.crt',import.meta.url);
const fingerprint='80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA';

export function verifyMonitorCa(file=monitorCaFile,now=Date.now()) {
  const pem=readFileSync(file,'utf8');
  if(pem.length>4096) throw Error('invalid monitor CA');
  const ca=new X509Certificate(pem);
  if(pem.replaceAll('\r\n','\n').trim()!==ca.toString().trim() ||
      ca.fingerprint256!==fingerprint || !ca.ca || !ca.verify(ca.publicKey) ||
      !Number.isFinite(now) || now<Date.parse(ca.validFrom) || now>=Date.parse(ca.validTo))
    throw Error('invalid monitor CA');
  return ca;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {verifyMonitorCa();}
  catch {console.error('CA oficial do monitor ausente, invalida ou vencida.');process.exitCode=1;}
}
