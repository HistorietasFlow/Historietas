import { supabase } from "../../lib/supabase/client";
import {
  colecaoTemIdentificadorHome,
  criarIdentificadoresObraCatalogoHome,
  criarIdentificadoresObraLocalHome,
  normalizarListaIdsHome,
  removerIdentificadoresDaListaHome,
} from "./home-collection-utils";
import { salvarListaIdsHome } from "./home-storage-utils";
import { sincronizarColecaoObraHome } from "./home-collection-supabase-utils";
import { registrarAtividadeDiarioHome } from "./home-diary-activity-utils";
import { encontrarObraLocalPorHeroHome } from "./home-hero-work-utils";

type CapituloHeroFavoritoHome = {
  curtiu: boolean;
  comentario: string;
};

type ObraHeroFavoritoHome = {
  id?: string;
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
  capa?: string;
  capaUrl?: string;
  arquivoObra?: unknown;
  capitulos?: CapituloHeroFavoritoHome[];
};

type ObraLocalHeroFavoritoHome = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra?: unknown;
  capitulos: CapituloHeroFavoritoHome[];
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

export async function alternarHeroFavoritoHome<
  THero extends ObraHeroFavoritoHome,
  TObraLocal extends ObraLocalHeroFavoritoHome,
>({
  heroObra,
  heroFavoritoId,
  obrasLocais,
  obrasFavoritas,
  exigirLoginHome,
  favoritesStorageKey,
  setObrasFavoritas,
  setAvisoLogin,
}: {
  heroObra: THero;
  heroFavoritoId: string;
  obrasLocais: TObraLocal[];
  obrasFavoritas: string[];
  exigirLoginHome: (mensagem: string) => Promise<boolean>;
  favoritesStorageKey: string;
  setObrasFavoritas: (favoritos: string[]) => void;
  setAvisoLogin: (aviso: string) => void;
}) {
  if (!heroObra || !heroFavoritoId) {
    return;
  }

  const podeSalvar = await exigirLoginHome(
    "Entre na sua conta para salvar obras na sua lista."
  );

  if (!podeSalvar) {
    return;
  }

  let userIdAtual = "";

  try {
    const { data } = await supabase.auth.getUser();
    userIdAtual = data.user?.id || "";
  } catch {
    userIdAtual = "";
  }

  const obraLocalHero = encontrarObraLocalPorHeroHome(
    obrasLocais,
    heroObra,
    heroFavoritoId
  );
  const identificadoresHero = normalizarListaIdsHome([
    heroFavoritoId,
    ...criarIdentificadoresObraCatalogoHome(heroObra),
    ...(obraLocalHero ? criarIdentificadoresObraLocalHome(obraLocalHero) : []),
  ]);
  const estaNaLista = colecaoTemIdentificadorHome(
    identificadoresHero,
    obrasFavoritas
  );
  const novoStatusFavorito = !estaNaLista;
  const favoritoPrincipal = obraLocalHero?.id || heroFavoritoId;
  const favoritosSemHero = removerIdentificadoresDaListaHome(
    obrasFavoritas,
    identificadoresHero
  );
  const favoritosAtualizados = novoStatusFavorito
    ? normalizarListaIdsHome([...favoritosSemHero, favoritoPrincipal])
    : favoritosSemHero;

  salvarListaIdsHome(favoritesStorageKey, userIdAtual, favoritosAtualizados);
  setObrasFavoritas(favoritosAtualizados);

  if (obraLocalHero) {
    const sincronizado = await sincronizarColecaoObraHome(
      "favoritos",
      obraLocalHero.id,
      novoStatusFavorito
    );

    if (!sincronizado && novoStatusFavorito) {
      setAvisoLogin("A obra ficou salva no aparelho, mas não sincronizou agora.");
    }

    if (novoStatusFavorito && userIdAtual) {
      void registrarAtividadeDiarioHome({
        userId: userIdAtual,
        tipo: "favoritou_obra",
        obra: obraLocalHero,
        texto: `Adicionou ${obraLocalHero.titulo} à lista`,
      });
    }
  }
}
