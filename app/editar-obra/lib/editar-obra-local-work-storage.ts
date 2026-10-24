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
  userId: string
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

  salvarJsonStorageUsuarioEditarObra(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuarioComDono.map(prepararObraEdicaoParaStorage)
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
    const obrasUsuarioTexto = lerStorageUsuarioEditarObra(STORAGE_KEY, usuarioId);
    const obrasUsuarioJson: unknown = obrasUsuarioTexto
      ? JSON.parse(obrasUsuarioTexto)
      : [];

    obrasDoUsuario = normalizarLista(obrasUsuarioJson)
      .map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || usuarioId,
      }))
      .filter((obra) => usuarioPodeEditarObraLocal(obra, usuarioId));
  } catch {
    obrasDoUsuario = [];
  }

  salvarJsonStorageUsuarioEditarObra(
    STORAGE_KEY,
    usuarioId,
    obrasDoUsuario.map(prepararObraEdicaoParaStorage)
  );
  sincronizarBackupArquivosObras(obrasDoUsuario, usuarioId);

  return obrasDoUsuario;
}
