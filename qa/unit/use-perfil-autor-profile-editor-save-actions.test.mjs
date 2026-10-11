import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-profile-editor-save-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega salvarEdicaoPerfilAutor para o hook", () => {
  assert.match(pagina, /usePerfilAutorProfileEditorSaveActions/);
  assert.match(
    pagina,
    /const \{ salvarEdicaoPerfilAutor \} =\s*usePerfilAutorProfileEditorSaveActions\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /async function salvarEdicaoPerfilAutor\(/,
  );
  assert.match(source, /async function salvarEdicaoPerfilAutor\(\)/);
});

test("hook preserva identidade, validações e lock do editor", () => {
  assert.match(source, /execucaoCarregamentoPerfilAutorEstaAtual\(/);
  assert.match(source, /Não foi possível confirmar este perfil para edição\./);
  assert.match(source, /O nome do perfil precisa ter pelo menos 3 caracteres\./);
  assert.match(source, /O @username precisa ter pelo menos 3 caracteres\./);
  assert.match(source, /setSalvandoEditorPerfil\(true\)/);
  assert.match(source, /setMensagemAcao\("Salvando perfil\.\.\."\)/);
});

test("hook preserva upload, Auth, Storage e sincronização das obras", () => {
  assert.match(source, /enviarAvatarPerfilUsuarioSupabase\(/);
  assert.match(source, /salvarPerfilUsuarioSupabase\(/);
  assert.match(source, /supabase\.auth\.updateUser\(/);
  assert.match(source, /supabase\.storage[\s\S]*?\.from\(AVATAR_STORAGE_BUCKET\)[\s\S]*?\.remove/);
  assert.match(source, /sincronizarNomeAutorObrasSupabase\(/);
});

test("hook preserva fallbacks locais e atualização final do editor", () => {
  assert.match(source, /salvarJsonUsuarioPerfilAutor\(/);
  assert.match(source, /carregarJsonUsuarioPerfilAutor\(/);
  assert.match(source, /obraPertenceAoUsuarioPerfilAutor\(/);
  assert.match(source, /normalizarObra\(/);
  assert.match(source, /setAvatarArquivoPerfilEditor\(null\)/);
  assert.match(source, /setEditorPerfilAberto\(false\)/);
  assert.match(source, /setSalvandoEditorPerfil\(false\)/);
  assert.match(source, /Perfil salvo neste aparelho\. Supabase:/);
  assert.match(source, /Perfil atualizado\. Não consegui sincronizar o nome nas obras\./);
});
