import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { montarLeitor } from "../helpers/ler-capitulo-dom-harness.mjs";

const pagina = readFileSync(new URL("../../app/ler-capitulo/page.tsx", import.meta.url), "utf8");
const props = { obraIdInicial: "obra", capituloIdInicial: "c1" };
const medir = { medir: true };

for (const [dispositivo, viewport] of [["desktop", 1000], ["mobile", 640]]) {
  test(`${dispositivo}: mede antes da pintura, mantém 0% no topo e 100% no fim com clamp`, t => {
    const c = montarLeitor(t, { viewport, altura: viewport + 2000 });
    c.render(props, medir);
    assert.equal(c.progresso.valor, 0); // Sem esperar timer nem evento.
    for (const [top, esperado] of [[-80, 0], [0, 0], [666, 33], [1000, 50], [2000, 100], [2200, 100]]) {
      c.window.scrollY = top;
      c.emitir("scroll");
      assert.equal(c.progresso.valor, esperado);
    }
    c.window.scrollY = 0;
    c.emitir("scroll");
    assert.equal(c.progresso.valor, 0);
  });

  test(`${dispositivo}: documento curto/exato é 100%; resize recalcula para documento rolável`, t => {
    const c = montarLeitor(t, { viewport, altura: viewport - 100 });
    c.render(props, medir);
    assert.equal(c.progresso.valor, 100);
    c.document.documentElement.scrollHeight = viewport;
    c.emitir("resize");
    assert.equal(c.progresso.valor, 100);
    c.document.documentElement.scrollHeight = viewport + 1000;
    c.emitir("resize");
    assert.equal(c.progresso.valor, 0);
    c.window.scrollY = 500;
    c.emitir("scroll");
    assert.equal(c.progresso.valor, 50);
    c.window.innerHeight = viewport + 500;
    c.emitir("resize");
    assert.equal(c.progresso.valor, 100);
  });
}

test("troca de capítulo e de obra mede o DOM novo e cancela timer/observador anteriores", t => {
  const c = montarLeitor(t, { top: 750 });
  let identidade = c.render(props, medir);
  assert.equal(c.progresso.valor, 75);
  const primeiroTimer = [...c.timers.keys()][0];
  identidade.setCapituloId("c2");
  c.document.documentElement.scrollHeight = 4000;
  c.window.scrollY = 0;
  identidade = c.render({}, medir);
  assert.equal(c.progresso.valor, 0);
  assert.equal(c.timers.has(primeiroTimer), false);
  assert.equal(c.observadores[0].ativo, false);
  assert.equal(c.listeners.get("scroll").size, 1);
  assert.equal(c.listeners.get("resize").size, 1);
  c.window.scrollY = 1500;
  c.emitir("scroll");
  assert.equal(c.progresso.valor, 50);
  identidade.setObraId("outra-obra"); // IDs locais de capítulos podem se repetir.
  c.document.documentElement.scrollHeight = 1000;
  c.render({}, medir);
  assert.equal(c.progresso.valor, 100);
  assert.equal(c.observadores[1].ativo, false);
});

test("altura muda após carga/fonte sem scroll nem resize da janela", t => {
  const c = montarLeitor(t, { top: 500 });
  c.render(props, medir);
  assert.equal(c.progresso.valor, 50);
  assert.deepEqual(c.observadores[0].alvos, [c.document.documentElement, c.document.body]);
  c.document.documentElement.scrollHeight = 3000;
  c.redimensionarConteudo();
  assert.equal(c.progresso.valor, 25);
  c.document.documentElement.scrollHeight = 500;
  c.redimensionarConteudo();
  assert.equal(c.progresso.valor, 100);
});

test("histórico restaura rolagem depois do popstate, inclusive sem evento scroll", t => {
  const c = montarLeitor(t, { top: 600 });
  const identidade = c.render(props, medir);
  c.executarTimers();
  c.criarAcaoTrocaCapituloLeitor({
    obraAtual: { id: "obra", capitulos: [{ id: "c1" }, { id: "c2" }] }, ...identidade,
  }).trocarCapitulo("c2");
  c.render({}, medir);
  c.window.scrollY = 0;
  c.emitir("scroll"); // Fim do scroll suave da ação existente.
  assert.equal(c.progresso.valor, 0);
  c.executarTimers();
  c.window.history.back();
  c.render({}, medir); // Pode ocorrer antes da restauração nativa.
  c.window.scrollY = 600;
  c.executarTimers();
  assert.equal(c.progresso.valor, 60);
  assert.equal(c.render({}, medir).capituloId, "c1");
  c.window.history.forward();
  c.render({}, medir);
  c.window.scrollY = 0;
  c.executarTimers();
  assert.equal(c.progresso.valor, 0);
  assert.equal(c.render({}, medir).capituloId, "c2");
});

test("popstate do mesmo capítulo e pageshow recalculam a posição restaurada sem remount", t => {
  const c = montarLeitor(t, { top: 300 });
  c.render(props, medir);
  c.executarTimers();
  assert.equal(c.progresso.valor, 30);
  c.emitir("popstate", { state: c.window.history.state });
  c.render({}, medir);
  c.window.scrollY = 900;
  c.executarTimers();
  assert.equal(c.progresso.valor, 90);
  c.emitir("pageshow", { persisted: true });
  c.window.scrollY = 1000;
  c.executarTimers();
  assert.equal(c.progresso.valor, 100);
  assert.equal(c.observadores.length, 1);
  assert.deepEqual(c.rolagens, []);
});

test("capítulo indisponível zera a barra; mesmo ID disponível novamente é medido", t => {
  const c = montarLeitor(t, { top: 700 });
  c.render(props, medir);
  assert.equal(c.progresso.valor, 70);
  c.render({}, { ...medir, disponivel: false });
  assert.equal(c.progresso.valor, 0);
  c.document.documentElement.scrollHeight = 1000;
  c.redimensionarConteudo();
  c.executarTimers();
  assert.equal(c.progresso.valor, 0);
  c.render({}, medir);
  assert.equal(c.progresso.valor, 100);
});

test("cleanup remove todos os listeners, timer de restauração e observer", t => {
  const c = montarLeitor(t);
  c.render(props, medir);
  c.emitir("popstate", { state: c.window.history.state });
  c.emitir("pageshow", { persisted: true });
  assert.equal(c.timers.size, 1);
  c.desmontar();
  assert.equal(c.timers.size, 0);
  assert.equal(c.observadores[0].ativo, false);
  for (const callbacks of c.listeners.values()) assert.equal(callbacks.size, 0);
  const atualizacoes = c.progresso.atualizacoes.length;
  c.emitir("scroll");
  c.emitir("resize");
  c.redimensionarConteudo();
  c.executarTimers();
  assert.equal(c.progresso.atualizacoes.length, atualizacoes);
});

test("sem ResizeObserver mantém eventos e cálculo inicial", t => {
  const c = montarLeitor(t, { observar: false, top: 200 });
  c.render(props, medir);
  assert.equal(c.progresso.valor, 20);
  c.window.scrollY = 0;
  c.emitir("scroll");
  assert.equal(c.progresso.valor, 0);
});

test("página mantém progresso visual local e só mede conteúdo disponível e autorizado", () => {
  assert.match(pagina, /const \[progressoRolagem, setProgressoRolagem\] = useState\(0\);/);
  assert.match(pagina, /useLerCapituloScrollProgress\(\{\s*obraId: obraAtual\?\.id,\s*capituloId: !carregando && !erroCarregamentoInicial && !dadosPublicos\.aguardandoRota && statusAcesso18 === "permitido"\s*\? capituloAtual\?\.id : undefined,\s*setProgressoRolagem,/);
  assert.match(pagina, /width: `\$\{progressoRolagem\}%`/);
  assert.doesNotMatch(pagina, /function atualizarProgressoRolagem/);
});
