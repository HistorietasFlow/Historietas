import {
  lerStorageUsuarioAdicionarCapitulo,
  salvarJsonStorageUsuarioAdicionarCapitulo,
} from "./adicionar-capitulo-storage-utils";
import { normalizarObra } from "./adicionar-capitulo-work-normalizer";
import {
  restaurarArquivoObraComBackup,
} from "./adicionar-capitulo-file-backup-utils";
import {
  carregarBackupArquivosObras,
  sincronizarBackupArquivosObras,
} from "./adicionar-capitulo-file-backup-storage";
import {
  obraPertenceAoUsuario,
} from "./adicionar-capitulo-ownership-utils";
import {
  prepararObraAdicionarCapituloParaStorage,
} from "./adicionar-capitulo-storage-preparation";

type ObraNormalizadaAdicionarCapitulo = ReturnType<typeof normalizarObra>;
type ObraLocalAdicionarCapitulo = Pick<
  ObraNormalizadaAdicionarCapitulo,
  "id" | "titulo" | "slug" | "link" | "capa"
> & {
  autorId?: string;
  arquivoObra?: { conteudo: string } | null;
};
type ObraParaNormalizarAdicionarCapitulo = Parameters<typeof normalizarObra>[0];

const STORAGE_KEY = "historietas-obras";

export function carregarObrasLocais(userId = "") {
  const userIdLimpo = userId.trim();
  const obrasSalvasTexto = lerStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo
  );
  const obrasSalvasJson = obrasSalvasTexto ? JSON.parse(obrasSalvasTexto) : [];
  const backupArquivosObras = carregarBackupArquivosObras(userIdLimpo);

  const obrasNormalizadas: ObraNormalizadaAdicionarCapitulo[] = Array.isArray(obrasSalvasJson)
    ? obrasSalvasJson.map((obra, index) =>
        restaurarArquivoObraComBackup(
          normalizarObra(obra as ObraParaNormalizarAdicionarCapitulo, index),
          backupArquivosObras
        )
      )
    : [];

  const obrasComAutorCorrigido = userIdLimpo
    ? obrasNormalizadas.map((obra) => ({
        ...obra,
        autorId: obra.autorId?.trim() || userIdLimpo,
      }))
    : obrasNormalizadas;

  const obrasDoUsuario = userIdLimpo
    ? obrasComAutorCorrigido.filter((obra) =>
        obraPertenceAoUsuario(obra, userIdLimpo)
      )
    : obrasComAutorCorrigido;

  sincronizarBackupArquivosObras(obrasDoUsuario, userIdLimpo);
  salvarJsonStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasDoUsuario.map(prepararObraAdicionarCapituloParaStorage)
  );

  return obrasDoUsuario;
}

export function salvarObrasAdicionarCapituloStorage(
  obrasParaSalvar: ObraLocalAdicionarCapitulo[],
  userId = ""
) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return;
  }

  const obrasSemArquivosPesados = obrasParaSalvar.map(
    prepararObraAdicionarCapituloParaStorage
  );

  const obrasParaStorage = obrasSemArquivosPesados.filter((obra) =>
    obraPertenceAoUsuario(obra, userIdLimpo)
  );

  salvarJsonStorageUsuarioAdicionarCapitulo(
    STORAGE_KEY,
    userIdLimpo,
    obrasParaStorage
  );

  sincronizarBackupArquivosObras(obrasParaSalvar, userIdLimpo);
}
