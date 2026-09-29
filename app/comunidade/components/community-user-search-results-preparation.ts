import { ordenarUsuariosBuscaComunidade } from "./community-user-search-comparator";
import { limitarUsuariosBuscaComunidade } from "./community-user-search-limit";
import { mesclarUsuariosBuscaComunidade } from "./community-user-search-merger";
import { normalizarTermoComparacaoUsuariosComunidade } from "./community-user-search-term-normalizer";
import type { UsuarioBuscaComunidade } from "./community-user";

export function prepararResultadosBuscaUsuariosComunidade(
  usuariosSupabase: UsuarioBuscaComunidade[],
  usuariosLocais: UsuarioBuscaComunidade[],
  termoLimpo: string
): UsuarioBuscaComunidade[] {
  const termoNormalizado =
    normalizarTermoComparacaoUsuariosComunidade(termoLimpo);

  return limitarUsuariosBuscaComunidade(
    ordenarUsuariosBuscaComunidade(
      mesclarUsuariosBuscaComunidade(
        usuariosSupabase,
        usuariosLocais
      ),
      termoNormalizado
    )
  );
}
