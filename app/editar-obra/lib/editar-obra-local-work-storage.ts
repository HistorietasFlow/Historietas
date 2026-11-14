import {
  carregarBackupArquivosObras,
  restaurarArquivoObraComBackup,
  sincronizarBackupArquivosObras,
} from "./editar-obra-file-backup-storage";
import { usuarioPodeEditarObraLocal } from "./editar-obra-ownership-utils";
import { prepararObraEdicaoParaStorage } from "./editar-obra-storage-preparation";
import {
  lerStorageUsuarioEditarObra,
  salvarJsonStorageUsuarioEditarObra,
} from "./editar-obra-storage-utils";
import { normalizarObra } from "./editar-obra-work-normalizer";

const STORAGE_KEY = "historietas-obras";

type ObraNormalizada = ReturnType<typeof normalizarObra>;
type ObraLocalArmazenada = Omit<
  ObraNormalizada,
  | "autorId"
  | "visualizacoes"
  | "totalCurtidas"
  | "totalComentarios"
  | "totalSalvos"
  | "totalLidos"
  | "arquivoObra"
> &
  Partial<
    Pick<
      ObraNormalizada,
      | "autorId"
      | "visualizacoes"
      | "totalCurtidas"
      | "totalComentarios"
      | "totalSalvos"
      | "totalLidos"
      | "arquivoObra"
    >
  >;

export function salvarObrasDoUsuarioPreservandoOutrasContas(
  obrasDoUsuario: ObraLocalArmazenada[],
  userId: string,
  obraId?: string,
) {
  if (typeof window === "undefined") {
    return obrasDoUsuario;
  }

  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as ObraLocalArmazenada[];
  }

  const obrasDoUsuarioComDono = obrasDoUsuario.map((obra, index) =>
    normalizarObra(
      {
        ...obra,
        autorId: obra.autorId || usuarioId,
      },
      index
    )
  ).filter((obra) => usuarioPodeEditarObraLocal(obra, usuarioId));

  // Releia antes de escrever: outra aba pode ter criado rascunhos desde a carga.
  const textoAtual = lerStorageUsuarioEditarObra(STORAGE_KEY, usuarioId, true);
  const jsonAtual: unknown = textoAtual ? JSON.parse(textoAtual) : [];
  if (!Array.isArray(jsonAtual)) throw new Error("Não consegui preservar as obras locais. Recarregue a página.");
  const atuais = jsonAtual.map((obra, index) => normalizarObra({ ...obra, autorId: obra.autorId || usuarioId }, index))
    .filter(obra => usuarioPodeEditarObraLocal(obra, usuarioId));
  const recebidas = obraId ? obrasDoUsuarioComDono.filter(obra => obra.id === obraId) : obrasDoUsuarioComDono;
  const mescladas = new Map(atuais.map(obra => [obra.id, obra]));
  recebidas.forEach(obra => mescladas.set(obra.id, obra));
  obrasDoUsuarioComDono.splice(0, obrasDoUsuarioComDono.length, ...mescladas.values());

  salvarJsonStorageUsuarioEditarObra(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuarioComDono.map(prepararObraEdicaoParaStorage),
    true,
  );
  sincronizarBackupArquivosObras(obrasDoUsuarioComDono, usuarioId);

  return obrasDoUsuarioComDono;
}

export function carregarObrasLocalStorageEdicaoObra(userId: string) {
  if (typeof window === "undefined") {
    return [] as ObraLocalArmazenada[];
  }

  const usuarioId = userId.trim();

  if (!usuarioId) {
    return [] as ObraLocalArmazenada[];
  }

  const backupArquivosObras = carregarBackupArquivosObras(usuarioId);

  function normalizarLista(valor: unknown) {
    return Array.isArray(valor)
      ? valor
          .map((obra, index) =>
            normalizarObra(
              obra as Parameters<typeof normalizarObra>[0],
              index
            )
          )
          .map((obra) => restaurarArquivoObraComBackup(obra, backupArquivosObras))
      : [];
  }

  let obrasDoUsuario: ObraLocalArmazenada[] = [];

  try {
    const obrasUsuarioTexto = lerStorageUsuarioEditarObra(STORAGE_KEY, usuarioId, true);
    const obrasUsuarioJson: unknown = obrasUsuarioTexto
      ? JSON.parse(obrasUsuarioTexto)
      : [];

    if (!Array.isArray(obrasUsuarioJson)) return [];
    obrasDoUsuario = normalizarLista(obrasUsuarioJson)
      .map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || usuarioId,
      }))
      .filter((obra) => usuarioPodeEditarObraLocal(obra, usuarioId));
  } catch {
    // Preserve o conteúdo original para recuperação; leitura não autoriza apagá-lo.
    return [];
  }

  salvarJsonStorageUsuarioEditarObra(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuario.map(prepararObraEdicaoParaStorage)
  );
  sincronizarBackupArquivosObras(obrasDoUsuario, usuarioId);

  return obrasDoUsuario;
}
