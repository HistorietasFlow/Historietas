import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-post-pinning-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("alternarFixadoPostComunidade preserva guardas e estado de fixacao", () => {
  assert.match(acao, /export async function alternarFixadoPostComunidade\(/);
  assert.match(
    acao,
    /if \(!usuarioEhAdmin\) \{[\s\S]*?Apenas administradores podem fixar publicações\./,
  );
  assert.match(acao, /if \(postFixandoId === post\.id\) \{/);
  assert.match(acao, /setPostFixandoId\(post\.id\);/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(acao, /const novoEstadoFixado = !post\.fixado;/);
});

test("alternarFixadoPostComunidade preserva Supabase, estado e feedback", () => {
  assert.match(
    acao,
    /await atualizarFixacaoPostSupabaseComunidade\([\s\S]*?post\.id,[\s\S]*?novoEstadoFixado/,
  );
  assert.match(
    acao,
    /if \(!resultadoAtualizacaoFixacao\.sucesso\) \{[\s\S]*?formatarErroSupabase\([\s\S]*?"Erro ao atualizar fixado"/,
  );
  assert.match(
    acao,
    /fixado\?: boolean \| null;[\s\S]*?fixado_em\?: string \| null;[\s\S]*?fixado_por\?: string \| null;/,
  );
  assert.match(
    acao,
    /atualizarFixacaoPostNoEstadoComunidade\([\s\S]*?postsAtuais,[\s\S]*?post\.id,[\s\S]*?dadosFixado/,
  );
  assert.match(
    acao,
    /novoEstadoFixado[\s\S]*?Publicação fixada no topo\.[\s\S]*?Publicação desafixada\./,
  );
  assert.match(
    acao,
    /finally \{[\s\S]*?setPostFixandoId\(\(postAtualId\) =>[\s\S]*?postAtualId === post\.id \? null : postAtualId/,
  );
});

test("Comunidade delega somente alternarFixadoPost ao modulo", () => {
  assert.match(
    pagina,
    /import \{ alternarFixadoPostComunidade \} from "\.\/components\/community-post-pinning-action";/,
  );
  assert.match(
    pagina,
    /const alternarFixadoPost = \(post: PostComunidade\) =>[\s\S]*?alternarFixadoPostComunidade\(\{[\s\S]*?post,[\s\S]*?usuarioEhAdmin,[\s\S]*?feedbackTimerRef,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function alternarFixadoPost\(/);
  assert.doesNotMatch(pagina, /await atualizarFixacaoPostSupabaseComunidade\(/);
  assert.match(pagina, /removerPostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerPost\(/);
});
