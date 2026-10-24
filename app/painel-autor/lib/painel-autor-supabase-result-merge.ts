import { mesclarObrasPainelAutor } from "./painel-autor-work-merge-utils";
import { obraPertenceAoUsuarioPainel } from "./painel-autor-ownership-utils";
import { aplicarNomeProfileNasObrasPainel } from "./painel-autor-profile-utils";

type ObraPainelAutorResultado = {
  id: string;
  slug: string;
  titulo: string;
  autor: string;
  autorId?: string;
};

export function mesclarResultadoSupabasePainelAutor<T extends ObraPainelAutorResultado>({
  obrasLocaisUsuario,
  obrasSupabase,
  userId,
  nomeProfileAutor,
  obrasFavoritasUsuario,
  obrasConcluidasUsuario,
  favoritosSupabase,
  concluidasSupabase,
}: {
  obrasLocaisUsuario: T[];
  obrasSupabase: T[];
  userId: string;
  nomeProfileAutor: string;
  obrasFavoritasUsuario: string[];
  obrasConcluidasUsuario: string[];
  favoritosSupabase: Set<string>;
  concluidasSupabase: Set<string>;
}) {
  const obrasMescladasUsuario = aplicarNomeProfileNasObrasPainel(
    mesclarObrasPainelAutor(obrasLocaisUsuario, obrasSupabase).filter((obra) =>
      obraPertenceAoUsuarioPainel(obra, userId)
    ),
    userId,
    nomeProfileAutor
  );
  const idsObrasUsuario = new Set(obrasMescladasUsuario.map((obra) => obra.id));

  return {
    obras: obrasMescladasUsuario,
    favoritas: Array.from(
      new Set([...obrasFavoritasUsuario, ...Array.from(favoritosSupabase)])
    ).filter((id) => idsObrasUsuario.has(id)),
    concluidas: Array.from(
      new Set([...obrasConcluidasUsuario, ...Array.from(concluidasSupabase)])
    ).filter((id) => idsObrasUsuario.has(id)),
  };
}
