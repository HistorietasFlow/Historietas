import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { obterLocaleExplorar } from "./explorar-translations";
import {
  totalCurtidasObra,
  totalComentariosObra,
  totalSalvosObra,
  obraTemAtividadeLeitura,
  dataCriacaoObra,
  dataUltimoCapituloObraExplorar,
  pontuacaoRecomendacaoObraExplorar,
  obraTemConteudoPublicadoExplorar,
} from "./explorar-work-normalizers";
import type { ObraLocal } from "./explorar-work-normalizers";
import type {
  AvaliacaoAutorExplorar,
  AvaliacoesAutoresExplorar,
  PerfisAutoresExplorar,
} from "./explorar-author-profile-utils";

export type AutorExplorar = {
  chave: string;
  nome: string;
  autorId: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
  avaliacao?: AvaliacaoAutorExplorar;
};

export type OrdenacaoExplorar =
  | "relevancia"
  | "mais-curtidas"
  | "mais-salvas"
  | "mais-comentadas"
  | "mais-recentes"
  | "mais-capitulos";

export type FiltroColecaoExplorar =
  | "todos"
  | "favoritas"
  | "concluidas"
  | "lendo"
  | "sem-leitura";

export function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  if (categoriaNormalizada === "ficcao") {
    return (
      generoNormalizado.includes("ficcao") ||
      generoNormalizado.includes("sci-fi") ||
      generoNormalizado.includes("sci fi")
    );
  }

  return generoNormalizado.includes(categoriaNormalizada);
}


export function ordenarObrasLocais(lista: ObraLocal[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) => totalCurtidasObra(b) - totalCurtidasObra(a)
    );
  }

  if (ordenacao === "mais-salvas") {
    return novaLista.sort((a, b) => totalSalvosObra(b) - totalSalvosObra(a));
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) => totalComentariosObra(b) - totalComentariosObra(a)
    );
  }

  if (ordenacao === "mais-recentes") {
    return novaLista.sort((a, b) => dataCriacaoObra(b) - dataCriacaoObra(a));
  }

  if (ordenacao === "mais-capitulos") {
    return novaLista.sort((a, b) => b.capitulos.length - a.capitulos.length);
  }

  return novaLista;
}

export function filtrarObrasBaseExplorar({
  obrasLocais,
  filtroFormato,
  filtroClassificacao,
  filtroCapitulos,
  filtroColecao,
  usuarioLogado,
  ordenacao,
  obrasFavoritas,
  obrasConcluidas,
  colecaoTemObraExplorar,
}: {
  obrasLocais: ObraLocal[];
  filtroFormato: string;
  filtroClassificacao: string;
  filtroCapitulos: string;
  filtroColecao: FiltroColecaoExplorar;
  usuarioLogado: boolean;
  ordenacao: OrdenacaoExplorar;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  colecaoTemObraExplorar: (colecao: string[], obra: ObraLocal) => boolean;
}) {
    const filtradas = obrasLocais.filter((obra) => {
      const passaFormato =
        filtroFormato === "todos" ? true : obra.formato === filtroFormato;

      const classificacao18 = ehClassificacao18(obra.classificacaoIndicativa);
      const passaClassificacao =
        filtroClassificacao === "18+"
          ? classificacao18
          : filtroClassificacao === "todos"
            ? !classificacao18
            : !classificacao18 &&
              obra.classificacaoIndicativa === filtroClassificacao;

      const passaPublicacao =
        obra.publicado && obraTemConteudoPublicadoExplorar(obra);

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        !usuarioLogado || filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? colecaoTemObraExplorar(obrasFavoritas, obra)
            : filtroColecao === "concluidas"
              ? colecaoTemObraExplorar(obrasConcluidas, obra)
              : filtroColecao === "lendo"
                ? obraTemAtividadeLeitura(obra)
                : !obraTemAtividadeLeitura(obra);

      return (
        passaFormato &&
        passaClassificacao &&
        passaPublicacao &&
        passaCapitulos &&
        passaColecao
      );
    });

    return ordenarObrasLocais(filtradas, ordenacao);
}

export function filtrarObrasExplorar({
  obrasBaseFiltradas,
  categoriaSelecionada,
  termoBusca,
}: {
  obrasBaseFiltradas: ObraLocal[];
  categoriaSelecionada: string;
  termoBusca: string;
}) {
    return obrasBaseFiltradas.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaCategoria && passaBusca;
    });
}

export function criarAutoresExplorar({
  obrasBaseFiltradas,
  perfisAutores,
  avaliacoesAutores,
  language,
  categorias,
  criarBioAutorExplorar,
  criarPerfilAutorHrefExplorar,
}: {
  obrasBaseFiltradas: ObraLocal[];
  perfisAutores: PerfisAutoresExplorar;
  avaliacoesAutores: AvaliacoesAutoresExplorar;
  language: HistorietasLanguage;
  categorias: string[];
  criarBioAutorExplorar: (nome: string, generos: string[], language: HistorietasLanguage) => string;
  criarPerfilAutorHrefExplorar: (autor: string, autorId?: string) => string;
}) {
    type AutorAcumulado = {
      chave: string;
      nome: string;
      autorId: string;
      obrasIds: Set<string>;
      totalCurtidas: number;
      totalComentarios: number;
      generos: Set<string>;
    };

    const autores = new Map<string, AutorAcumulado>();

    obrasBaseFiltradas.forEach((obra) => {
      const autorId = obra.autorId?.trim() || "";
      const perfil = autorId ? perfisAutores[autorId] : undefined;
      const nome = perfil?.nome.trim() || obra.autor.trim() || "Autor não informado";
      const chave = autorId || normalizarTexto(nome);

      if (!chave) {
        return;
      }

      const atual = autores.get(chave) || {
        chave,
        nome,
        autorId,
        obrasIds: new Set<string>(),
        totalCurtidas: 0,
        totalComentarios: 0,
        generos: new Set<string>(),
      };

      atual.nome = perfil?.nome.trim() || atual.nome;
      atual.obrasIds.add(obra.id || obra.slug || criarSlugBase(obra.titulo));
      atual.totalCurtidas += totalCurtidasObra(obra);
      atual.totalComentarios += totalComentariosObra(obra);

      categorias.forEach((categoria) => {
        if (categoriaCombinaComGenero(categoria, obra.genero)) {
          atual.generos.add(categoria);
        }
      });

      autores.set(chave, atual);
    });

    return Array.from(autores.values())
      .map<AutorExplorar>((autor) => {
        const perfil = autor.autorId
          ? perfisAutores[autor.autorId]
          : undefined;
        const generos = Array.from(autor.generos);

        return {
          chave: autor.chave,
          nome: autor.nome,
          autorId: autor.autorId,
          avatar: perfil?.avatar || "",
          bio:
            perfil?.bio ||
            criarBioAutorExplorar(autor.nome, generos, language),
          totalObras: autor.obrasIds.size,
          totalCurtidas: autor.totalCurtidas,
          totalComentarios: autor.totalComentarios,
          generos,
          href: criarPerfilAutorHrefExplorar(autor.nome, autor.autorId),
          avaliacao: autor.autorId
            ? avaliacoesAutores[autor.autorId]
            : undefined,
        };
      })
      .sort(
        (autorA, autorB) =>
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCurtidas - autorA.totalCurtidas ||
          autorA.nome.localeCompare(autorB.nome, obterLocaleExplorar(language))
      );
}

export function filtrarAutoresExplorar({
  autoresExplorar,
  categoriaSelecionada,
  termoBusca,
}: {
  autoresExplorar: AutorExplorar[];
  categoriaSelecionada: string;
  termoBusca: string;
}) {
    return autoresExplorar.filter((autor) => {
      const passaCategoria = categoriaSelecionada
        ? autor.generos.some(
            (genero) =>
              normalizarTexto(genero) === normalizarTexto(categoriaSelecionada)
          )
        : true;
      const passaBusca = termoBusca
        ? normalizarTexto(autor.nome).includes(termoBusca)
        : true;

      return passaCategoria && passaBusca;
    });
}

export function criarSecoesCriativasObrasExplorar({
  obrasBaseFiltradas,
  categoriaSelecionada,
  termoBusca,
  filtroConteudo18Ativo,
}: {
  obrasBaseFiltradas: ObraLocal[];
  categoriaSelecionada: string;
  termoBusca: string;
  filtroConteudo18Ativo: boolean;
}) {
    if (categoriaSelecionada || termoBusca || filtroConteudo18Ativo) {
      return [] as Array<{ titulo: string; obras: ObraLocal[] }>;
    }

    const limitar = (lista: ObraLocal[]) => lista.slice(0, 12);
    const recomendacoes = limitar(
      [...obrasBaseFiltradas].sort(
        (obraA, obraB) =>
          pontuacaoRecomendacaoObraExplorar(obraB) -
            pontuacaoRecomendacaoObraExplorar(obraA) ||
          dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
      )
    );
    const publicacoesRecentes = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => dataCriacaoObra(obra) > 0)
        .sort((obraA, obraB) => dataCriacaoObra(obraB) - dataCriacaoObra(obraA))
    );
    const novosCapitulos = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 &&
            dataUltimoCapituloObraExplorar(obra) > 0
        )
        .sort(
          (obraA, obraB) =>
            dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
        )
    );
    const maisCurtidas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalCurtidasObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalCurtidasObra(obraB) - totalCurtidasObra(obraA)
        )
    );
    const maisComentadas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalComentariosObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalComentariosObra(obraB) - totalComentariosObra(obraA)
        )
    );
    const paraLerAgora = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 && obra.capitulos.length <= 3
        )
        .sort(
          (obraA, obraB) =>
            obraA.capitulos.length - obraB.capitulos.length ||
            pontuacaoRecomendacaoObraExplorar(obraB) -
              pontuacaoRecomendacaoObraExplorar(obraA)
        )
    );

    return [
      { titulo: "Recomendações para você", obras: recomendacoes },
      { titulo: "Publicações recentes", obras: publicacoesRecentes },
      { titulo: "Novos capítulos", obras: novosCapitulos },
      { titulo: "Mais curtidas", obras: maisCurtidas },
      { titulo: "Mais comentadas", obras: maisComentadas },
      { titulo: "Para ler agora", obras: paraLerAgora },
    ].filter((secao) => secao.obras.length > 0);
}

export function criarSecoesCriativasAutoresExplorar({
  autoresExplorar,
  categoriaSelecionada,
  termoBusca,
}: {
  autoresExplorar: AutorExplorar[];
  categoriaSelecionada: string;
  termoBusca: string;
}) {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ titulo: string; autores: AutorExplorar[] }>;
    }

    const autoresParaConhecer = autoresExplorar.slice(0, 12);
    const autoresEmDestaque = [...autoresExplorar]
      .sort(
        (autorA, autorB) =>
          autorB.totalObras * 12 +
            autorB.totalCurtidas * 4 +
            autorB.totalComentarios * 3 -
          (autorA.totalObras * 12 +
            autorA.totalCurtidas * 4 +
            autorA.totalComentarios * 3)
      )
      .slice(0, 12);
    const maisBemAvaliados = [...autoresExplorar]
      .filter(
        (autor) =>
          Boolean(autor.avaliacao) &&
          (autor.avaliacao?.total || 0) > 0 &&
          (autor.avaliacao?.media || 0) > 0
      )
      .sort(
        (autorA, autorB) =>
          (autorB.avaliacao?.media || 0) -
            (autorA.avaliacao?.media || 0) ||
          (autorB.avaliacao?.total || 0) -
            (autorA.avaliacao?.total || 0)
      )
      .slice(0, 12);

    return [
      { titulo: "Autores para conhecer", autores: autoresParaConhecer },
      { titulo: "Autores em destaque", autores: autoresEmDestaque },
      { titulo: "Mais bem avaliados", autores: maisBemAvaliados },
    ].filter((secao) => secao.autores.length > 0);
}

export function criarSecoesObrasPorGeneroExplorar({
  obrasBaseFiltradas,
  categoriaSelecionada,
  termoBusca,
  filtroConteudo18Ativo,
  categorias,
}: {
  obrasBaseFiltradas: ObraLocal[];
  categoriaSelecionada: string;
  termoBusca: string;
  filtroConteudo18Ativo: boolean;
  categorias: string[];
}) {
    if (categoriaSelecionada || termoBusca || filtroConteudo18Ativo) {
      return [] as Array<{ genero: string; obras: ObraLocal[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        obras: obrasBaseFiltradas.filter((obra) =>
          categoriaCombinaComGenero(genero, obra.genero)
        ),
      }))
      .filter((secao) => secao.obras.length > 0);
    const obrasCategorizadas = new Set(
      secoes.flatMap((secao) => secao.obras.map((obra) => obra.id))
    );
    const obrasOutros = obrasBaseFiltradas.filter(
      (obra) => !obrasCategorizadas.has(obra.id)
    );

    return obrasOutros.length > 0
      ? [...secoes, { genero: "Outros", obras: obrasOutros }]
      : secoes;
}

export function criarSecoesAutoresPorGeneroExplorar({
  autoresExplorar,
  categoriaSelecionada,
  termoBusca,
  categorias,
}: {
  autoresExplorar: AutorExplorar[];
  categoriaSelecionada: string;
  termoBusca: string;
  categorias: string[];
}) {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ genero: string; autores: AutorExplorar[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        autores: autoresExplorar.filter((autor) =>
          autor.generos.some(
            (generoAutor) =>
              normalizarTexto(generoAutor) === normalizarTexto(genero)
          )
        ),
      }))
      .filter((secao) => secao.autores.length > 0);
    const autoresCategorizados = new Set(
      secoes.flatMap((secao) => secao.autores.map((autor) => autor.chave))
    );
    const autoresOutros = autoresExplorar.filter(
      (autor) => !autoresCategorizados.has(autor.chave)
    );

    return autoresOutros.length > 0
      ? [...secoes, { genero: "Outros", autores: autoresOutros }]
      : secoes;
}
