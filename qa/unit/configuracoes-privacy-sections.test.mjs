import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const content = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-page-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const perfil = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-privacy-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const abas = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-profile-tab-visibility-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const diario = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-diary-privacy-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("seções de privacidade preservam controles, filtros e textos", () => {
  assert.match(perfil, /export function ConfiguracoesProfilePrivacySection\(/);
  assert.match(
    perfil,
    /from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(perfil, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.match(perfil, /deveMostrar: DeveMostrarConfiguracoes;/);
  assert.doesNotMatch(perfil, /type TraduzirTexto =/);
  assert.match(perfil, /checked=\{privacidade\.perfilPrivado\}/);
  assert.match(perfil, /onChange=\{onAlternarPerfilPrivado\}/);
  assert.match(perfil, /checked=\{privacidade\.aprovarNovosSeguidores\}/);
  assert.match(perfil, /onChange=\{onAlternarAprovacaoNovosSeguidores\}/);
  assert.match(perfil, /<ConfiguracoesBlockedUsersPanel/);
  assert.match(perfil, /onRecarregar=\{onCarregarUsuariosBloqueados\}/);
  assert.match(perfil, /onDesbloquear=\{onDesbloquearUsuario\}/);
  assert.match(perfil, /Privacidade do perfil/);

  assert.match(
    abas,
    /export function ConfiguracoesProfileTabVisibilitySection\(/,
  );
  assert.match(
    abas,
    /from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(abas, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.match(abas, /onAtualizarPrivacidade: AtualizarPrivacidadeConfiguracoes;/);
  assert.doesNotMatch(abas, /type TraduzirTexto =/);
  for (const campo of [
    "visibilidadeObras",
    "visibilidadeSobre",
    "visibilidadeDiario",
    "visibilidadeComunidade",
    "visibilidadeBiblioteca",
    "visibilidadeAtividades",
  ]) {
    assert.match(abas, new RegExp(`"${campo}"`));
  }
  assert.equal((abas.match(/style=\{privacySelectStyle\}/g) || []).length, 6);
  assert.match(abas, /Visibilidade das abas/);

  assert.match(diario, /export function ConfiguracoesDiaryPrivacySection\(/);
  assert.match(
    diario,
    /from "\.\.\/lib\/configuracoes-callback-types";/,
  );
  assert.match(diario, /traduzirTexto: TraduzirTextoConfiguracoes;/);
  assert.match(diario, /onAtualizarPrivacidade: AtualizarPrivacidadeConfiguracoes;/);
  assert.doesNotMatch(diario, /type TraduzirTexto =/);
  assert.match(diario, /visibilidadeAvaliacaoDiario: visibilidade/);
  assert.match(diario, /mostrarAvaliacaoDiario: visibilidade !== "somente_eu"/);
  assert.match(diario, /quemPodeAvaliarDiario: quemPodeAvaliar/);
  assert.match(diario, /"quemPodeComentarDiario"/);
  assert.match(diario, /Privacidade e interações do Diário/);
});

test("Configurações delega somente a apresentação das seções de privacidade", () => {
  assert.match(pagina, /<ConfiguracoesPageContent/);
  for (const componente of [
    "ConfiguracoesProfilePrivacySection",
    "ConfiguracoesProfileTabVisibilitySection",
    "ConfiguracoesDiaryPrivacySection",
  ]) {
    assert.match(content, new RegExp(`import \\{ ${componente} \\}`));
    assert.match(content, new RegExp(`<${componente}`));
  }

  assert.match(content, /onAlternarPerfilPrivado=\{onAlternarPerfilPrivado\}/);
  assert.match(
    content,
    /onAlternarAprovacaoNovosSeguidores=\{onAlternarAprovacaoNovosSeguidores\}/,
  );
  assert.match(
    content,
    /onAplicarPrivacidadeAtualizada=\{onAplicarPrivacidadeAtualizada\}/,
  );
  assert.match(content, /onAtualizarPrivacidade=\{onAtualizarPrivacidade\}/);
  assert.doesNotMatch(content, /<ConfiguracoesBlockedUsersPanel/);
  assert.doesNotMatch(content, /<Toggle/);
});

test("seções de privacidade não introduzem runtime de dados", () => {
  for (const source of [perfil, abas, diario]) {
    assert.doesNotMatch(
      source,
      /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
    );
  }
});
