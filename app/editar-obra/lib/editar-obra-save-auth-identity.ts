import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  carregarNomeAutorProfileEdicaoObra,
  obterTextoMetadataUsuarioEdicaoObra,
} from "./editar-obra-profile-loader";
import { criarLoginHrefEditarObra } from "./editar-obra-navigation-utils";

type RouterEditarObra = {
  replace: (href: string) => void;
};

type ObterIdentidadeSalvamentoEdicaoObraParams = {
  obraId: string;
  autorFormularioFinal: string;
  router: RouterEditarObra;
  setErro: Dispatch<SetStateAction<string>>;
};

export async function obterIdentidadeSalvamentoEdicaoObra({
  obraId,
  autorFormularioFinal,
  router,
  setErro,
}: ObterIdentidadeSalvamentoEdicaoObraParams) {
  const { data: dadosUsuario, error: erroUsuario } =
    await supabase.auth.getUser();

  const userId = dadosUsuario.user?.id || "";

  if (erroUsuario || !userId || !obraId) {
    setErro("Entre na sua conta antes de editar a obra.");
    router.replace(criarLoginHrefEditarObra(obraId));
    return null;
  }

  const metadataUsuario = dadosUsuario.user?.user_metadata as
    | Record<string, unknown>
    | undefined;
  const nomeMetadataUsuario =
    obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "nome") ||
    obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "name") ||
    obterTextoMetadataUsuarioEdicaoObra(metadataUsuario, "full_name");
  const nomeProfileAtualizado = await carregarNomeAutorProfileEdicaoObra(
    userId,
    nomeMetadataUsuario || autorFormularioFinal
  );

  return {
    userId,
    nomeProfileAtualizado,
  };
}
