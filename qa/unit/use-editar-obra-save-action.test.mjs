import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const source = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-save-action.ts",
    import.meta.url,
  ),
  "utf8",
);

function antes(primeiro, segundo) {
  const inicioSalvarEdicao = source.indexOf("async function salvarEdicao");
  assert.ok(
    source.indexOf(primeiro, inicioSalvarEdicao) <
      source.indexOf(segundo, inicioSalvarEdicao),
    `esperava ${primeiro} antes de ${segundo}`,
  );
}

test("a página delega salvarEdicao ao hook e mantém o submit", () => {
  assert.match(
    pageSource,
    /import \{ useEditarObraSaveAction \} from "\.\/hooks\/use-editar-obra-save-action";/,
  );
  assert.match(pageSource, /const \{ salvarEdicao \} = useEditarObraSaveAction\(\{/);
  assert.match(pageSource, /<form[\s\S]*?onSubmit=\{salvarEdicao\}/);
  assert.doesNotMatch(pageSource, /async function salvarEdicao\(/);
  assert.match(source, /export function useEditarObraSaveAction\(/);
  assert.match(source, /async function salvarEdicao\(event: FormEvent<HTMLFormElement>\)/);
  assert.match(source, /return \{ salvarEdicao \};/);
});

test("o fluxo de salvamento preserva validação, autenticação e propriedade", () => {
  assert.match(source, /validarFormularioEdicaoObra\(\{/);
  assert.match(source, /await supabase\.auth\.getUser\(\)/);
  assert.match(source, /criarLoginHrefEditarObra\(obraId\)/);
  assert.match(source, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "nome"\)/);
  assert.match(source, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "name"\)/);
  assert.match(source, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "full_name"\)/);
  assert.match(source, /obraLocalAtual\?\.autorId && obraLocalAtual\.autorId !== userId/);
  assert.match(source, /\.from\("obras"\)[\s\S]*?\.select\([\s\S]*?"id,user_id,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,criada_em"[\s\S]*?\)[\s\S]*?\.eq\("id", obraId\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  antes("const erroValidacao", "setProcessando(true)");
  antes("await supabase.auth.getUser()", ".from(\"obras\")");
  antes('metadataUsuario, "nome"', 'metadataUsuario, "name"');
  antes('metadataUsuario, "name"', 'metadataUsuario, "full_name"');
});

test("o fluxo preserva assets, rollback, atualização, backup e Diário", () => {
  assert.match(source, /prepararAssetsAtuaisEdicaoObra\(\{/);
  assert.match(source, /if \(capaBloqueadaPorClassificacao\) \{[\s\S]*?if \(caminhoCapaRemotaAtual\)/);
  assert.match(source, /Nao consegui remover a capa publica antes de bloquear a obra 18\+/);
  assert.match(source, /const arquivosNovosEnviados: ArquivoStorageEdicaoObra\[\] = \[\];/);
  assert.match(source, /await removerArquivosStorageEdicaoObra\([\s\S]*?arquivosNovosEnviados\.map/);
  assert.match(source, /atualizarObraNaListaLocalEdicao\(\{/);
  assert.match(source, /salvarObrasDoUsuarioPreservandoOutrasContas\(novasObras, userId\);/);
  assert.match(source, /salvarArquivoObraNoBackup\(/);
  assert.match(source, /registrarDiarioEdicaoObra\(\{/);
  assert.match(source, /setSalvou\(true\);/);
  assert.match(source, /finally \{[\s\S]*?setProcessando\(false\);/);
  antes("prepararAssetsAtuaisEdicaoObra", "enviarArquivoStorage");
  antes("const obraAtualizadaSupabase", "await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)");
  antes("await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)", "const novasObras = atualizarObraNaListaLocalEdicao");
  antes("salvarArquivoObraNoBackup", "registrarDiarioEdicaoObra");
  antes("registrarDiarioEdicaoObra", "setSalvou(true)");
});
