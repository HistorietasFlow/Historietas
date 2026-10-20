import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/notificacoes/components/notificacoes-empty-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("estado vazio preserva prioridade, textos, estilos e consumidor da página", () => {
  for (const contrato of [
    '"use client"',
    "mensagem: string",
    "{mensagem}",
    'margin: "10px 0 0"',
    'color: "#FFFFFF"',
    'fontSize: "12px"',
    "fontWeight: 800",
    'textAlign: "center"',
  ]) {
    assert.ok(componente.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /import NotificacoesEmptyState/);
  assert.match(
    pagina,
    /notificacoes\.length === 0 \? \([\s\S]*?<NotificacoesEmptyState mensagem="Nenhuma notificação" \/>[\s\S]*?notificacoesFiltradas\.length === 0 \? \([\s\S]*?<NotificacoesEmptyState mensagem="Nada encontrado" \/>/,
  );
  assert.doesNotMatch(pagina, /Nenhuma notificação\s*<\/p>/);
  assert.doesNotMatch(pagina, /Nada encontrado\s*<\/p>/);
});
