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

export async function carregarSnapshotInicialHome({
  usuarioIdLogado,
  storageKey,
  favoritesStorageKey,
  completedStorageKey,
  aoNormalizarObras,
}: {
  usuarioIdLogado: string;
  storageKey: string;
  favoritesStorageKey: string;
  completedStorageKey: string;
  aoNormalizarObras: (obras: ObrasNormalizadasHome) => void;
}) {
  let userIdHome = usuarioIdLogado.trim();
  if (!userIdHome) {
    try {
      const { data } = await supabase.auth.getUser();
      userIdHome = data.user?.id || "";
    } catch {
      userIdHome = "";
    }
  }

  const obrasSalvasTexto = lerStorageUsuarioHome(storageKey, userIdHome);
  const obrasSalvasJson = obrasSalvasTexto
    ? JSON.parse(obrasSalvasTexto)
    : [];

  const obrasNormalizadas = normalizarObrasHomeSalvas(obrasSalvasJson);

  aoNormalizarObras(obrasNormalizadas);

  salvarJsonStorageUsuarioHome(storageKey, userIdHome, obrasNormalizadas);

  let obrasFavoritasNormalizadas = carregarListaIdsHome(
    favoritesStorageKey,
    userIdHome
  );
  let obrasConcluidasNormalizadas = carregarListaIdsHome(
    completedStorageKey,
    userIdHome
  );

  if (userIdHome) {
    const [favoritasSupabase, concluidasSupabase] = await Promise.all([
      carregarIdsColecaoUsuarioHome("favoritos", userIdHome),
      carregarIdsColecaoUsuarioHome("concluidas", userIdHome),
    ]);

    obrasFavoritasNormalizadas = normalizarListaIdsHome([
      ...obrasFavoritasNormalizadas,
      ...favoritasSupabase,
    ]);
    obrasConcluidasNormalizadas = normalizarListaIdsHome([
      ...obrasConcluidasNormalizadas,
      ...concluidasSupabase,
    ]);
  }

  salvarListaIdsHome(
    favoritesStorageKey,
    userIdHome,
    obrasFavoritasNormalizadas
  );

  salvarListaIdsHome(
    completedStorageKey,
    userIdHome,
    obrasConcluidasNormalizadas
  );

  const perfisAutoresNormalizados =
    carregarPerfisAutoresHomeSalvos(userIdHome);

  return {
    userIdHome,
    obrasNormalizadas,
    obrasFavoritasNormalizadas,
    perfisAutoresNormalizados,
  };
}
