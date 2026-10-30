import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../app/ajuda/components/ajuda-support-tickets.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

test("os chamados recentes preservam carregamento, lista, status, nota e data", () => {
  assert.match(componente, /export function AjudaSupportTickets/);
  assert.match(componente, /ProblemaTecnicoResumo\[\]/);
  assert.match(componente, /carregando: boolean/);
  assert.match(componente, /pt: "Meus chamados recentes"/);
  assert.match(componente, /en: "My recent tickets"/);
  assert.match(componente, /es: "Mis casos recientes"/);
  assert.match(componente, /\{carregando \? \(/);
  assert.match(componente, /pt: "Carregando\.\.\."/);
  assert.match(componente, /en: "Loading\.\.\."/);
  assert.match(componente, /es: "Cargando\.\.\."/);
  assert.match(componente, /\{!carregando \? \(/);
  assert.match(componente, /chamados\.map\(\(chamado\) => \(/);
  assert.match(componente, /key=\{chamado\.id\}/);
  assert.match(componente, /chamado\.titulo/);
  assert.match(componente, /chamado\.descricao/);
  assert.match(componente, /rotuloStatusProblema\(chamado\.status, language\)/);
  assert.match(componente, /chamado\.observacaoAdmin/);
  assert.match(componente, /pt: "Resposta da equipe"/);
  assert.match(componente, /formatarDataChamado\(chamado\.criadoEm, language\)/);
  assert.doesNotMatch(componente, /usuarioAutenticado/);
  assert.doesNotMatch(componente, /supabase|useEffect|useState/);
});

test("a página mantém a condição externa de autenticação e loading", () => {
  assert.match(
    pagina,
    /import \{\s*AjudaSupportTickets,\s*\} from "\.\/components\/ajuda-support-tickets";/,
  );
  assert.match(
    pagina,
    /usuarioAutenticado &&\s*\(carregandoChamados \|\| chamadosTecnicos\.length > 0\) \? \(\s*<AjudaSupportTickets[\s\S]*?carregando=\{carregandoChamados\}[\s\S]*?chamados=\{chamadosTecnicos\}/,
  );
  assert.doesNotMatch(pagina, /supportTicketsSectionStyle/);
  assert.doesNotMatch(pagina, /chamadosTecnicos\.map/);
});
