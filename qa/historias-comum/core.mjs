import { createHash } from 'node:crypto';
export const BASE_SHA = '5b8d439f5bd50d14ab53e0fdddfe8f84d30a5f86';
export const AUX_VERSION = '20260826000637';
export const ROLES = Object.freeze(['A','B','C','D','anon']);
export class SafeError extends Error {
  constructor(code, http = 0) { super(code); this.code = code; this.http = http; }
}
export function requireThat(condition, code = 'unexpected_rows') {
  if (!condition) throw new SafeError(code);
}
export function loopback(raw) {
  const url = new URL(raw);
  requireThat(url.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(url.hostname)
    && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash, 'unsafe_destination');
  return url.origin;
}
export function runnerOnly(env = process.env) {
  requireThat(env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted'
    && env.HISTORIAS_DISPOSABLE === '1', 'unsafe_environment');
}
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function intersectionQuery({ a, b, slugPrefix, cursor, limit = 20, offset }) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
  requireThat(uuid.test(a) && uuid.test(b) && a !== b, 'invalid_query');
  requireThat(/^qa-common-[0-9a-f-]+-$/.test(slugPrefix), 'invalid_query');
  requireThat(Number.isInteger(limit) && limit > 0 && limit <= 20, 'invalid_query');
  requireThat(cursor === undefined || uuid.test(cursor), 'invalid_query');
  requireThat(offset === undefined || (Number.isInteger(offset) && offset >= 0 && offset <= 1000), 'invalid_query');
  const q = new URLSearchParams({
    select:'id,a:favoritos!inner(obra_id),b:favoritos!inner(obra_id)',
    'a.user_id':`eq.${a}`, 'b.user_id':`eq.${b}`,
    'a.visibilidade':'eq.publico', 'b.visibilidade':'eq.publico',
    publicado:'eq.true', classificacao_indicativa:'in.(Livre,10+,12+,14+,16+)',
    slug:`like.${slugPrefix}*`, order:'id.asc', limit:String(limit),
  });
  if (cursor !== undefined) q.set('id',`gt.${cursor}`);
  if (offset !== undefined) q.set('offset',String(offset));
  return `rest/v1/obras?${q}`;
}
export function exactResponse(response, expectedIds, expectedTotal) {
  requireThat(response.status === 200 || response.status === 206, 'response_error');
  requireThat(Array.isArray(response.data), 'unexpected_rows');
  const total = response.range?.match(/\/(\d+)$/)?.[1];
  requireThat(total !== undefined && Number(total) === expectedTotal, 'unexpected_count');
  const actual = response.data.map(row => row.id);
  requireThat(JSON.stringify(actual) === JSON.stringify(expectedIds), 'unexpected_rows');
  return { rows:actual.length, total:Number(total) };
}
// Transport never logs request/response data; service credential is restricted
// to fixture creation/deletion at Auth admin endpoints, not permission checks.
export class Api {
  constructor(url, key, service, fetcher = fetch) {
    requireThat(Boolean(key&&service)&&key!==service,'admin_scope');
    this.url = loopback(url); this.key = key; this.service = service; this.fetcher = fetcher;
  }
  async request(actor, path, { method = 'GET', body, fixtureAdmin = false } = {}) {
    requireThat(!path.startsWith('/') && !path.includes('://') && !path.includes('..'), 'unsafe_destination');
    const isAdminPath = /^auth\/v1\/admin\/users(?:\/[0-9a-f-]{36})?$/.test(path);
    const favoriteSetup = path === 'rest/v1/favoritos' && method === 'POST';
    requireThat(!fixtureAdmin || ((isAdminPath && ['POST','DELETE'].includes(method)) || favoriteSetup), 'admin_scope');
    requireThat(fixtureAdmin || actor?.token !== this.service, 'admin_scope');
    const token = fixtureAdmin ? this.service : actor?.token;
    const headers = { apikey: fixtureAdmin ? this.service : this.key, 'Content-Type':'application/json', Prefer:'count=exact,return=representation,resolution=merge-duplicates' };
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await this.fetcher(`${this.url}/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect:'error', cache:'no-store' });
    } catch { throw new SafeError('transport_error'); }
    let data;
    try { const text = await response.text(); data = text ? JSON.parse(text) : null; }
    catch { throw new SafeError('response_error',response.status); }
    return { status:response.status, data, range:response.headers.get('content-range') };
  }
  async ok(actor,path,options) {
    const r = await this.request(actor,path,options);
    if (r.status < 200 || r.status > 299) throw new SafeError('response_error',r.status);
    return r.data;
  }
}
const NUMERIC = new Set(['Actual Rows','Actual Loops','Actual Startup Time','Actual Total Time','Planning Time','Execution Time','Shared Hit Blocks','Shared Read Blocks','Shared Dirtied Blocks','Shared Written Blocks','Temp Read Blocks','Temp Written Blocks','Rows Removed by Filter','Plan Rows','Total Cost','Startup Cost']);
const INDEXES = new Set(['obras_pkey','favoritos_pkey','favoritos_user_id_obra_id_key','favoritos_user_criado_idx','favoritos_obra_id_idx']);
export function sanitizePlan(value) {
  if (Array.isArray(value)) return value.map(sanitizePlan);
  if (!value || typeof value !== 'object') return {};
  const result = {};
  for (const [key,item] of Object.entries(value)) {
    if (NUMERIC.has(key) && typeof item === 'number' && Number.isFinite(item)) result[key] = item;
    else if (['Plan','Plans'].includes(key) && typeof item === 'object') result[key] = sanitizePlan(item);
    else if (key === 'Relation Name' && ['obras','favoritos'].includes(item)) result[key] = item;
    else if (key === 'Index Name' && INDEXES.has(item)) result[key] = item;
    else if (key === 'Node Type' && ['Limit','Sort','Aggregate','Nested Loop','Hash Join','Merge Join','Seq Scan','Index Scan','Index Only Scan','Bitmap Heap Scan','Bitmap Index Scan','Result','Memoize','Materialize','Hash','Append','Gather','Gather Merge','Incremental Sort','Unique'].includes(item)) result[key] = item;
  }
  return result;
}
export function parsePendingOutput(stdout) {
  requireThat(!/(^|\n)not ok\b|Looks like you failed/.test(stdout), 'sql_assertion');
  requireThat((stdout.match(/^ok \d+ - /gm) ?? []).length === 2 && /^1\.\.2\s*$/m.test(stdout), 'sql_assertion');
  const markers = ['page1 authenticated','deep keyset authenticated','exact count authenticated','page1 anon'];
  const plans = [];
  for (const label of markers) {
    const start = stdout.indexOf(`PLAN ${label}\n`);
    requireThat(start >= 0, 'sql_plan');
    const tail = stdout.slice(start+`PLAN ${label}\n`.length).trimStart();
    const end = tail.indexOf('\n]');
    requireThat(tail.startsWith('[') && end >= 0, 'sql_plan');
    let parsed; try { parsed = JSON.parse(tail.slice(0,end+2)); } catch { throw new SafeError('sql_plan'); }
    requireThat(parsed.length === 1 && parsed[0].Plan && Number.isFinite(parsed[0]['Execution Time']), 'sql_plan');
    plans.push({ id:label.replaceAll(' ','_'), plan:sanitizePlan(parsed) });
  }
  return { assertions:2, plans };
}
