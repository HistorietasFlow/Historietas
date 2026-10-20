import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loader = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-community-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("loader da Comunidade preserva consultas sociais, limites e fallbacks", () => {
  assert.match(loader, /export async function carregarNotificacoesComunidadeSupabase\(/);
  assert.match(loader, /\.from\("comunidade_posts"\)[\s\S]*?\.eq\("autor_id", userId\)[\s\S]*?\.limit\(120\)/);
  assert.match(loader, /\.from\("comunidade_comentarios"\)[\s\S]*?\.in\("post_id", postIds\)[\s\S]*?\.neq\("autor_id", userId\)[\s\S]*?\.order\("criado_em", \{ ascending: false \}\)[\s\S]*?\.limit\(160\)/);
  assert.match(loader, /supabase\.rpc\(\s*"listar_minhas_denuncias",\s*\{\s*p_limite: 80,/);
  assert.match(loader, /\.from\("seguindo_usuarios"\)[\s\S]*?\.eq\("seguido_id", userId\)[\s\S]*?\.limit\(60\)/);
  assert.match(loader, /\.from\("solicitacoes_seguidores"\)[\s\S]*?\.eq\("destinatario_id", userId\)[\s\S]*?\.limit\(60\)/);
});

test("loader da Comunidade preserva capitulos, reviews e bloqueio 18+", () => {
  assert.match(loader, /\.from\("obras"\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.limit\(80\)/);
  assert.match(loader, /\.from\("capitulos"\)[\s\S]*?\.in\("obra_id", obraIds\)[\s\S]*?\.eq\("publicado", true\)[\s\S]*?\.limit\(600\)/);
  assert.match(loader, /\.from\("comentarios_capitulos"\)[\s\S]*?\.in\("capitulo_id", capituloIds\)[\s\S]*?\.neq\("user_id", userId\)[\s\S]*?\.limit\(200\)/);
  assert.match(loader, /\.eq\("tipo_publicacao", "Review"\)[\s\S]*?\.neq\("autor_id", userId\)[\s\S]*?\.limit\(80\)/);
  assert.match(loader, /ehClassificacao18\(obraDoAutor\.classificacaoIndicativa\)/);
});

test("loader da Comunidade preserva perfis, notificacoes e ordenacao", () => {
  assert.match(loader, /await carregarPerfisNotificacoes\(Array\.from\(userIdsParaProfiles\)\)/);
  assert.match(loader, /criarPerfilHrefNotificacao\(seguidorId, perfilSeguidor\.nome\)/);
  assert.match(loader, /criarHrefLeituraCapitulo\(/);
  assert.match(loader, /obterTextoStatusDenunciaComunidadeNotificacao\(status\)/);
  for (const tipo of [
    "comentario-comunidade",
    "novo-seguidor",
    "solicitacao-seguidor",
    "comentario-capitulo",
    "review-comunidade",
    "denuncia-comunidade",
  ]) {
    assert.match(loader, new RegExp(`tipo: "${tipo}"`));
  }
  assert.match(loader, /lida: idsLidos\.has\(id\)/);
  assert.match(loader, /\.sort\(\s*\(a, b\) => dataNotificacao\(b\) - dataNotificacao\(a\)\s*\)/);
});

test("pagina delega o loader da Comunidade sem manter a implementacao", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-supabase-community-loader";/);
  assert.match(pagina, /carregarNotificacoesComunidadeSupabase\(\s*usuarioAtualId,\s*notificacoesLidasIds\s*\)/);
  assert.doesNotMatch(pagina, /async function carregarNotificacoesComunidadeSupabase\(/);
});

test("loader da Comunidade nao adiciona estado visual, persistencia ou mutacoes", () => {
  for (const proibido of ["useEffect", "useState", "localStorage", "window", "document"]) {
    assert.ok(!loader.includes(proibido), `referencia indevida: ${proibido}`);
  }

  assert.doesNotMatch(loader, /\.(insert|update|delete|upsert)\(/);
  assert.doesNotMatch(loader, /return\s*<[^>]/);
});
