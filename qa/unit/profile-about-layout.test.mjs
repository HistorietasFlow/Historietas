import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const conteudo = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const rodape = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-about-footer.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("página delega as duas composições apresentacionais do Sobre", () => {
  assert.match(
    pagina,
    /import \{ ProfileAboutContent \} from "\.\/components\/profile-about-content";/,
  );
  assert.match(
    pagina,
    /import \{ ProfileAboutFooter \} from "\.\/components\/profile-about-footer";/,
  );
  assert.match(pagina, /<ProfileAboutContent[\s\S]*?\/>/);
  assert.match(pagina, /<ProfileAboutFooter[\s\S]*?\/>/);
  assert.doesNotMatch(pagina, /<ProfileAboutContentGrid>/);
  assert.doesNotMatch(pagina, /<ProfileAboutMemberSince>/);
  assert.doesNotMatch(pagina, /<ProfileAboutRecentActivity/);
});

test("composição do grid preserva Especialidades, Números do perfil e Atividade nesta ordem", () => {
  assert.match(
    conteudo,
    /<ProfileAboutContentGrid>[\s\S]*?<ProfileAboutSpecialties[\s\S]*?<ProfileAboutProfileNumbers[\s\S]*?<ProfileAboutActivity[\s\S]*?<\/ProfileAboutContentGrid>/,
  );
  assert.match(
    conteudo,
    /generosEspecialidadesPerfil=\{generosEspecialidadesPerfil\}/,
  );
  for (const prop of [
    "totalPublicadas",
    "totalCapitulos",
    "totalCurtidas",
    "totalVisualizacoes",
    "totalObras",
    "totalRascunhos",
    "totalComentarios",
    "totalConcluidas",
    "mostrarObrasSemCapitulos",
    "totalObrasSemCapitulos",
  ]) {
    assert.match(conteudo, new RegExp(`${prop}=\\{${prop}\\}`));
  }
});

test("bloco final preserva texto, condição e props da atividade recente", () => {
  assert.match(
    rodape,
    /<ProfileAboutMemberSince>[\s\S]*?Na Historietas desde \{memberSince\}[\s\S]*?<\/ProfileAboutMemberSince>/,
  );
  assert.match(
    rodape,
    /showRecentActivity && \([\s\S]*?<ProfileAboutRecentActivity[\s\S]*?expanded=\{expanded\}[\s\S]*?loading=\{loading\}[\s\S]*?items=\{items\}[\s\S]*?onToggle=\{onToggle\}/,
  );
  assert.match(
    pagina,
    /<ProfileAboutFooter[\s\S]*?memberSince=\{entradaHistorietasPerfil\}[\s\S]*?showRecentActivity=\{atividadesPerfilVisivel\}[\s\S]*?expanded=\{atividadeSobreAberta\}[\s\S]*?loading=\{diarioPerfilCarregando\}[\s\S]*?items=\{atividadesDiarioPerfil\}[\s\S]*?onToggle=\{\(\) =>[\s\S]*?setAtividadeSobreAberta\(\(valorAtual\) => !valorAtual\)/,
  );
});
