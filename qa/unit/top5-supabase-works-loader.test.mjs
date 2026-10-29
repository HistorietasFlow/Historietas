import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-supabase-works-loader.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o carregamento Supabase de obras", async () => {
  const [loader, page] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(loader, /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(loader, /import \{ normalizarObraSupabaseTop5 \} from "\.\/top5-work-normalizers";/);
  assert.match(loader, /ObraTop5,/);
  assert.match(loader, /SupabaseObraTop5Row,/);
  assert.match(loader, /export async function carregarObrasSupabaseTop5/);
  assert.match(loader, /\.from\("obras"\)/);
  assert.match(
    loader,
    /"id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,publicado,visualizacoes,slug,criada_em,atualizado_em"/,
  );
  assert.match(loader, /\.eq\("publicado", true\)/);
  assert.match(loader, /\.order\("criada_em", \{ ascending: false \}\)/);
  assert.match(loader, /\.limit\(160\)/);
  assert.match(loader, /error \|\| !Array\.isArray\(data\)/);
  assert.match(loader, /normalizarObraSupabaseTop5\(/);
  assert.match(loader, /obra as SupabaseObraTop5Row/);
  assert.match(loader, /\[\] as ObraTop5\[\]/);

  assert.match(
    page,
    /import \{ carregarDadosIniciaisTop5 \} from "\.\/lib\/top5-initial-data-loader";/,
  );
  assert.doesNotMatch(page, /async function carregarObrasSupabaseTop5/);
  assert.doesNotMatch(page, /carregarObrasSupabaseTop5\(\)/);
  assert.match(
    page,
    /import \{ prepararConteudoInicialTop5 \} from "\.\/lib\/top5-initial-content";/,
  );
  assert.doesNotMatch(page, /carregarObrasLocaisTop5/);
  assert.doesNotMatch(page, /function mesclarObrasTop5/);
  assert.doesNotMatch(page, /mesclarObrasTop5\(/);
  assert.match(page, /prepararConteudoInicialTop5\(\s*userId,\s*obrasSupabase,\s*\)/);
  assert.doesNotMatch(page, /normalizarObraSupabaseTop5/);
  assert.doesNotMatch(page, /SupabaseObraTop5Row/);
  assert.doesNotMatch(page, /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.doesNotMatch(page, /supabase\.auth\.getUser\(\)/);

  for (const forbidden of [
    "react",
    "useEffect",
    "auth",
    "useRouter",
    "localStorage",
    "top5-selection-storage",
    ".insert(",
    ".delete(",
    ".update(",
    "style={",
    "18+",
  ]) {
    assert.doesNotMatch(
      loader,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
