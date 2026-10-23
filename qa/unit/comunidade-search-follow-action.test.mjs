import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-search-follow-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("alternarSeguirUsuarioBuscaComunidade preserva guardas, lock e estado otimista", () => {
  assert.match(acao, /export async function alternarSeguirUsuarioBuscaComunidade\(/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acao, /if \(usuarioAlvo\.id === usuario\.id\) \{/);
  assert.match(acao, /const chaveAcao = `seguir-usuario:\$\{usuarioAlvo\.id\}`;/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /const estavaSeguindo = usuariosSeguidosIds\.includes\(usuarioAlvo\.id\);/);
  assert.match(acao, /const deveSeguir = !estavaSeguindo;/);
  assert.match(acao, /const idsAnteriores = usuariosSeguidosIds;/);
  assert.match(acao, /setUsuarioSeguindoId\(usuarioAlvo\.id\);/);
  assert.match(
    acao,
    /setUsuariosSeguidosIds\(\(idsAtuais\) =>[\s\S]*?deveSeguir[\s\S]*?Array\.from\(new Set\(\[\.\.\.idsAtuais, usuarioAlvo\.id\]\)\)[\s\S]*?idsAtuais\.filter\(\(id\) => id !== usuarioAlvo\.id\)/,
  );
});

test("alternarSeguirUsuarioBuscaComunidade preserva persistencia, rollback e feedback", () => {
  assert.match(
    acao,
    /await salvarSeguindoUsuarioComunidade\([\s\S]*?usuario\.id,[\s\S]*?usuarioAlvo\.id,[\s\S]*?deveSeguir/,
  );
  assert.match(
    acao,
    /if \(!resultado\.ok\) \{[\s\S]*?setUsuariosSeguidosIds\(idsAnteriores\);[\s\S]*?resultado\.erro \|\| "Não foi possível atualizar este usuário agora\."/,
  );
  assert.match(acao, /const seguindoAgora = resultado\.estado === "seguindo";/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(
    acao,
    /resultado\.estado === "solicitado"[\s\S]*?Solicitação para seguir \$\{usuarioAlvo\.nome\} enviada\.[\s\S]*?Você começou a seguir \$\{usuarioAlvo\.nome\}\.[\s\S]*?Você deixou de seguir \$\{usuarioAlvo\.nome\}\./,
  );
  assert.match(
    acao,
    /finally \{[\s\S]*?finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);[\s\S]*?setUsuarioSeguindoId\(\(idAtual\) =>[\s\S]*?idAtual === usuarioAlvo\.id \? null : idAtual/,
  );
});

test("Comunidade delega somente o follow da busca ao módulo", () => {
  assert.match(
    pagina,
    /import \{ alternarSeguirUsuarioBuscaComunidade \} from "\.\/components\/community-search-follow-action";/,
  );
  assert.match(
    pagina,
    /const alternarSeguirUsuarioBusca = \(usuarioAlvo: UsuarioBuscaComunidade\) =>[\s\S]*?alternarSeguirUsuarioBuscaComunidade\(\{[\s\S]*?usuarioAlvo,[\s\S]*?usuariosSeguidosIds,[\s\S]*?feedbackTimerRef,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function alternarSeguirUsuarioBusca\(/);
  assert.doesNotMatch(pagina, /await salvarSeguindoUsuarioComunidade\(/);
  assert.match(pagina, /atualizarVisibilidadePostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function atualizarVisibilidadePost\(/);
  assert.match(pagina, /function denunciarConteudo\(/);
  assert.match(pagina, /const comentarPost = \(/);
});
