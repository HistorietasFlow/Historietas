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
const authIdentitySource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-auth-identity.ts",
    import.meta.url,
  ),
  "utf8",
);
const workOwnershipSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-save-work-ownership.ts",
    import.meta.url,
  ),
  "utf8",
);
const remoteUpdateSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-remote-update.ts",
    import.meta.url,
  ),
  "utf8",
);
const localPersistenceSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-persistence.ts",
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
  assert.match(
    source,
    /from "\.\.\/lib\/editar-obra-save-auth-identity";/,
  );
  assert.match(source, /await obterIdentidadeSalvamentoEdicaoObra\(\{/);
  assert.doesNotMatch(source, /supabase\.auth\.getUser\(\)/);
  assert.match(authIdentitySource, /await supabase\.auth\.getUser\(\)/);
  assert.match(authIdentitySource, /criarLoginHrefEditarObra\(obraId\)/);
  assert.match(authIdentitySource, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "nome"\)/);
  assert.match(authIdentitySource, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "name"\)/);
  assert.match(authIdentitySource, /obterTextoMetadataUsuarioEdicaoObra\(metadataUsuario, "full_name"\)/);
  assert.match(
    source,
    /from "\.\.\/lib\/editar-obra-save-work-ownership"/,
  );
  assert.match(source, /await confirmarPropriedadeObraParaSalvamentoEdicao\(\{/);
  assert.doesNotMatch(source, /obraLocalAtual\?\.autorId && obraLocalAtual\.autorId !== userId/);
  assert.match(workOwnershipSource, /obraLocalAtual\?\.autorId && obraLocalAtual\.autorId !== userId/);
  assert.match(workOwnershipSource, /\.from\("obras"\)[\s\S]*?\.select\([\s\S]*?"id,user_id,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,criada_em"[\s\S]*?\)[\s\S]*?\.eq\("id", obraId\)[\s\S]*?\.eq\("user_id", userId\)[\s\S]*?\.limit\(1\)[\s\S]*?\.maybeSingle\(\)/);
  antes("const erroValidacao", "setProcessando(true)");
  antes(
    "await obterIdentidadeSalvamentoEdicaoObra",
    "await confirmarPropriedadeObraParaSalvamentoEdicao",
  );
});

test("o fluxo preserva assets, rollback, atualização, backup e Diário", () => {
  assert.match(source, /prepararEEnviarAssetsEdicaoObra\(\{/);
  assert.doesNotMatch(source, /prepararAssetsAtuaisEdicaoObra\(/);
  assert.doesNotMatch(source, /enviarArquivoStorage\(/);
  assert.match(source, /const arquivosNovosEnviados: ArquivoStorageEdicaoObra\[\] = \[\];/);
  assert.match(source, /await atualizarObraRemotaEdicaoObra\(\{/);
  assert.doesNotMatch(source, /supabase\.from\("obras"\)/);
  assert.match(remoteUpdateSource, /await removerArquivosStorageEdicaoObra\([\s\S]*?arquivosNovosEnviados\.map/);
  assert.match(source, /persistirObraLocalEBackupEdicaoObra\(\{/);
  assert.doesNotMatch(source, /atualizarObraNaListaLocalEdicao\(/);
  assert.doesNotMatch(source, /salvarObrasDoUsuarioPreservandoOutrasContas\(/);
  assert.doesNotMatch(source, /salvarArquivoObraNoBackup\(/);
  assert.match(localPersistenceSource, /atualizarObraNaListaLocalEdicao\(\{/);
  assert.match(localPersistenceSource, /salvarObrasDoUsuarioPreservandoOutrasContas\(novasObras, userId\)/);
  assert.match(localPersistenceSource, /salvarArquivoObraNoBackup\(/);
  assert.match(source, /registrarDiarioEdicaoObra\(\{/);
  assert.match(source, /setSalvou\(true\);/);
  assert.match(source, /finally \{[\s\S]*?setProcessando\(false\);/);
  antes("const assetsPreparados", "await atualizarObraRemotaEdicaoObra");
  antes("await atualizarObraRemotaEdicaoObra", "await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)");
  antes("await removerArquivosStorageEdicaoObra(arquivosAntigosParaRemover)", "const novasObrasDoUsuario = persistirObraLocalEBackupEdicaoObra");
  antes("const novasObrasDoUsuario = persistirObraLocalEBackupEdicaoObra", "registrarDiarioEdicaoObra");
  antes("registrarDiarioEdicaoObra", "setSalvou(true)");
});
