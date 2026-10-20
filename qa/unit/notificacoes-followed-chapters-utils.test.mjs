import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helpers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-followed-chapters-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("notificações de capítulos seguidos preservam identificação, exclusões e criação", () => {
  for (const contrato of [
    "export function criarChavesObraParaNotificacao",
    "criarSlugBase(obra.titulo)",
    "normalizarTexto(obra.titulo)",
    "export function obraEstaNaListaSeguida",
    "if (idsSeguidos.size === 0)",
    "export function notificacaoCapituloPertenceAObraSeguida",
    "if (!notificacaoEhCapitulo(notificacao))",
    "if (usuarioAtualId && obra.autorId && obra.autorId === usuarioAtualId)",
    "export function criarNotificacoesDeCapitulos",
    "const idCanonico = `novo-capitulo:${capitulo.id}`",
    'titulo: "Novo capítulo publicado"',
    "lida: idsLidos.has(id) || idsLidos.has(idCanonico)",
    "criarHrefLeituraCapitulo(obra, capitulo.id, indiceCapitulo + 1)",
    "dataNotificacao(b) - dataNotificacao(a)",
  ]) {
    assert.ok(helpers.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-followed-chapters-utils"/);
  assert.doesNotMatch(pagina, /function criarChavesObraParaNotificacao/);
  assert.doesNotMatch(pagina, /function obraEstaNaListaSeguida/);
  assert.doesNotMatch(pagina, /function notificacaoCapituloPertenceAObraSeguida/);
  assert.doesNotMatch(pagina, /function criarNotificacoesDeCapitulos/);
  assert.doesNotMatch(helpers, /React|use[A-Z]|supabase|localStorage/);
});
