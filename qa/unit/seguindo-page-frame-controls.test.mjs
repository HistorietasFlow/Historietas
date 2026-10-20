import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lerArquivo = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8");

const pagina = lerArquivo("../../app/seguindo/page.tsx");
const frame = lerArquivo("../../app/seguindo/components/seguindo-page-frame.tsx");
const carregamento = lerArquivo(
  "../../app/seguindo/components/seguindo-page-loading-state.tsx",
);
const controls = lerArquivo("../../app/seguindo/components/seguindo-page-controls.tsx");
const carregado = lerArquivo("../../app/seguindo/components/seguindo-page-loaded-state.tsx");
const mensagemEstadoVazio = lerArquivo(
  "../../app/seguindo/lib/seguindo-empty-state-message.ts",
);

test("Seguindo delega o frame e os controles visuais sem mover seus lifecycles", () => {
  assert.match(pagina, /import \{ SeguindoPageLoadedState \} from "\.\/components\/seguindo-page-loaded-state";/);
  assert.match(carregado, /import \{ SeguindoPageFrame \} from "\.\/seguindo-page-frame";/);
  assert.match(carregado, /import \{ SeguindoPageControls \} from "\.\/seguindo-page-controls";/);
  assert.equal((carregado.match(/<SeguindoPageFrame /g) || []).length, 1);
  assert.equal((carregamento.match(/<SeguindoPageFrame /g) || []).length, 1);
  assert.match(carregado, /<SeguindoPageControls \{\.\.\.controls\} \/>/);
  assert.match(pagina, /useSeguindoPageInitialSync\(/);
  assert.match(pagina, /useSeguindoPageView\(mostrarPainelOrdenacao\);/);
});

test("o frame preserva tema, bridge e fades sem dependencias de dados", () => {
  assert.match(frame, /^"use client";/);
  assert.match(frame, /historietasThemeCss/);
  assert.match(frame, /seguindoPageCss/);
  assert.match(frame, /<SeguindoLanguageBridge \/>/);
  assert.match(frame, /desktopTopWaterFadeStyle/);
  assert.match(frame, /mobileTopWaterFadeStyle/);
  assert.match(frame, /data-historietas-seguindo-root="true"/);
  assert.doesNotMatch(frame, /supabase|localStorage|useEffect|useState/);
});

test("os controles preservam header, toolbar e painel condicional", () => {
  assert.match(controls, /import \{ SeguindoHeader \} from "\.\/seguindo-header";/);
  assert.match(controls, /import \{ SeguindoSocialToolbar \} from "\.\/seguindo-social-toolbar";/);
  assert.match(controls, /import \{ SeguindoSortingPanel \} from "\.\/seguindo-sorting-panel";/);
  assert.match(controls, /totalDisponivelGeral > 0/);
  assert.match(controls, /mostrarPainelOrdenacao &&/);
  assert.match(controls, /totalSeguidores=\{totalSeguidores\}/);
  assert.match(controls, /totalObrasSeguidas=\{totalObrasSeguidas\}/);
  assert.match(controls, /totalPessoasSeguidas=\{totalPessoasSeguidas\}/);
  assert.doesNotMatch(controls, /supabase|localStorage|useEffect|useState/);
});

test("a mensagem de estado vazio preserva todos os fallbacks de Seguindo", () => {
  for (const mensagem of [
    "Nenhum seguidor ainda",
    "Voc\u00ea ainda n\u00e3o tem seguidores",
    "Nenhuma obra seguida ainda",
    "Nenhum perfil seguido ainda",
    "Voc\u00ea ainda n\u00e3o segue nada",
  ]) {
    assert.ok(mensagemEstadoVazio.includes(mensagem));
  }
  assert.match(mensagemEstadoVazio, /export function obterMensagemEstadoVazioSeguindo/);
  assert.doesNotMatch(mensagemEstadoVazio, /React|use[A-Z]|supabase|localStorage/);
});
