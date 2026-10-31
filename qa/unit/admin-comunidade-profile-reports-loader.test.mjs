import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-denuncias-perfis-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);

test("loader de denúncias de perfil preserva consultas, normalização e contexto", () => {
  assert.match(source, /from\("denuncias_perfis"\)/);
  assert.match(
    source,
    /"id, denunciante_id, denunciado_id, perfil_nome, perfil_url, motivo, descricao, status, criado_em, atualizado_em"/,
  );
  assert.match(source, /order\("criado_em", \{ ascending: false \}\)/);
  assert.match(source, /limit\(200\)/);
  assert.match(source, /erroOpcionalIgnoravel\(denunciasErro\)/);
  assert.match(source, /return \[\];/);
  assert.match(source, /throw denunciasErro/);
  assert.match(source, /motivo: String\(denuncia\.motivo \|\| "outro"\)/);
  assert.match(source, /atualizadoEm: String\(denuncia\.atualizado_em \|\| denuncia\.criado_em \|\| ""\)/);
  assert.match(source, /new Set\(/);
  assert.match(source, /\.in\("user_id", perfilIds\)/);
  assert.match(source, /\.in\("id", perfilIds\)/);
  assert.match(source, /limit\(1000\)/);
  assert.match(source, /denuncianteNome: nomesPorId\.get\(denuncia\.denuncianteId\) \|\| "Usuário"/);
  assert.match(source, /denuncia\.perfilNome \|\|[\s\S]*?"Usuário denunciado"/);
  assert.match(source, /criarHrefPerfilDenunciado\(denuncia\)/);
});

test("Admin Comunidade mantém a orquestração de denúncias de perfil", () => {
  assert.match(hook, /buscarDenunciasPerfisModeracao/);
  assert.match(
    hook,
    /async function carregarDenunciasPerfis\(\) \{\s*const denunciasComContexto = await buscarDenunciasPerfisModeracao\(\);\s*setDenunciasPerfis\(denunciasComContexto\);/,
  );
  assert.match(hook, /Promise\.all\([\s\S]*?carregarDenunciasPerfis\(\)/);
  assert.match(page, /useAdminComunidadeInitialData\(/);
  assert.doesNotMatch(source, /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
