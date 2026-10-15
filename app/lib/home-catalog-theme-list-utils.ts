import { obraCatalogoCombinaTemas } from "./home-discovery-utils";

type ObraTemaCatalogoHome = {
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  disponivel: boolean;
};

export function criarObrasFantasiaPoderesHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) =>
    obraCatalogoCombinaTemas(obra, ["fantasia", "sobrenatural", "poder", "magia"])
  );
}

export function criarObrasTerrorSuspenseHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) =>
    obraCatalogoCombinaTemas(obra, ["terror", "suspense", "mistério", "sombrio"])
  );
}

export function criarObrasRomanceDramaHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) =>
    obraCatalogoCombinaTemas(obra, ["romance", "drama", "emocional"])
  );
}

export function criarObrasAcaoRivalidadesHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) =>
    obraCatalogoCombinaTemas(obra, ["ação", "acao", "luta", "rivalidade", "guerra"])
  );
}

export function criarObrasScifiCodigoHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) =>
    obraCatalogoCombinaTemas(obra, ["sci-fi", "scifi", "ficção", "futur", "código", "codigo"])
  );
}

export function criarObrasEmBreveHome<T extends ObraTemaCatalogoHome>(
  obrasFiltradas: T[]
) {
  return obrasFiltradas.filter((obra) => !obra.disponivel);
}
