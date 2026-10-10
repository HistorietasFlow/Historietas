import { STORAGE_KEY } from "../constants";
import type { ObraLocal } from "../types";
import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";

export function usePerfilAutorLibraryStorageActions({
  usuarioIdLogado,
  setObras,
}: {
  usuarioIdLogado: string;
  setObras: (obras: ObraLocal[]) => void;
}) {
  function salvarObrasBibliotecaPerfil(novasObras: ObraLocal[]) {
    setObras(novasObras);

    try {
      salvarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        usuarioIdLogado,
        novasObras,
      );
    } catch {
      // A tela continua usando o estado em memória se o localStorage falhar.
    }
  }

  return { salvarObrasBibliotecaPerfil };
}
