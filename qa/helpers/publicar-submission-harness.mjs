import {loadApplicationModule} from "./load-application-module.mjs";

// O código real da ação e do Storage roda sobre uma API controlada. Cada falha
// pode ocorrer antes da escrita ou depois do commit, sem acessar serviços.
export function criarPublicarHarness() {
  const calls = [], obras = new Map(), capitulos = new Map(), arquivos = new Set();
  const falhas = new Map();
  let sequencia = 0;
  const state = {erro: "", processando: false, autor: "Autora preenchida"};
  const sucesso = data => ({data, error: null});
  async function executar(etapa, escrever) {
    calls.push(etapa);
    const falha = falhas.get(etapa);
    if (typeof falha === "function") return falha(escrever);
    return escrever();
  }
  const supabase = {
    auth: {getUser: () => executar("auth", () => sucesso({user: {id: "usuario", email: "autora@example.test"}}))},
    from(tabela) {
      let operacao, payload, singular = false;
      const filtros = [];
      const query = {
        insert(value) {operacao = "insert"; payload = value; return query;},
        update(value) {operacao = "update"; payload = value; return query;},
        delete() {operacao = "delete"; return query;},
        eq(key, value) {filtros.push([key, value]); return query;},
        select() {return query;},
        single() {singular = true; return query;},
        maybeSingle() {singular = true; return query;},
        then(resolve, reject) {
          return executar(`${tabela}:${operacao}`, () => {
            const registros = tabela === "obras" ? obras : capitulos;
            let rows;
            if (operacao === "insert") {
              rows = (Array.isArray(payload) ? payload : [payload]).map(row => ({...row}));
              rows.forEach(row => registros.set(row.id, row));
            } else {
              rows = [...registros.values()].filter(row => filtros.every(([key, value]) => row[key] === value));
              for (const row of rows) {
                if (operacao === "update") Object.assign(row, payload);
                else {
                  registros.delete(row.id);
                  if (tabela === "obras") {
                    for (const cap of capitulos.values()) if (cap.obra_id === row.id) capitulos.delete(cap.id);
                  }
                }
              }
            }
            return sucesso(singular ? rows[0] ?? null : rows);
          }).then(resolve, reject);
        },
      };
      return query;
    },
    storage: {from(bucket) {
      return {
        upload: (path, file, options) => executar(`${bucket}:upload`, () => {
          if (options.upsert !== false || arquivos.has(`${bucket}:${path}`)) throw new Error("Upload duplicado");
          arquivos.add(`${bucket}:${path}`);
          return sucesso({path});
        }),
        getPublicUrl: path => ({data: {publicUrl: `https://storage.example.test/${bucket}/${path}`}}),
        remove: paths => executar(`${bucket}:remove`, () => {
          const removidos = paths.filter(path => arquivos.delete(`${bucket}:${path}`));
          return sucesso(removidos.map(name => ({name})));
        }),
      };
    }},
  };
  const mocks = {
    "../../../lib/supabase/client": {supabase},
    "./publicar-profile-loader": {carregarNomePerfilPublicar: async () => state.autor},
    "./publicar-slug-supabase-loader": {criarSlugUnicoSupabase: async () => "minha-obra"},
    "./publicar-id-utils": {criarUuidSeguro: () => `id-${++sequencia}`, criarId: () => `arquivo-${++sequencia}`, limparNomeArquivoStorage: name => name},
    "./publicar-user-storage-utils": {lerStorageUsuarioPublicar: () => null},
    "./publicar-file-backup-storage-utils": {salvarObrasLocalmente: rows => {
      calls.push("cache");
      if (falhas.has("cache")) throw falhas.get("cache");
      state.cache = rows;
    }},
    "./publicar-diary-activity": {registrarDiarioPublicacao: async params => {
      calls.push(params.tipo);
      if (falhas.has("diario")) throw falhas.get("diario");
    }},
  };
  const action = loadApplicationModule("app/publicar/lib/publicar-submission-action.ts", mocks);
  const storage = loadApplicationModule("app/publicar/lib/publicar-storage-operations.ts", mocks);
  const params = {
    titulo: " Minha obra ", autor: state.autor, sinopse: " Uma sinopse preenchida para publicar. ",
    formatoFinal: "Romance", generoFinal: "Fantasia", classificacaoFinal: "Livre", statusEditorial: "concluida",
    avisosConteudo18Normalizados: [], tagsDaObra: ["aventura"],
    arquivoCapituloTitulo: " Primeiro capítulo ", arquivoCapituloTexto: " Texto preenchido com espaços\n\ne parágrafos. ",
    temCapituloImportado: true, arquivoObra: null, arquivoObraArquivo: null,
    capaArquivo: new File(["capa"], "capa.png", {type: "image/png"}), capaNome: "capa.png",
    jaSalvouRef: {current: false},
    router: {replace: href => {calls.push(`replace:${href}`); if (falhas.has("router")) throw falhas.get("router");}, refresh: () => calls.push("refresh")},
    setAutor: value => {state.autor = value;}, setErro: value => {state.erro = value;},
    setProcessando: value => {state.processando = value;}, validarFormulario: () => "",
  };
  globalThis.window = {scrollTo() {calls.push("scroll");}};
  return {calls, obras, capitulos, arquivos, falhas, state, params, supabase, mocks, storage, action,
    enviar: () => action.salvarObraPublicar(params, {preventDefault() {calls.push("preventDefault");}})};
}

export const rejeicaoPublicar = () => ({data: null, error: {code: "42501", message: "Escrita recusada"}});
