import { supabase } from "../../lib/supabase/client";
import { normalizarListaIdsHome } from "./home-collection-utils";
import { carregarIdsColecaoUsuarioHome } from "./home-collection-supabase-utils";
import { carregarPerfisAutoresHomeSalvos } from "./home-author-storage-utils";
import { normalizarObrasHomeSalvas } from "./home-local-work-normalizers";
import {
  carregarListaIdsHome,
  lerStorageUsuarioHome,
  salvarJsonStorageUsuarioHome,
  salvarListaIdsHome,
} from "./home-storage-utils";

type ObrasNormalizadasHome = ReturnType<typeof normalizarObrasHomeSalvas>;
type SnapshotLocalHome = {
  userIdHome: string;
  obrasNormalizadas: ObrasNormalizadasHome;
  obrasFavoritasNormalizadas: string[];
  perfisAutoresNormalizados: ReturnType<typeof carregarPerfisAutoresHomeSalvos>;
};

export async function carregarSnapshotInicialHome({
  usuarioIdLogado,
  storageKey,
  favoritesStorageKey,
  completedStorageKey,
  aoNormalizarObras,
  aoFalhar,
  estaAtivo = () => true,
  resolverUsuario = true,
  snapshotAnterior,
}: {
  usuarioIdLogado: string;
  storageKey: string;
  favoritesStorageKey: string;
  completedStorageKey: string;
  aoNormalizarObras: (obras: ObrasNormalizadasHome, userId: string) => void;
  aoFalhar?: () => void;
  estaAtivo?: () => boolean;
  resolverUsuario?: boolean;
  snapshotAnterior?: SnapshotLocalHome;
}) {
  let userIdHome = usuarioIdLogado.trim();
  if (!userIdHome && resolverUsuario) {
    try {
      const { data } = await supabase.auth.getUser();
      userIdHome = data.user?.id || "";
    } catch {
      userIdHome = "";
    }
  }

  const anterior = snapshotAnterior?.userIdHome === userIdHome ? snapshotAnterior : undefined;
  let obrasNormalizadas = anterior?.obrasNormalizadas || [];
  let salvarObras = false;
  if (!estaAtivo()) return {
    userIdHome, obrasNormalizadas,
    obrasFavoritasNormalizadas: anterior?.obrasFavoritasNormalizadas || [],
    perfisAutoresNormalizados: anterior?.perfisAutoresNormalizados || {},
  };
  try {
    const obrasSalvasTexto = lerStorageUsuarioHome(storageKey, userIdHome, aoFalhar);
    if (obrasSalvasTexto) {
      const obrasSalvasJson: unknown = JSON.parse(obrasSalvasTexto);
      if (!Array.isArray(obrasSalvasJson)) throw new Error("Storage de obras inválido");
      obrasNormalizadas = normalizarObrasHomeSalvas(obrasSalvasJson);
    }
    salvarObras = Boolean(obrasSalvasTexto) || !anterior;
  } catch {
    aoFalhar?.();
    // Preserve a cópia válida em memória; não sobrescreva o JSON inválido.
  }

  aoNormalizarObras(obrasNormalizadas, userIdHome);
  if (estaAtivo() && salvarObras) salvarJsonStorageUsuarioHome(storageKey, userIdHome, obrasNormalizadas);

  let obrasFavoritasNormalizadas = carregarListaIdsHome(
    favoritesStorageKey,
    userIdHome,
    anterior?.obrasFavoritasNormalizadas,
    aoFalhar,
  );
  let obrasConcluidasNormalizadas = carregarListaIdsHome(
    completedStorageKey,
    userIdHome,
    [],
    aoFalhar,
  );

  if (userIdHome) {
    const [favoritasSupabase, concluidasSupabase] = await Promise.all([
      carregarIdsColecaoUsuarioHome("favoritos", userIdHome, aoFalhar).catch(() => { aoFalhar?.(); return []; }),
      carregarIdsColecaoUsuarioHome("concluidas", userIdHome, aoFalhar).catch(() => { aoFalhar?.(); return []; }),
    ]);
    const favoritasConfirmadas = new Set<string>(favoritasSupabase);
    if (obrasFavoritasNormalizadas.some((id) => !favoritasConfirmadas.has(id))) {
      aoFalhar?.();
    }

    obrasFavoritasNormalizadas = normalizarListaIdsHome([
      ...obrasFavoritasNormalizadas,
      ...favoritasSupabase,
    ]);
    obrasConcluidasNormalizadas = normalizarListaIdsHome([
      ...obrasConcluidasNormalizadas,
      ...concluidasSupabase,
    ]);
  }

  if (estaAtivo()) salvarListaIdsHome(
    favoritesStorageKey,
    userIdHome,
    obrasFavoritasNormalizadas
  );

  if (estaAtivo()) salvarListaIdsHome(
    completedStorageKey,
    userIdHome,
    obrasConcluidasNormalizadas
  );

  const perfisAutoresNormalizados = {
    ...anterior?.perfisAutoresNormalizados,
    ...(estaAtivo() ? carregarPerfisAutoresHomeSalvos(userIdHome, aoFalhar) : {}),
  };

  return {
    userIdHome,
    obrasNormalizadas,
    obrasFavoritasNormalizadas,
    perfisAutoresNormalizados,
  };
}
