import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tipos = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-types.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const deleteWorkHook = readFileSync(
  new URL("../../app/painel-autor/hooks/use-painel-autor-delete-work.ts", import.meta.url),
  "utf8",
);

test("tipos do Painel do Autor preservam os contratos locais", () => {
  assert.match(tipos, /export type CapituloLocal = \{/);
  assert.match(
    tipos,
    /id: string;[\s\S]*?titulo: string;[\s\S]*?texto: string;[\s\S]*?curtiu: boolean;[\s\S]*?salvo: boolean;[\s\S]*?comentario: string;[\s\S]*?criadoEm: string;[\s\S]*?lido: boolean;[\s\S]*?lidoEm: string;[\s\S]*?publicado\?: boolean;/,
  );
  assert.match(tipos, /export type ArquivoObraLocal = \{/);
  assert.match(
    tipos,
    /nome: string;[\s\S]*?tipo: string;[\s\S]*?tamanho: number;[\s\S]*?conteudo: string;[\s\S]*?categoria:[\s\S]*?"texto"[\s\S]*?"documento"[\s\S]*?"imagem"[\s\S]*?"outro"[\s\S]*?criadoEm: string;/,
  );
  assert.match(tipos, /export type ObraLocal = \{/);
  assert.match(
    tipos,
    /autorId\?: string;[\s\S]*?arquivoObra\?:[\s\S]*?ArquivoObraLocal[\s\S]*?publicado: boolean;[\s\S]*?capitulos: CapituloLocal\[\];[\s\S]*?totalCurtidasPainel\?: number;[\s\S]*?totalComentariosPainel\?: number;[\s\S]*?totalSalvosPainel\?: number;[\s\S]*?totalLidosPainel\?: number;/,
  );
  assert.match(
    tipos,
    /import type \{[\s\S]*?ObraComMetricasPainel,[\s\S]*?\} from "\.\/painel-autor-work-metrics";/,
  );
  assert.match(
    tipos,
    /export type ObraComMetricas =[\s\S]*?ObraComMetricasPainel<ObraLocal>;/,
  );
});

test("página consome tipos extraídos sem redefini-los", () => {
  assert.match(
    pagina,
    /import type \{[\s\S]*?ObraComMetricas,[\s\S]*?ObraLocal,[\s\S]*?\} from "\.\/lib\/painel-autor-types";/,
  );
  assert.match(
    deleteWorkHook,
    /import type \{[\s\S]*?CapituloLocal,[\s\S]*?ObraLocal,[\s\S]*?\} from "\.\.\/lib\/painel-autor-types";/,
  );

  for (const declaracao of [
    "type CapituloLocal =",
    "type ArquivoObraLocal =",
    "type ObraLocal =",
    "type ObraComMetricas =",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(declaracao));
  }
});
