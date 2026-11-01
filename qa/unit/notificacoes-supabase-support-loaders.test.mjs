import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const perfilLoader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-profile-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const problemasTecnicosLoader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-technical-issues-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const comunidadeLoader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-community-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const comunidadeDataLoader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-community-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const hookInicial = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

test("loader de perfis preserva selecoes complementares e aliases", () => {
  assert.match(perfilLoader, /export async function carregarPerfisNotificacoes\(/);
  assert.match(perfilLoader, /Array\.from\(\s*new Set\(/);
  assert.match(perfilLoader, /\.map\(\(id\) => id\.trim\(\)\)/);
  assert.match(perfilLoader, /\.filter\(\(id\) => idObraSupabaseValido\(id\)\)/);
  assert.match(perfilLoader, /new Map<string, PerfilNotificacao>\(\)/);
  assert.match(perfilLoader, /const selecoesProfiles = \[/);
  assert.match(perfilLoader, /"id,user_id,nome,avatar_url"/);
  assert.match(perfilLoader, /"id,user_id,nome_usuario,avatar_url"/);
  assert.match(perfilLoader, /"id,user_id,username,avatar_url"/);
  assert.match(perfilLoader, /"id,user_id,display_name,avatar_url"/);
  assert.match(perfilLoader, /"id,user_id,apelido,avatar_url"/);
  assert.match(perfilLoader, /\.from\("profiles"\)\s*\.select\(campos\)\s*\.in\(coluna, idsBusca\)\s*\.limit\(1000\)/);
  assert.match(perfilLoader, /normalizarPerfilNotificacao\(row, "", "Usuário"\)/);
  assert.match(perfilLoader, /await carregarPorColuna\("user_id", ids\)/);
  assert.match(perfilLoader, /const idsFaltantes = ids\.filter\(\(id\) => !perfis\.has\(id\)\)/);
  assert.match(perfilLoader, /await carregarPorColuna\("id", idsFaltantes\)/);
});

test("loader de problemas tecnicos preserva RPC, fallback e ordenacao", () => {
  assert.match(
    problemasTecnicosLoader,
    /export async function carregarNotificacoesProblemasTecnicosSupabase\(/,
  );
  assert.match(problemasTecnicosLoader, /const userIdLimpo = userId\.trim\(\)/);
  assert.match(problemasTecnicosLoader, /if \(!userIdLimpo\) \{\s*return \[\];/);
  assert.match(
    problemasTecnicosLoader,
    /supabase\.rpc\(\s*"listar_meus_problemas_tecnicos",\s*\{\s*p_limite: 80,\s*\}\s*\)/,
  );
  assert.match(problemasTecnicosLoader, /if \(error \|\| !Array\.isArray\(data\)\) \{\s*return \[\];/);
  assert.match(problemasTecnicosLoader, /new Set\(notificacoesLidasIds\)/);
  assert.match(problemasTecnicosLoader, /obterStatusProblemaTecnicoNotificacao\(status\)/);
  assert.match(problemasTecnicosLoader, /`problema-tecnico-\$\{problemaId\}-\$\{status\}`/);
  assert.match(problemasTecnicosLoader, /link: "\/ajuda#problema-tecnico"/);
  assert.match(problemasTecnicosLoader, /tipo: "problema-tecnico"/);
  assert.match(problemasTecnicosLoader, /new Date\(\)\.toISOString\(\)/);
  assert.match(problemasTecnicosLoader, /\.sort\(\s*\(a, b\) => dataNotificacao\(b\) - dataNotificacao\(a\)\s*\)/);
  assert.match(problemasTecnicosLoader, /catch \{\s*return \[\];/);
});

test("fronteiras delegam os loaders de suporte sem reter implementacoes locais", () => {
  assert.match(
    comunidadeDataLoader,
    /from "\.\/notificacoes-supabase-profile-loader";/,
  );
  assert.match(
    hookInicial,
    /from "\.\.\/lib\/notificacoes-supabase-technical-issues-loader";/,
  );
  assert.match(comunidadeDataLoader, /await carregarPerfisNotificacoes\(/);
  assert.match(hookInicial, /carregarNotificacoesProblemasTecnicosSupabase\(/);
  assert.match(pagina, /useNotificacoesInitialLoad\(/);
  assert.doesNotMatch(comunidadeLoader, /async function carregarPerfisNotificacoes\(/);
  assert.doesNotMatch(comunidadeDataLoader, /async function carregarPerfisNotificacoes\(/);
  assert.doesNotMatch(comunidadeLoader, /import \{ supabase \}/);
  assert.doesNotMatch(comunidadeLoader, /carregarPerfisNotificacoes/);
  assert.doesNotMatch(
    pagina,
    /async function carregarNotificacoesProblemasTecnicosSupabase\(/,
  );
});

test("loaders de suporte nao adicionam estado visual ou persistencia local", () => {
  for (const loader of [perfilLoader, problemasTecnicosLoader]) {
    for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
      assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
    }

    assert.doesNotMatch(loader, /return\s*<[^>]/);
  }
});
