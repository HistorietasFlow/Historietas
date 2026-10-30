import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const followViewState = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-follow-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const actionSheetsViewState = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-action-sheets-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado visual de seguimento preserva a ordem dos helpers e os valores derivados", () => {
  assert.match(
    followViewState,
    /obterEstadoSeguimentoPerfilAutor\(\{[\s\S]*?\}\);[\s\S]*?obterDadosAcaoSeguimentoPerfilAutor\(\{[\s\S]*?\}\);[\s\S]*?obterApresentacaoBotaoSeguimentoPerfilAutor\(\{/,
  );

  for (const campo of [
    "autorChavePerfil",
    "autorNormalizadoParaSeguir",
    "seguindoAutor",
    "seguindoPerfilAtual",
    "solicitacaoSeguimentoPendente",
    "seguidoresTotal",
    "seguindoTotalPerfil",
    "seguidoresPerfilHref",
    "seguindoPerfilHref",
    "obrasSeguidasPerfilHref",
    "ariaLabelSeguimento",
    "titleSeguimento",
    "rotuloSeguimento",
    "botaoSeguimentoAtivo",
    "opacidadeBotaoSeguimento",
    "cursorBotaoSeguimento",
  ]) {
    assert.match(followViewState, new RegExp(`\\b${campo}\\b`));
  }

  assert.doesNotMatch(followViewState, /useState|useEffect|supabase|localStorage/);
});

test("estado visual dos action sheets preserva fallbacks e tradução", () => {
  for (const trecho of [
    "obraMenuAberta",
    "dadosSheetObraPerfil",
    "obterDadosSheetObraPerfilAutor",
    "traduzirTexto: (item) => traduzirTextoPerfilAutor(item, language)",
    "obterRotulosAcoesColecoesObraPerfilAutor",
    "bibliotecaMenuAberto",
    "dadosSheetBibliotecaPerfil",
    "obterDadosSheetBibliotecaPerfilAutor",
    "obterMetaMenuBibliotecaPerfil",
    "obterRotulosAcoesColecoesBibliotecaPerfil",
    "obterRotuloAcaoRemoverBibliotecaPerfil(abaBibliotecaPerfil)",
  ]) {
    assert.match(actionSheetsViewState, new RegExp(trecho.replaceAll("(", "\\(").replaceAll(")", "\\)")));
  }

  assert.match(actionSheetsViewState, /\? obterDadosSheetObraPerfilAutor\([\s\S]*?: null;/);
  assert.match(actionSheetsViewState, /\? obterDadosSheetBibliotecaPerfilAutor\([\s\S]*?: null;/);
  assert.match(actionSheetsViewState, /\? obterMetaMenuBibliotecaPerfil\(bibliotecaMenuAberto\)[\s\S]*?: "";/);
  assert.match(actionSheetsViewState, /\? obterRotuloAcaoRemoverBibliotecaPerfil\(abaBibliotecaPerfil\)[\s\S]*?: "";/);
  assert.doesNotMatch(actionSheetsViewState, /useState|useEffect|supabase|localStorage/);
});

test("página delega os dois estados derivados e mantém estilos e callbacks", () => {
  assert.match(
    pagina,
    /import \{ obterEstadoVisualSeguimentoPerfilAutor \} from "\.\/lib\/profile-follow-view-state";/,
  );
  assert.match(
    pagina,
    /import \{ obterEstadoVisualActionSheetsPerfilAutor \} from "\.\/lib\/profile-action-sheets-view-state";/,
  );
  assert.match(pagina, /obterEstadoVisualSeguimentoPerfilAutor\(\{/);
  assert.match(pagina, /obterEstadoVisualActionSheetsPerfilAutor\(\{/);
  assert.match(
    pagina,
    /const estiloBaseBotaoSeguimento = botaoSeguimentoAtivo[\s\S]*?\? profileActiveButtonStyle[\s\S]*?: profilePrimaryButtonStyle;/,
  );
  assert.match(pagina, /<ProfileActionSheets[\s\S]*?onReportObra=\{\(\) =>/);
  assert.match(pagina, /onToggleBibliotecaWantToRead=\{\(\) =>/);
});
