import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/notificacoes/hooks/use-notificacoes-page-controls.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("controles locais de Notificações preservam estados e transições", () => {
  for (const contrato of [
    'const [busca, setBusca] = useState("")',
    "const [buscaTopoAberta, setBuscaTopoAberta] = useState(false)",
    'const [filtro, setFiltro] = useState<FiltroNotificacao>("todas")',
    'const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes")',
    'const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("")',
    "const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false)",
    "function alternarMenuNotificacao(id: string)",
    "setMostrarPainelOrdenacao(false)",
    'setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id))',
    "function fecharMenuNotificacao()",
    'setMenuNotificacaoAbertoId("")',
    "function fecharMenusNotificacoes()",
    "function limparFiltros()",
    'setFiltro("todas")',
    'setOrdenacao("recentes")',
    "function atualizarBusca(proximaBusca: string)",
    "function alternarPainelOrdenacao()",
    "function abrirBusca()",
    "function fecharBusca()",
    "function fecharPainelOrdenacao()",
    "function atualizarFiltro(proximoFiltro: FiltroNotificacao)",
    "function atualizarOrdenacao(proximaOrdenacao: OrdenacaoNotificacao)",
  ]) {
    assert.ok(hook.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/hooks\/use-notificacoes-page-controls"/);
  assert.match(pagina, /} = useNotificacoesPageControls\(\);/);
  assert.match(pagina, /onBuscaChange=\{atualizarBusca\}/);
  assert.match(pagina, /onAlternarPainelOrdenacao=\{alternarPainelOrdenacao\}/);
  assert.match(pagina, /onAbrirBusca=\{abrirBusca\}/);
  assert.match(pagina, /onFecharBusca=\{fecharBusca\}/);
  for (const estado of [
    "busca",
    "buscaTopoAberta",
    "filtro",
    "ordenacao",
    "menuNotificacaoAbertoId",
    "mostrarPainelOrdenacao",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`const \\[${estado}, set[A-Za-z]+\\] = useState`),
    );
  }
  for (const funcao of [
    "alternarMenuNotificacao",
    "fecharMenuNotificacao",
    "fecharMenusNotificacoes",
    "limparFiltros",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${funcao}\\(`));
  }
  assert.doesNotMatch(hook, /supabase|localStorage|window|document|JSX/);
});
