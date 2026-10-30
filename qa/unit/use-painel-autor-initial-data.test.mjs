import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("usePainelAutorInitialData preserva todo o lifecycle de dados inicial", () => {
  for (const contract of [
    "if (verificandoUsuario || !usuarioIdLogado)",
    "let componenteAtivo = true;",
    "async function carregarDadosPainelAutor()",
    "await Promise.resolve();",
    "setCarregandoDados(true);",
    "lerStorageUsuarioPainel(",
    "JSON.parse(obrasSalvasTexto)",
    "normalizarObraPainel(obra, obraIndex)",
    "restaurarArquivoObraComBackup(",
    "marcarObrasComDonoPainel(",
    "filtrarObrasDoUsuarioPainel(",
    "aplicarNomeProfileNasObrasPainel(",
    "carregarListaIdsPainel(",
    "filtrarListaPorObrasDoUsuario(",
    "setObras(obrasUsuarioLogado);",
    "setObrasFavoritas(obrasFavoritasUsuario);",
    "setObrasConcluidas(obrasConcluidasUsuario);",
    "carregarPainelAutorSupabase(",
    "sincronizarBackupArquivosObras(obrasFinais, usuarioIdLogado);",
    "salvarJsonStorageUsuarioPainel(STORAGE_KEY, usuarioIdLogado, obrasFinais);",
    "console.warn(\"Não consegui atualizar o Painel do Autor:\", error);",
    "void carregarDadosPainelAutor();",
    "componenteAtivo = false;",
  ]) {
    assert.ok(hookSource.includes(contract), contract);
  }
  assert.match(
    hookSource,
    /setObras\(obrasUsuarioLogado\);[\s\S]*?setObrasFavoritas\(obrasFavoritasUsuario\);[\s\S]*?setObrasConcluidas\(obrasConcluidasUsuario\);[\s\S]*?carregarPainelAutorSupabase\(/,
  );
  assert.match(
    hookSource,
    /sincronizarBackupArquivosObras\([\s\S]*?salvarJsonStorageUsuarioPainel\([\s\S]*?salvarListaIdsUsuarioPainel\([\s\S]*?FAVORITES_STORAGE_KEY[\s\S]*?salvarListaIdsUsuarioPainel\([\s\S]*?COMPLETED_STORAGE_KEY/,
  );
  assert.doesNotMatch(hookSource, /FOLLOW_STORAGE_KEY/);
  assert.doesNotMatch(hookSource, /<div|<section|<main/);
});

test("página mantém estados e delega somente o lifecycle inicial", () => {
  assert.match(
    pageSource,
    /import \{ usePainelAutorInitialData \} from "\.\/hooks\/use-painel-autor-initial-data";/,
  );
  assert.match(
    pageSource,
    /usePainelAutorInitialData\(\{[\s\S]*?usuarioIdLogado,[\s\S]*?verificandoUsuario,[\s\S]*?setObras,[\s\S]*?setObrasFavoritas,[\s\S]*?setObrasConcluidas,[\s\S]*?setCarregandoDados,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pageSource, /async function carregarDadosPainelAutor\(/);
});
