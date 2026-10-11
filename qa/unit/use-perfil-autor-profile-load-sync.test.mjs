import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-profile-load-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega o carregamento principal do perfil", () => {
  assert.match(pagina, /usePerfilAutorProfileLoadSync/);
  assert.match(
    pagina,
    /usePerfilAutorProfileLoadSync\(\{[\s\S]*?autenticacaoCarregada,[\s\S]*?queryPerfilAtual,[\s\S]*?usuarioIdLogado,[\s\S]*?identidadeAutenticadaPerfilRef,[\s\S]*?setAbaPerfil,[\s\S]*?setPerfilUsuarioRemoto,[\s\S]*?setObras,[\s\S]*?setCarregando,[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(pagina, /async function carregarPerfilAutor\(/);
});

test("hook preserva parâmetros de rota e guardas de identidade", () => {
  assert.match(source, /new URLSearchParams\(queryPerfilAtual\)/);
  assert.match(source, /params\.get\("autor"\)/);
  assert.match(source, /params\.get\("autorId"\) \|\| params\.get\("id"\) \|\| params\.get\("userId"\)/);
  assert.match(source, /normalizarAbaPerfilAutor\(params\.get\("aba"\)\)/);
  assert.match(source, /execucaoCarregamentoPerfilAutorEstaAtual\(\{/);
  assert.ok((source.match(/if \(!execucaoCarregamentoEstaAtual\(\)\)/g) || []).length >= 5);
});

test("hook preserva loaders, mesclagem, interações e persistência local", () => {
  for (const trecho of [
    "await carregarObrasPublicadasSupabase()",
    "await carregarEstadoUsuarioSupabase()",
    "await carregarPerfilUsuarioSupabase(",
    "await carregarObrasPublicadasPorIdsSupabase(",
    "await carregarInteracoesCapitulosSupabase(",
    "aplicarInteracoesNasObras(",
    "mesclarObrasPorIdSlug(",
    "mesclarObrasLocalStoragePerfilAutor(",
    "carregarPerfisAutores(usuarioIdAtual)",
  ]) {
    assert.equal(source.includes(trecho), true, trecho);
  }
  assert.match(source, /salvarJsonUsuarioPerfilAutor\(/);
  assert.match(source, /salvarListaIdsPerfilBiblioteca\(/);
});

test("hook preserva commit final e cancelamento no unmount", () => {
  assert.match(source, /setPerfilUsuarioRemoto\(perfilUsuarioRemotoCarregado\)/);
  assert.match(source, /setObras\(obrasMescladas\)/);
  assert.match(source, /setAutoresSeguidos\(autoresSeguidosNormalizados\)/);
  assert.match(source, /setObrasFavoritas\(obrasFavoritasNormalizadas\)/);
  assert.match(source, /setObrasConcluidas\(obrasConcluidasNormalizadas\)/);
  assert.match(source, /setObrasSeguidasBiblioteca\(obrasSeguidasBibliotecaNormalizadas\)/);
  assert.match(source, /setCarregando\(false\)/);
  assert.match(source, /componenteAtivo = false;/);
});
