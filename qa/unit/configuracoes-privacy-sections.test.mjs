import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
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
  assert.match(diario, /visibilidadeAvaliacaoDiario: visibilidade/);
  assert.match(diario, /mostrarAvaliacaoDiario: visibilidade !== "somente_eu"/);
  assert.match(diario, /quemPodeAvaliarDiario: quemPodeAvaliar/);
  assert.match(diario, /"quemPodeComentarDiario"/);
  assert.match(diario, /Privacidade e interações do Diário/);
});

test("Configurações delega somente a apresentação das seções de privacidade", () => {
  for (const componente of [
    "ConfiguracoesProfilePrivacySection",
    "ConfiguracoesProfileTabVisibilitySection",
    "ConfiguracoesDiaryPrivacySection",
  ]) {
    assert.match(pagina, new RegExp(`import \\{ ${componente} \\}`));
    assert.match(pagina, new RegExp(`<${componente}`));
  }

  assert.match(pagina, /onAlternarPerfilPrivado=\{alternarPerfilPrivado\}/);
  assert.match(
    pagina,
    /onAlternarAprovacaoNovosSeguidores=\{alternarAprovacaoNovosSeguidores\}/,
  );
  assert.match(
    pagina,
    /onAplicarPrivacidadeAtualizada=\{aplicarPrivacidadeAtualizada\}/,
  );
  assert.match(pagina, /onAtualizarPrivacidade=\{atualizarPrivacidade\}/);
  assert.doesNotMatch(pagina, /<ConfiguracoesBlockedUsersPanel/);
  assert.doesNotMatch(pagina, /<Toggle/);
});

test("seções de privacidade não introduzem runtime de dados", () => {
  for (const source of [perfil, abas, diario]) {
    assert.doesNotMatch(
      source,
      /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
    );
  }
});
