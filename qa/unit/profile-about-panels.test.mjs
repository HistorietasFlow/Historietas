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
const conteudo = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secao = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Perfil de Autor delega a composição dos painéis apresentacionais do Sobre", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(
    pagina,
    /<ProfileAboutSection[\s\S]*?generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}[\s\S]*?totalPublicadas=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrarPronto\.totalPublicadas,[\s\S]*?\)\}[\s\S]*?totalCapitulos=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrarPronto\.totalCapitulos,[\s\S]*?\)\}[\s\S]*?totalCurtidas=\{compactarNumeroPerfilAutor\([\s\S]*?perfilParaMostrarPronto\.totalCurtidas,[\s\S]*?\)\}[\s\S]*?totalVisualizacoes=\{compactarNumeroPerfilAutor\([\s\S]*?totalVisualizacoesPerfil,[\s\S]*?\)\}[\s\S]*?totalObras=\{totalObrasPerfil\}[\s\S]*?totalRascunhos=\{totalRascunhosPerfil\}[\s\S]*?totalComentarios=\{perfilParaMostrarPronto\.totalComentarios\}[\s\S]*?totalConcluidas=\{obrasConcluidasPerfilTotal\}[\s\S]*?mostrarObrasSemCapitulos=\{temObrasSemCapitulosPerfil\}[\s\S]*?totalObrasSemCapitulos=\{totalObrasSemCapitulosPerfil\}/,
  );
  assert.match(secao, /import \{ ProfileAboutContent \} from "\.\/profile-about-content";/);
  assert.match(
    conteudo,
    /import \{ ProfileAboutSpecialties \} from "\.\/profile-about-specialties";/,
  );
  assert.match(
    conteudo,
    /import \{ ProfileAboutProfileNumbers \} from "\.\/profile-about-profile-numbers";/,
  );
  assert.match(
    conteudo,
    /import \{ ProfileAboutActivity \} from "\.\/profile-about-activity";/,
  );
  assert.match(
    conteudo,
    /<ProfileAboutContentGrid>[\s\S]*?<ProfileAboutSpecialties[\s\S]*?<ProfileAboutProfileNumbers[\s\S]*?<ProfileAboutActivity/,
  );
  assert.doesNotMatch(pagina, /import \{ ProfileAboutProfileNumbers \}/);
  assert.doesNotMatch(pagina, /import \{ ProfileAboutActivity \}/);
  assert.doesNotMatch(pagina, /<ProfileAboutMetricsGrid>|<ProfileAboutRows>/);
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
