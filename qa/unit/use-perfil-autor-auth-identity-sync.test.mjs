import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-auth-identity-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a sincronização da identidade autenticada", () => {
  assert.match(pagina, /usePerfilAutorAuthIdentitySync/);
  assert.match(
    pagina,
    /usePerfilAutorAuthIdentitySync\(\{[\s\S]*?avatarInputRef,[\s\S]*?identidadeAutenticadaPerfilRef,[\s\S]*?versaoConsultaAutenticacaoPerfilRef,[\s\S]*?setUsuarioIdLogado,[\s\S]*?setAutenticacaoCarregada,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarUsuarioAutenticadoPerfil\(/);
});

test("hook preserva limpeza completa ao trocar identidade", () => {
  for (const trecho of [
    "setPerfilUsuarioRemoto(null)",
    "setObras([])",
    "setAutoresSeguidos([])",
    "setObrasFavoritas([])",
    "setObrasConcluidas([])",
    "setObrasSeguidasBiblioteca([])",
    "setPerfisAutoresSalvos({})",
    "setEditorPerfilAberto(false)",
    "setAvatarArquivoPerfilEditor(null)",
    "setTopFiveCurtidaSalvando(false)",
    'setMensagemAcao("")',
  ]) {
    assert.equal(source.includes(trecho), true, trecho);
  }
  assert.match(source, /setTotaisInteracoesObras\(totaisInteracoesObrasPerfilVazio\)/);
  assert.match(source, /avatarInputRef\.current\.value = ""/);
});

test("hook preserva getUser, guarda de versão e assinatura de auth", () => {
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /execucaoAutenticacaoPerfilAutorEstaAtual\(\{/);
  assert.match(source, /atualizarIdentidadeAutenticadaPerfilAutor\(/);
  assert.match(source, /supabase\.auth\.onAuthStateChange\(/);
  assert.match(source, /versaoConsultaAutenticacaoPerfilRef\.current \+= 1/);
  assert.match(source, /subscription\.unsubscribe\(\)/);
});

test("hook mantém usuarioIdLogado sob propriedade exclusiva da autenticação", () => {
  assert.equal((source.match(/setUsuarioIdLogado\(/g) || []).length, 1);
  assert.equal((pagina.match(/setUsuarioIdLogado\(/g) || []).length, 0);
});
