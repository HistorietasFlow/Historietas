import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/configuracoes/page.tsx", import.meta.url),
  "utf8",
);
const secoesUso = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-usage-summary-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoDados = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-data-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const secaoSuporte = readFileSync(
  new URL(
    "../../app/configuracoes/components/configuracoes-support-section.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("seções informativas preservam dados, rotas, traduções e filtros", () => {
  assert.match(
    secoesUso,
    /export function ConfiguracoesUsageSummarySection\(/,
  );
  assert.match(secoesUso, /deveMostrar: \(\.\.\.termos: string\[\]\) => boolean/);
  assert.match(secoesUso, /resumo: ResumoLocal/);
  assert.match(secoesUso, /totalBiblioteca: number/);
  assert.match(secoesUso, /notificacoesNaoLidas: number/);
  assert.match(secoesUso, /Como você usa o Historietas/);
  assert.match(secoesUso, /href="\/perfil-autor\?aba=obras"/);
  assert.match(secoesUso, /href="\/perfil-autor\?aba=biblioteca"/);
  assert.match(secoesUso, /href="\/notificacoes"/);
  assert.match(secoesUso, /href="\/perfil-autor\?aba=comunidade"/);
  assert.match(secoesUso, /href="\/perfil-autor\/top-5"/);
  assert.match(secoesUso, /href="\/perfil-autor\?aba=diario"/);
  assert.match(secoesUso, /<ValorLinha>\{resumo\.obras\}<\/ValorLinha>/);
  assert.match(
    secoesUso,
    /<ValorLinha>\{notificacoesNaoLidas\}<\/ValorLinha>/,
  );

  assert.match(secaoDados, /export function ConfiguracoesDataSection\(/);
  assert.match(secaoDados, /onCopiarBackup: \(\) => void/);
  assert.match(secaoDados, /onBaixarBackup: \(\) => void/);
  assert.match(secaoDados, /Dados e arquivos/);
  assert.match(secaoDados, /onClick=\{onCopiarBackup\}/);
  assert.match(secaoDados, /onClick=\{onBaixarBackup\}/);
  assert.match(secaoDados, /Resumo da conta/);
  assert.match(secaoDados, /resumo\.seguindoObras \+ resumo\.seguindoAutores/);
  assert.match(secaoDados, /"Copy data"/);
  assert.match(secaoDados, /"Descargar copia"/);

  assert.match(secaoSuporte, /export function ConfiguracoesSupportSection\(/);
  assert.match(secaoSuporte, /Suporte e sobre/);
  assert.match(secaoSuporte, /href="\/ajuda"/);
  assert.match(secaoSuporte, /href="\/termos"/);
  assert.match(secaoSuporte, /<ValorLinha>Beta<\/ValorLinha>/);
  assert.match(secaoSuporte, /"Help center"/);
  assert.match(secaoSuporte, /"Términos y políticas"/);
});

test("página delega somente a apresentação das seções informativas", () => {
  assert.match(
    pagina,
    /import \{ ConfiguracoesUsageSummarySection \} from "\.\/components\/configuracoes-usage-summary-section";/,
  );
  assert.match(
    pagina,
    /import \{ ConfiguracoesDataSection \} from "\.\/components\/configuracoes-data-section";/,
  );
  assert.match(
    pagina,
    /import \{ ConfiguracoesSupportSection \} from "\.\/components\/configuracoes-support-section";/,
  );
  assert.match(pagina, /<ConfiguracoesUsageSummarySection/);
  assert.match(pagina, /totalBiblioteca=\{totalBiblioteca\}/);
  assert.match(pagina, /notificacoesNaoLidas=\{notificacoesNaoLidas\}/);
  assert.match(pagina, /<ConfiguracoesDataSection/);
  assert.match(pagina, /onCopiarBackup=\{copiarBackup\}/);
  assert.match(pagina, /onBaixarBackup=\{baixarBackup\}/);
  assert.match(pagina, /<ConfiguracoesSupportSection/);
  assert.doesNotMatch(pagina, /href="\/perfil-autor\/top-5"/);
  assert.doesNotMatch(pagina, /href="\/ajuda"/);
  assert.doesNotMatch(pagina, /title=\{t\("Copiar dados", "Copy data", "Copiar datos"\)\}/);
});

test("componentes de apresentação não incorporam runtime de dados", () => {
  for (const source of [secoesUso, secaoDados, secaoSuporte]) {
    assert.doesNotMatch(
      source,
      /supabase|localStorage|sessionStorage|useState|useEffect|window|document|fetch/,
    );
  }
});
