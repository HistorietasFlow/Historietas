import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-diary-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("loader do Diario preserva anotacoes, interacoes e fallbacks complementares", () => {
  assert.match(loader, /export async function carregarNotificacoesDiarioSupabase\(/);
  assert.match(loader, /if \(!userId\) \{\s*return \[\];/);
  assert.match(loader, /\.from\("diario_anotacoes"\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.order\("atualizado_em", \{ ascending: false \}\)[\s\S]*?\.limit\(120\)/);
  assert.match(loader, /Promise\.all\(\[\s*supabase[\s\S]*?\.from\("diario_anotacao_curtidas"\)[\s\S]*?\.limit\(160\),[\s\S]*?\.from\("diario_anotacao_comentarios"\)[\s\S]*?\.limit\(160\)/);
  assert.match(loader, /Interações do Diário são complementares às demais notificações/);
});

test("loader do Diario preserva atividades seguidas, filtro publico e bloqueio 18+", () => {
  assert.match(loader, /\.from\("seguindo_usuarios"\)[\s\S]*?\.eq\("seguidor_id", userId\)[\s\S]*?\.limit\(120\)/);
  assert.match(loader, /\.from\("diario_atividades"\)[\s\S]*?\.eq\("visibilidade", "publico"\)[\s\S]*?\.in\("tipo", \["concluiu_obra", "avaliou_obra"\]\)[\s\S]*?\.limit\(100\)/);
  assert.match(loader, /\.from\("obras"\)[\s\S]*?\.select\("id, titulo, slug, publicado, classificacao_indicativa"\)[\s\S]*?\.limit\(200\)/);
  assert.match(loader, /if \(ehClassificacao18\(classificacaoIndicativa\)\) \{\s*return;/);
});

test("loader do Diario preserva perfis, textos, leitura e ordenacao", () => {
  assert.match(loader, /await carregarPerfisNotificacoes\(/);
  assert.match(loader, /criarDiarioPerfilHrefNotificacao\(userId\)/);
  assert.match(loader, /obterRotuloTipoAnotacaoDiarioNotificacao\(/);
  assert.match(loader, /tipo: "curtida-diario"/);
  assert.match(loader, /tipo: "comentario-diario"/);
  assert.match(loader, /tipo: "atividade-diario"/);
  assert.match(loader, /lida: idsLidos\.has\(id\)/);
  assert.match(
    loader,
    /\.sort\(\s*\(a, b\) => dataNotificacao\(b\) - dataNotificacao\(a\)\s*\)/,
  );
});

test("pagina delega o loader do Diario sem manter a implementacao", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-supabase-diary-loader";/);
  assert.match(pagina, /carregarNotificacoesDiarioSupabase\(\s*usuarioAtualId,\s*notificacoesLidasIds\s*\)/);
  assert.doesNotMatch(pagina, /async function carregarNotificacoesDiarioSupabase\(/);
});

test("loader do Diario nao adiciona estado visual, persistencia ou mutacoes", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
    assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
  }

  assert.doesNotMatch(loader, /\.(insert|update|delete|upsert)\(/);
  assert.doesNotMatch(loader, /return\s*<[^>]/);
});
