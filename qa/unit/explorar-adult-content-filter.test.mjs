import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-adult-content-filter.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarAdultContentFilter preserva o painel visual de conteúdo 18+", () => {
  assert.match(componente, /export function ExplorarAdultContentFilter/);
  assert.match(componente, /filtroClassificacao: string;/);
  assert.match(componente, /mostrarConfirmacao: boolean;/);
  assert.match(componente, /confirmouIdade: boolean;/);
  assert.match(componente, /acessoTemporariamenteBloqueado: boolean;/);
  assert.match(componente, /onSelecionarClassificacao: \(filtro: string\) => void;/);
  assert.match(componente, /onConfirmouIdadeChange: \(confirmou: boolean\) => void;/);
  assert.match(componente, /onVoltar: \(\) => void;/);
  assert.match(componente, /onConfirmar: \(\) => void;/);
  assert.match(componente, /Conteúdo 18\+/);
  assert.match(componente, /Ocultar conteúdo 18\+/);
  assert.match(componente, /Mostrar conteúdo 18\+/);
  assert.match(componente, /Conteúdo 18\+ temporariamente indisponível/);
  assert.match(componente, /Confirmação de idade/);
  assert.match(componente, /Confirmo que tenho 18 anos ou mais\./);
  assert.match(componente, /Ativar conteúdo 18\+/);
  assert.match(componente, /traduzirTextoExplorar\("Voltar", language\)/);
  assert.match(componente, /!mostrarConfirmacao/);
  assert.match(componente, /acessoTemporariamenteBloqueado/);
  assert.match(componente, /type="checkbox"/);
  assert.match(componente, /checked=\{confirmouIdade\}/);
  assert.match(componente, /onConfirmouIdadeChange\(event\.target\.checked\)/);
  assert.match(componente, /disabled=\{!confirmouIdade\}/);
  assert.match(componente, /onClick=\{onConfirmar\}/);
  assert.match(componente, /onClick=\{onVoltar\}/);
  assert.match(componente, /onSelecionarClassificacao\("todos"\)/);
  assert.match(componente, /onSelecionarClassificacao\("18\+"\)/);
  assert.match(componente, /explorarAdultConfirmationStyle/);
  assert.match(componente, /explorarAdultConfirmationDisabledStyle/);
  assert.match(componente, /gridColumn: "1 \/ -1"/);
  assert.match(componente, /"✓"/);
});

test("Explorar mantém handlers, estados e regras de acesso 18+ na página", () => {
  assert.match(pagina, /import \{ ExplorarAdultContentFilter \} from "\.\/components\/explorar-adult-content-filter";/);
  assert.match(pagina, /\{modoConteudo === "obras" && \(/);
  assert.match(pagina, /<ExplorarAdultContentFilter/);
  assert.match(pagina, /selecionarFiltroClassificacaoExplorar/);
  assert.match(pagina, /confirmarFiltroConteudo18Explorar/);
  assert.match(pagina, /ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO/);
  assert.match(pagina, /acessoConteudo18Confirmado/);
  assert.match(pagina, /confirmarAcessoConteudo18/);
  assert.match(pagina, /onConfirmouIdadeChange=\{setConfirmouIdadeConteudo18\}/);
  assert.match(pagina, /onConfirmar=\{confirmarFiltroConteudo18Explorar\}/);
});
