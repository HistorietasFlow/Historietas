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

test("não persiste nem aplica resultado de conta anterior após resposta atrasada", async () => {
  const { atualizarIdentidadeAutenticadaPerfilAutor, execucaoCarregamentoPerfilAutorEstaAtual } =
    await import("../../app/perfil-autor/lib/profile-auth-identity.ts");
  let identidadeAtual = { usuarioId: "conta-a", versao: 1 };
  const identidadeEsperada = identidadeAtual;
  let resolver;
  const resposta = new Promise((resolve) => { resolver = resolve; });
  const efeitos = [];
  const carregar = (async () => {
    await resposta;
    const atual = () => execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada: false, identidadeEsperada, identidadeAtual,
    });
    if (!atual()) return;
    efeitos.push("persistir");
    if (!atual()) return;
    efeitos.push("commit");
  })();
  identidadeAtual = atualizarIdentidadeAutenticadaPerfilAutor(
    identidadeAtual, "conta-b",
  ).identidade;
  resolver();
  await carregar;
  assert.deepEqual(efeitos, []);
});

test("cancelamento no unmount bloqueia persistência e commit atrasados", async () => {
  const { execucaoCarregamentoPerfilAutorEstaAtual } =
    await import("../../app/perfil-autor/lib/profile-auth-identity.ts");
  const identidade = { usuarioId: "conta-a", versao: 1 };
  let cancelada = false;
  let resolver;
  const resposta = new Promise((resolve) => { resolver = resolve; });
  const efeitos = [];
  const carregar = (async () => {
    await resposta;
    if (!execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada, identidadeEsperada: identidade, identidadeAtual: identidade,
    })) return;
    efeitos.push("persistir", "commit");
  })();
  cancelada = true;
  resolver();
  await carregar;
  assert.deepEqual(efeitos, []);
});

test("hook verifica identidade antes de persistir e antes do commit final", () => {
  const persistencia = source.indexOf("salvarJsonUsuarioPerfilAutor(");
  const commit = source.indexOf("setPerfilUsuarioRemoto(perfilUsuarioRemotoCarregado)");
  const guarda = "if (!execucaoCarregamentoEstaAtual())";
  assert.ok(persistencia > 0 && commit > persistencia);
  assert.ok(source.lastIndexOf(guarda, persistencia) > source.indexOf("await carregarInteracoesCapitulosSupabase("));
  assert.ok(source.lastIndexOf(guarda, commit) > persistencia);
});
