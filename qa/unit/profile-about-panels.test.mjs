import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const numeros = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-profile-numbers.tsx",
    import.meta.url,
  ),
  "utf8",
);
const atividade = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-activity.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Perfil de Autor delega os painéis apresentacionais do Sobre", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutProfileNumbers \} from "\.\/components\/profile-about-profile-numbers";/,
  );
  assert.match(
    pagina,
    /import \{ ProfileAboutActivity \} from "\.\/components\/profile-about-activity";/,
  );
  assert.match(
    pagina,
    /<ProfileAboutProfileNumbers[\s\S]*?totalPublicadas=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrar\.totalPublicadas,[\s\S]*?\)\}[\s\S]*?totalCapitulos=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrar\.totalCapitulos,[\s\S]*?\)\}[\s\S]*?totalCurtidas=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrar\.totalCurtidas,[\s\S]*?\)\}[\s\S]*?totalVisualizacoes=\{compactarNumeroPerfilAutor\([\s\S]*?totalVisualizacoesPerfil,[\s\S]*?\)\}/,
  );
  assert.match(
    pagina,
    /<ProfileAboutActivity[\s\S]*?totalObras=\{totalObrasPerfil\}[\s\S]*?totalRascunhos=\{totalRascunhosPerfil\}[\s\S]*?totalComentarios=\{perfilParaMostrar\.totalComentarios\}[\s\S]*?totalConcluidas=\{obrasConcluidasPerfilTotal\}[\s\S]*?mostrarObrasSemCapitulos=\{temObrasSemCapitulosPerfil\}[\s\S]*?totalObrasSemCapitulos=\{totalObrasSemCapitulosPerfil\}/,
  );
  assert.doesNotMatch(pagina, /<ProfileAboutMetricsGrid>/);
  assert.doesNotMatch(pagina, /<ProfileAboutRows>/);
});

test("painel de números preserva os quatro valores e textos", () => {
  for (const texto of [
    "Números do perfil",
    "publicadas",
    "capítulos",
    "curtidas",
    "visualizações",
  ]) {
    assert.match(numeros, new RegExp(texto));
  }
  for (const valor of [
    "totalPublicadas",
    "totalCapitulos",
    "totalCurtidas",
    "totalVisualizacoes",
  ]) {
    assert.match(numeros, new RegExp(`<ProfileAboutMetricNumber>\\{${valor}\\}`));
  }
  assert.equal(
    (numeros.match(/<ProfileAboutMetricCard>/g) || []).length,
    4,
  );
  assert.match(numeros, /ProfileAboutPanel/);
  assert.match(numeros, /ProfileAboutMetricsGrid/);
});

test("painel de atividade preserva linhas, valores e condição", () => {
  for (const texto of [
    "Atividade",
    "obras no perfil",
    "rascunhos em desenvolvimento",
    "comentários recebidos",
    "concluídas por leitores",
    "sem capítulos ainda",
  ]) {
    assert.match(atividade, new RegExp(texto));
  }
  for (const valor of [
    "totalObras",
    "totalRascunhos",
    "totalComentarios",
    "totalConcluidas",
    "totalObrasSemCapitulos",
  ]) {
    assert.match(atividade, new RegExp(`<strong>\\{${valor}\\}</strong>`));
  }
  assert.equal((atividade.match(/<ProfileAboutRow>/g) || []).length, 5);
  assert.match(atividade, /mostrarObrasSemCapitulos && \(/);
  assert.match(atividade, /ProfileAboutRows/);
  assert.match(atividade, /ProfileAboutRow/);
});
