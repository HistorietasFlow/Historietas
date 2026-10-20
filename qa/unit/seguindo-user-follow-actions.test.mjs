import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-user-follow-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const pageActions = readFileSync(
  new URL("../../app/seguindo/hooks/use-seguindo-page-actions.ts", import.meta.url),
  "utf8",
);

test("hook preserva seguir, cancelar solicitação e deixar de seguir usuário", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /await deixarDeSeguirUsuarioPrivacidade\(usuarioIdLimpo\)/,
  );
  assert.match(
    hook,
    /setUsuariosSeguidos\(\(usuariosAtuais\) =>[\s\S]*?usuarioSeguido\.id !== usuarioIdLimpo/,
  );
  assert.match(
    hook,
    /setAtividadesSeguindo\(\(atividadesAtuais\) =>[\s\S]*?atividade\.usuarioId !== usuarioIdLimpo/,
  );
  assert.match(
    hook,
    /const solicitacaoPendente = solicitacoesEnviadasIds\.includes\(usuarioId\);/,
  );
  assert.match(
    hook,
    /await cancelarSolicitacaoSeguidor\(usuarioId\)/,
  );
  assert.match(
    hook,
    /const resultado = await solicitarOuSeguirUsuario\(usuarioId\);/,
  );
  assert.match(
    hook,
    /resultado\.estado === "solicitado"/,
  );
  assert.match(
    hook,
    /resultado\.estado !== "seguindo"/,
  );
  assert.match(
    hook,
    /criadoEm: new Date\(\)\.toISOString\(\)/,
  );
  assert.match(
    hook,
    /setUsuariosSugestoesBusca\(\(usuariosAtuais\) =>[\s\S]*?usuarioAtual\.id !== usuarioId/,
  );
});

test("página delega as ações de seguir usuário ao hook", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoPageActions \} from "\.\/hooks\/use-seguindo-page-actions";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?deixarDeSeguirUsuario,[\s\S]*?seguirUsuarioSugestao,[\s\S]*?\} = useSeguindoPageActions\(\{[\s\S]*?usuarioLogadoId,[\s\S]*?usuarioListaAlterandoId,[\s\S]*?usuarioSugestaoSeguindoId,[\s\S]*?solicitacoesEnviadasIds,[\s\S]*?setUsuariosSeguidos,[\s\S]*?setAtividadesSeguindo,[\s\S]*?setSolicitacoesEnviadasIds,[\s\S]*?setUsuariosSugestoesBusca,[\s\S]*?\}\);/,
  );
  assert.match(pageActions, /useSeguindoUserFollowActions\(\{/);
  assert.doesNotMatch(
    pagina,
    /async function deixarDeSeguirUsuario\(/,
  );
  assert.doesNotMatch(
    pagina,
    /async function seguirUsuarioSugestao\(/,
  );
  assert.doesNotMatch(pagina, /cancelarSolicitacaoSeguidor/);
  assert.doesNotMatch(pagina, /solicitarOuSeguirUsuario/);
  assert.doesNotMatch(pagina, /deixarDeSeguirUsuarioPrivacidade/);
});
