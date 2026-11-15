import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {loadApplicationModule} from "../helpers/load-application-module.mjs";
import {criarPublicarHarness, rejeicaoPublicar} from "../helpers/publicar-submission-harness.mjs";

const page = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const formController = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const action = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

const snapshotCampos = params => Object.fromEntries(Object.entries(params).filter(([key, value]) =>
  typeof value !== "function" && !["jaSalvouRef", "router"].includes(key)));
const escritas = s => s.calls.filter(call => /:(insert|update|upload|delete|remove)$/.test(call));

test("sucesso confirma obra/capítulo, persiste campos e impede publicação duplicada", async () => {
  const s = criarPublicarHarness(), antes = snapshotCampos(s.params);
  await s.enviar();
  assert.equal(s.obras.size, 1);
  assert.equal(s.capitulos.size, 1);
  assert.equal(s.arquivos.size, 1);
  assert.equal([...s.obras.values()][0].publicado, true);
  assert.equal(s.state.cache[0].titulo, "Minha obra");
  assert.equal(s.state.cache[0].capitulos[0].texto, s.params.arquivoCapituloTexto.trim());
  assert.deepEqual(snapshotCampos(s.params), antes);
  const feitas = escritas(s);
  await s.enviar();
  assert.deepEqual(escritas(s), feitas);
  assert.equal(s.params.jaSalvouRef.current, true);
});

test("erro antes de escrita preserva campos e libera somente tentativa explícita", async () => {
  const s = criarPublicarHarness(), antes = snapshotCampos(s.params);
  s.falhas.set("auth", () => {throw new Error("Sem sessão");});
  await s.enviar();
  assert.deepEqual(escritas(s), []);
  assert.equal(s.params.jaSalvouRef.current, false);
  assert.equal(s.state.processando, false);
  assert.deepEqual(snapshotCampos(s.params), antes);
  s.falhas.clear();
  await s.enviar();
  assert.equal(s.obras.size, 1);
});

for (const etapa of ["obras:insert", "capitulos:insert", "obras:update"]) {
  test(`${etapa}: rejeição comprovada e limpeza confirmada permitem nova tentativa sem duplicação`, async () => {
    const s = criarPublicarHarness(), antes = snapshotCampos(s.params);
    s.falhas.set(etapa, rejeicaoPublicar);
    await s.enviar();
    assert.equal(s.params.jaSalvouRef.current, false);
    assert.equal(s.obras.size, 0);
    assert.equal(s.capitulos.size, 0);
    assert.equal(s.arquivos.size, 0);
    assert.deepEqual(snapshotCampos(s.params), antes);
    s.falhas.clear();
    await s.enviar();
    assert.equal(s.obras.size, 1);
    assert.equal(s.capitulos.size, 1);
    assert.equal(s.arquivos.size, 1);
  });
}

for (const etapa of ["capas-obras:upload", "obras:insert", "capitulos:insert", "obras:update"]) {
  for (const resposta of ["throw", "fetch", "http", "vazia"]) {
    test(`${etapa}: commit com resposta ${resposta} bloqueia reenvio, cleanup e sucesso presumido`, async () => {
      const s = criarPublicarHarness(), antes = snapshotCampos(s.params);
      s.falhas.set(etapa, escrever => {
        escrever();
        if (resposta === "throw") throw new TypeError("Resposta perdida");
        if (resposta === "fetch") return {data: null, error: {code: "", message: "Failed to fetch"}};
        if (resposta === "http") return {data: null, error: {code: "503", message: "Gateway unavailable"}};
        return {data: null, error: null};
      });
      await s.enviar();
      assert.equal(s.params.jaSalvouRef.current, true);
      assert.equal(s.state.processando, false);
      assert.match(s.state.erro, /confirma|incert/i);
      assert.equal(s.calls.some(call => /:(delete|remove)$/.test(call)), false);
      assert.equal(s.calls.includes("cache"), false);
      assert.equal(s.calls.some(call => call.startsWith("replace:")), false);
      assert.deepEqual(snapshotCampos(s.params), antes);
      const feitas = escritas(s), mensagem = s.state.erro;
      s.params.validarFormulario = () => "Campo alterado";
      await s.enviar();
      assert.deepEqual(escritas(s), feitas);
      assert.equal(s.state.erro, mensagem, "a guarda preserva a orientação de recuperação");
    });
  }
}

for (const etapa of ["obras:delete", "capas-obras:remove"]) {
  for (const resposta of ["throw", "erro", "vazia"]) {
    test(`limpeza ${etapa} com ${resposta} mantém bloqueio na tentativa posterior`, async () => {
      const s = criarPublicarHarness();
      s.falhas.set("capitulos:insert", rejeicaoPublicar);
      s.falhas.set(etapa, () => {
        if (resposta === "throw") throw new Error("Resposta perdida");
        return {data: [], error: resposta === "erro" ? {message: "Recusado"} : null};
      });
      await s.enviar();
      assert.equal(s.params.jaSalvouRef.current, true);
      assert.equal(s.state.processando, false);
      if (etapa === "obras:delete") assert.equal(s.calls.includes("capas-obras:remove"), false);
      const feitas = escritas(s);
      s.falhas.clear();
      await s.enviar();
      assert.deepEqual(escritas(s), feitas);
    });
  }
}

for (const etapa of ["cache", "diario", "router"]) {
  test(`falha em ${etapa} após confirmação nunca apaga a obra nem libera nova publicação`, async () => {
    const s = criarPublicarHarness();
    s.falhas.set(etapa, etapa === "cache" ? new DOMException("Cheio", "QuotaExceededError") : new Error("Falha posterior"));
    await s.enviar();
    assert.equal(s.obras.size, 1);
    assert.equal([...s.obras.values()][0].publicado, true);
    assert.equal(s.arquivos.size, 1);
    assert.equal(s.params.jaSalvouRef.current, true);
    assert.equal(s.state.processando, false);
    assert.match(s.state.erro, /obra foi publicada/);
    assert.equal(s.calls.some(call => /:(delete|remove)$/.test(call)), false);
    const feitas = escritas(s);
    await s.enviar();
    assert.deepEqual(escritas(s), feitas);
  });
}

test("validação inválida e tipo de capa recusado preservam campos antes de qualquer escrita", async () => {
  for (const invalidar of [
    s => {s.params.validarFormulario = () => "Título inválido";},
    s => {s.params.capaArquivo = new File(["x"], "invalido.exe");},
  ]) {
    const s = criarPublicarHarness();
    invalidar(s);
    const antes = snapshotCampos(s.params);
    await s.enviar();
    assert.equal(s.params.jaSalvouRef.current, false);
    assert.equal(s.state.processando, false);
    assert.deepEqual(escritas(s), []);
    assert.deepEqual(snapshotCampos(s.params), antes);
  }
});

test("sem capítulo importado ou anexos publica apenas a obra", async () => {
  const s = criarPublicarHarness();
  Object.assign(s.params, {temCapituloImportado: false, arquivoCapituloTexto: "", capaArquivo: null});
  await s.enviar();
  assert.equal(s.obras.size, 1);
  assert.equal(s.capitulos.size, 0);
  assert.equal(s.arquivos.size, 0);
  assert.deepEqual(escritas(s), ["obras:insert", "obras:update"]);
});

function adicionarAnexo(s) {
  s.params.arquivoObra = {nome: "obra.txt", tipo: "text/plain", tamanho: 5, categoria: "texto", conteudo: "", criadoEm: ""};
  s.params.arquivoObraArquivo = new File(["texto"], "obra.txt", {type: "text/plain"});
}

test("segundo upload incerto não remove a capa confirmada nem repete anexos", async () => {
  const s = criarPublicarHarness();
  adicionarAnexo(s);
  s.falhas.set("arquivos-obras:upload", escrever => {escrever(); throw new Error("Resposta perdida");});
  await s.enviar();
  assert.equal(s.arquivos.size, 2);
  assert.equal(s.params.jaSalvouRef.current, true);
  assert.equal(s.calls.some(call => /:(delete|remove|insert)$/.test(call)), false);
  const feitas = escritas(s);
  await s.enviar();
  assert.deepEqual(escritas(s), feitas);
});

test("falha parcial na remoção dos anexos bloqueia reenvio mesmo com obra e capa já removidas", async () => {
  const s = criarPublicarHarness();
  adicionarAnexo(s);
  s.falhas.set("capitulos:insert", rejeicaoPublicar);
  s.falhas.set("arquivos-obras:remove", () => ({data: null, error: {message: "Recusado"}}));
  await s.enviar();
  assert.equal(s.obras.size, 0);
  assert.equal(s.arquivos.size, 1);
  assert.equal(s.params.jaSalvouRef.current, true);
  const feitas = escritas(s);
  await s.enviar();
  assert.deepEqual(escritas(s), feitas);
});

test("DELETE commitado com resposta perdida não autoriza remover arquivos nem reenviar", async () => {
  const s = criarPublicarHarness();
  s.falhas.set("capitulos:insert", rejeicaoPublicar);
  s.falhas.set("obras:delete", escrever => {escrever(); throw new Error("Resposta perdida");});
  await s.enviar();
  assert.equal(s.obras.size, 0);
  assert.equal(s.arquivos.size, 1);
  assert.equal(s.params.jaSalvouRef.current, true);
  assert.equal(s.calls.includes("capas-obras:remove"), false);
});

test("remoção de arquivo commitada com resposta perdida mantém bloqueio mesmo sem objetos restantes", async () => {
  const s = criarPublicarHarness();
  s.falhas.set("capitulos:insert", rejeicaoPublicar);
  s.falhas.set("capas-obras:remove", escrever => {escrever(); throw new Error("Resposta perdida");});
  await s.enviar();
  assert.equal(s.obras.size, 0);
  assert.equal(s.arquivos.size, 0);
  assert.equal(s.params.jaSalvouRef.current, true);
  assert.equal(s.state.processando, false);
  const feitas = escritas(s);
  await s.enviar();
  assert.deepEqual(escritas(s), feitas);
});

test("recusa local do segundo arquivo permite limpar somente a capa comprovadamente enviada", async () => {
  const s = criarPublicarHarness();
  adicionarAnexo(s);
  s.params.arquivoObraArquivo = new File(["x"], "invalido.exe");
  await s.enviar();
  assert.equal(s.calls.includes("arquivos-obras:upload"), false);
  assert.equal(s.arquivos.size, 0);
  assert.equal(s.params.jaSalvouRef.current, false);
  assert.deepEqual(escritas(s), ["capas-obras:upload", "capas-obras:remove"]);
});

for (const code of ["08007", "40003", "PGRST002", "PGRST116"]) {
  test(`erro ${code} não comprova rejeição da escrita`, async () => {
    const s = criarPublicarHarness();
    s.falhas.set("obras:update", () => ({data: null, error: {code, message: "Resultado não confirmado"}}));
    await s.enviar();
    assert.equal(s.params.jaSalvouRef.current, true);
    assert.equal(s.calls.some(call => /:(delete|remove)$/.test(call)), false);
    assert.equal(s.state.cache, undefined);
  });
}

for (const etapa of ["obras:insert", "capitulos:insert", "obras:update"]) {
  test(`identidade divergente em ${etapa} não confirma nem compensa`, async () => {
    const s = criarPublicarHarness();
    s.falhas.set(etapa, escrever => {
      const retorno = escrever();
      retorno.data = Array.isArray(retorno.data)
        ? retorno.data.map(row => ({...row, user_id: "outro"}))
        : {...retorno.data, user_id: "outro"};
      return retorno;
    });
    await s.enviar();
    assert.equal(s.params.jaSalvouRef.current, true);
    assert.equal(s.calls.some(call => /:(delete|remove)$/.test(call)), false);
    assert.equal(s.state.cache, undefined);
  });
}

test("classificação 18+ continua impedindo upload e persistência da capa", async () => {
  const s = criarPublicarHarness();
  s.params.classificacaoFinal = "18+";
  await s.enviar();
  assert.equal(s.calls.includes("capas-obras:upload"), false);
  assert.equal([...s.obras.values()][0].capa_url, "");
  assert.equal([...s.obras.values()][0].capa_nome, "");
});

// SDK instalado de verdade: verifica requests/respostas PostgREST e Storage,
// sem servidor/banco remoto. O fetch controlado injeta a falha na fronteira HTTP.
for (const cenario of ["sucesso", "rejeicao", "publicacao_incerta", "cleanup_sem_linha", "storage_sem_recibo"]) {
  test(`SDK real: ${cenario} preserva confirmação, filtros e ausência de retry`, async () => {
    const s = criarPublicarHarness(), requests = [];
    let obra;
    const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {"Content-Type": "application/json"}});
    const client = createClient("http://127.0.0.1:59999", "chave-ficticia-de-teste", {
      auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      global: {fetch: async (url, options) => {
        const parsed = new URL(url), method = options.method, headers = new Headers(options.headers);
        requests.push({url: parsed, method, headers, body: options.body});
        if (parsed.pathname.startsWith("/storage/")) {
          if (method === "POST") {
            return json({Key: parsed.pathname.slice("/storage/v1/object/".length), Id: "objeto"});
          }
          const {prefixes} = JSON.parse(options.body);
          return json(cenario === "storage_sem_recibo" ? [] : prefixes.map(name => ({name})));
        }
        if (method === "POST" && parsed.pathname.endsWith("/obras")) {
          obra = JSON.parse(options.body);
          return json(obra, 201);
        }
        if (method === "POST") {
          return cenario === "sucesso" || cenario === "publicacao_incerta"
            ? json(JSON.parse(options.body), 201)
            : json({code: "42501", message: "Recusado", details: null, hint: null}, 403);
        }
        if (method === "PATCH") {
          if (cenario === "publicacao_incerta") throw new TypeError("Resposta perdida após commit");
          return json({...obra, publicado: true});
        }
        return json(cenario === "cleanup_sem_linha" ? [] : [{id: obra.id}]);
      }},
    });
    client.auth.getUser = async () => ({data: {user: {id: "usuario"}}, error: null});
    const {salvarObraPublicar} = loadApplicationModule("app/publicar/lib/publicar-submission-action.ts", {
      ...s.mocks, "../../../lib/supabase/client": {supabase: client},
    });
    await salvarObraPublicar(s.params, {preventDefault() {}});
    // Asserções fora do fetch: a ação não pode capturar uma falha do teste e
    // fazê-la passar como se fosse a falha de transporte esperada no cenário.
    assert.equal(requests.length, ["rejeicao", "storage_sem_recibo"].includes(cenario) ? 5 : 4);
    for (const {url, method, headers, body} of requests) {
      if (url.pathname.startsWith("/storage/")) {
        if (method === "POST") assert.equal(headers.get("x-upsert"), "false");
        else assert.equal(method, "DELETE");
        continue;
      }
      assert.equal(headers.get("Prefer"), "return=representation");
      if (method === "POST") {
        if (url.pathname.endsWith("/obras")) {
          assert.equal(JSON.parse(body).publicado, false);
          assert.equal(url.searchParams.get("select"), "id,user_id");
        }
      } else {
        assert.equal(url.searchParams.get("id"), `eq.${obra.id}`);
        assert.equal(url.searchParams.get("user_id"), "eq.usuario");
        if (method === "DELETE") assert.equal(url.searchParams.get("publicado"), "eq.false");
        else assert.equal(method, "PATCH");
      }
    }
    assert.equal(s.params.jaSalvouRef.current, cenario !== "rejeicao");
    assert.equal(Boolean(s.state.cache), cenario === "sucesso");
    assert.equal(requests.filter(r => r.method === "DELETE").length,
      cenario === "rejeicao" || cenario === "storage_sem_recibo" ? 2 : cenario === "cleanup_sem_linha" ? 1 : 0);
    const anteriores = requests.length;
    if (cenario !== "rejeicao") {
      await salvarObraPublicar(s.params, {preventDefault() {}});
      assert.equal(requests.length, anteriores);
    }
  });
}

test("ação de submissão de Publicar preserva delegação, compensação e navegação", () => {
  assert.match(action, /export async function salvarObraPublicar\(/);
  assert.match(action, /event: FormEvent<HTMLFormElement>/);
  assert.match(action, /event\.preventDefault\(\)/);
  assert.match(action, /const mensagemErro = validarFormulario\(\)/);
  assert.match(action, /if \(jaSalvouRef\.current\)/);
  assert.match(action, /jaSalvouRef\.current = true/);
  assert.match(action, /setProcessando\(true\)/);
  assert.match(action, /supabase\.auth\.getUser\(\)/);
  assert.match(action, /supabase\.from\("obras"\)\.insert\(/);
  assert.match(action, /supabase\.from\("capitulos"\)\.insert\(/);
  assert.match(action, /\.eq\("id", obraId\)\s*\.eq\("user_id", userId\)/);
  assert.match(action, /enviarArquivoStorage\("capas-obras", userId, capaArquivo\)/);
  assert.match(action, /enviarArquivoStorage\(\s*"arquivos-obras",/);
  assert.match(action, /await registrarDiarioPublicacao\(/);
  assert.match(action, /tipo: "publicou_obra"/);
  assert.match(action, /tipo: "publicou_capitulo"/);
  assert.match(action, /salvarObrasLocalmente\(novasObrasDoUsuario, userId\)/);
  assert.match(action, /await desfazerPublicacaoParcialPublicar\(/);
  assert.match(action, /erroDesconhecido\.name === "QuotaExceededError"/);
  assert.match(action, /router\.replace\("\/painel-autor"\)/);
  assert.match(action, /router\.refresh\(\)/);
  assert.match(action, /window\.scrollTo\(/);
});

test("página de Publicar delega a submissão sem duplicar os efeitos", () => {
  assert.match(
    page,
    /import \{ usePublicarFormController \} from "\.\/hooks\/use-publicar-form-controller";/,
  );
  assert.match(formController, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.match(formController, /const \{ salvarObra \} = usePublicarSubmission\(\{/);
  assert.doesNotMatch(page, /from "\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(page, /async function salvarObra\(/);
  assert.match(hook, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.match(hook, /async function salvarObra\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(hook, /return salvarObraPublicar\(/);
  for (const dependencia of [
    "router,",
    "setAutor,",
    "setErro,",
    "setProcessando,",
    "validarFormulario,",
  ]) {
    assert.ok(formController.includes(dependencia), `dependência preservada: ${dependencia}`);
  }
  assert.match(hook, /const jaSalvouRef = useRef\(false\)/);
  assert.doesNotMatch(page, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(page, /supabase\.from\("obras"\)/);
  assert.doesNotMatch(page, /enviarArquivoStorage\(/);
  assert.doesNotMatch(page, /desfazerPublicacaoParcialPublicar\(/);
});
