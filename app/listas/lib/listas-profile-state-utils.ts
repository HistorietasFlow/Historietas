import { criarSlugBase } from "../../../lib/utils";
import {
  aplicarAnotacoesAosItensListas,
  dataRegistro,
  montarMapaAnotacoesPorObraListas,
} from "./listas-diary-annotation-utils";
import { timestampData } from "./listas-format-utils";
import {
  obterProgressoObraLocalListas,
} from "./listas-local-work-utils";
import {
  criarItemPerfil,
  criarMapaObrasPorIdentificadorListas,
  encontrarObraColecaoLocalListas,
  mesclarItensLocaisCategoriaPerfil,
  mesclarTudoPerfil,
  ordenarPorData,
} from "./listas-profile-items-utils";
import { pegarNumero, pegarTexto } from "./listas-value-utils";

type RegistroGenerico = Record<string, unknown>;

type CapituloListaLike = {
  id: string;
  titulo: string;
  ordem: number;
};

type ObraListaLike = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: CapituloListaLike[];
  notaMedia: number;
  totalAvaliacoes: number;
};

type ItemPerfilListaLike<
  TObra extends ObraListaLike,
  TCategoria extends string,
> = {
  chave: string;
  obra: TObra;
  categorias: TCategoria[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
};

type ProgressoPorObraLista = {
  registros: RegistroGenerico[];
  capitulosLidos: Set<string>;
  progressoInformado: number;
  data: string;
  capituloAtual: string;
};

type PerfilListaModelo = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
};

type ObraListaModelo = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: Array<{
    id: string;
    obraId: string;
    titulo: string;
    ordem: number;
    criadoEm: string;
  }>;
  notaMedia: number;
  totalAvaliacoes: number;
};

export function criarObraLista(row: RegistroGenerico, index: number): ObraListaModelo {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `obra-${index + 1}`),
    autorId: pegarTexto(row.user_id ?? row.autor_id),
    titulo,
    autor: pegarTexto(row.autor, "Autor não informado"),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(row.classificacao_indicativa),
    capa: pegarTexto(row.capa_url ?? row.capa),
    slug,
    link: `/obra/${slug}`,
    publicadaEm: pegarTexto(row.criada_em ?? row.created_at),
    visualizacoes: Math.max(0, Math.round(pegarNumero(row.visualizacoes))),
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos: [],
    notaMedia: 0,
    totalAvaliacoes: 0,
  };
}

export function criarPerfilLista(
  row: RegistroGenerico | null,
  userId: string,
  nomeFallback: string,
): PerfilListaModelo {
  return {
    userId: pegarTexto(row?.user_id ?? row?.id, userId),
    nome: pegarTexto(row?.nome) || nomeFallback.trim() || "Usuário",
    username: pegarTexto(row?.username).replace(/^@+/, ""),
    avatar: pegarTexto(row?.avatar_url),
    bio: pegarTexto(row?.bio ?? row?.sobre_bio, "Perfil no Historietas."),
  };
}

export function registroPermitido(
  registro: RegistroGenerico,
  proprioPerfil: boolean,
) {
  if (proprioPerfil) {
    return true;
  }

  const visibilidade = pegarTexto(registro.visibilidade);
  return visibilidade !== "privado";
}

type MontarListasPerfilEstadoArgs<
  TObra extends ObraListaLike,
> = {
  userId: string;
  proprioPerfil: boolean;
  seguindo: RegistroGenerico[];
  favoritas: RegistroGenerico[];
  concluidas: RegistroGenerico[];
  avaliacoes: RegistroGenerico[];
  progressoCompleto: RegistroGenerico[];
  anotacoesVisiveis: RegistroGenerico[];
  seguindoLocais: string[];
  favoritasLocais: string[];
  concluidasLocais: string[];
  obrasLocais: RegistroGenerico[];
  obras: TObra[];
};

export function montarListasPerfilEstado<
  TObra extends ObraListaLike & { titulo: string },
  TCategoria extends string,
  TItem extends ItemPerfilListaLike<TObra, TCategoria>,
>(args: MontarListasPerfilEstadoArgs<TObra>): Record<TCategoria, TItem[]> {
  const {
    userId,
    proprioPerfil,
    seguindo,
    favoritas,
    concluidas,
    avaliacoes,
    progressoCompleto,
    anotacoesVisiveis,
    seguindoLocais,
    favoritasLocais,
    concluidasLocais,
    obrasLocais,
    obras,
  } = args;
  const obrasPorId = new Map(obras.map((obra) => [obra.id, obra]));
  const obrasPorCapituloId = new Map<string, TObra>();

  obras.forEach((obra) => {
    obra.capitulos.forEach((capitulo) => {
      if (capitulo.id && !obrasPorCapituloId.has(capitulo.id)) {
        obrasPorCapituloId.set(capitulo.id, obra);
      }
    });
  });

  const obrasPorIdentificador = criarMapaObrasPorIdentificadorListas(obras);
  const concluidasIds = new Set(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => pegarTexto(registro.obra_id))
      .filter(Boolean),
  );

  concluidasLocais.forEach((identificador) => {
    const obra = encontrarObraColecaoLocalListas(
      identificador,
      obrasPorIdentificador,
    );

    if (obra?.id) {
      concluidasIds.add(obra.id);
    }
  });

  const queroLerRemoto = ordenarPorData(
    seguindo
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obraId = pegarTexto(registro.obra_id);
        const obra = obrasPorId.get(obraId);

        if (!obra || concluidasIds.has(obraId)) {
          return null;
        }

        return criarItemPerfil<TCategoria, TObra>(
          "quero-ler" as TCategoria,
          obra,
          registro,
        ) as TItem;
      })
      .filter((item): item is TItem => Boolean(item)),
  );
  const queroLer = mesclarItensLocaisCategoriaPerfil(
    "quero-ler",
    queroLerRemoto,
    seguindoLocais,
    obrasPorIdentificador,
    concluidasIds,
  );

  const favoritasRemotas = ordenarPorData(
    favoritas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra
          ? criarItemPerfil<TCategoria, TObra>(
              "favoritas" as TCategoria,
              obra,
              registro,
            ) as TItem
          : null;
      })
      .filter((item): item is TItem => Boolean(item)),
  );
  const itensFavoritas = mesclarItensLocaisCategoriaPerfil(
    "favoritas",
    favoritasRemotas,
    favoritasLocais,
    obrasPorIdentificador,
  );

  const concluidasRemotas = ordenarPorData(
    concluidas
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        return obra
          ? criarItemPerfil<TCategoria, TObra>(
              "concluidas" as TCategoria,
              obra,
              registro,
            ) as TItem
          : null;
      })
      .filter((item): item is TItem => Boolean(item)),
  );
  const itensConcluidas = mesclarItensLocaisCategoriaPerfil(
    "concluidas",
    concluidasRemotas,
    concluidasLocais,
    obrasPorIdentificador,
  );

  const itensAvaliacoes = ordenarPorData(
    avaliacoes
      .filter((registro) => registroPermitido(registro, proprioPerfil))
      .map((registro) => {
        const obra = obrasPorId.get(pegarTexto(registro.obra_id));
        const nota = pegarNumero(registro.nota);

        if (!obra || nota <= 0 || (obra.autorId && obra.autorId === userId)) {
          return null;
        }

        return criarItemPerfil<TCategoria, TObra>(
          "avaliacoes" as TCategoria,
          obra,
          registro,
          { nota },
        ) as TItem;
      })
      .filter((item): item is TItem => Boolean(item)),
  );

  const progressoPorObra = new Map<string, ProgressoPorObraLista>();

  progressoCompleto
    .filter((registro) => registroPermitido(registro, proprioPerfil))
    .forEach((registro) => {
      const obraIdRegistro = pegarTexto(registro.obra_id);
      const capituloId = pegarTexto(registro.capitulo_id);
      const obraResolvida =
        obrasPorId.get(obraIdRegistro) ||
        obrasPorCapituloId.get(capituloId) ||
        null;
      const obraId = obraResolvida?.id || obraIdRegistro;
      const lido = typeof registro.lido === "boolean" ? registro.lido : true;

      if (!obraId || !obraResolvida || !lido) {
        return;
      }

      const atual = progressoPorObra.get(obraId) || {
        registros: [],
        capitulosLidos: new Set<string>(),
        progressoInformado: 0,
        data: "",
        capituloAtual: "",
      };
      atual.registros.push(registro);

      if (capituloId) {
        atual.capitulosLidos.add(capituloId);
      }

      atual.progressoInformado = Math.max(
        atual.progressoInformado,
        pegarNumero(registro.progresso),
      );

      if (timestampData(dataRegistro(registro)) >= timestampData(atual.data)) {
        atual.data = dataRegistro(registro);
        atual.capituloAtual = capituloId;
      }

      progressoPorObra.set(obraId, atual);
    });

  obrasLocais.forEach((registro) => {
    const identificadores = [
      pegarTexto(registro.id),
      pegarTexto(registro.slug),
      pegarTexto(registro.titulo),
    ].filter(Boolean);
    const obra = identificadores
      .map((identificador) =>
        encontrarObraColecaoLocalListas(identificador, obrasPorIdentificador),
      )
      .find(Boolean);

    if (!obra || concluidasIds.has(obra.id)) {
      return;
    }

    const progressoLocal = obterProgressoObraLocalListas(registro);

    if (progressoLocal.progresso <= 0) {
      return;
    }

    const atual = progressoPorObra.get(obra.id) || {
      registros: [],
      capitulosLidos: new Set<string>(),
      progressoInformado: 0,
      data: "",
      capituloAtual: "",
    };

    atual.progressoInformado = Math.max(
      atual.progressoInformado,
      progressoLocal.progresso,
    );

    if (progressoLocal.capituloId) {
      atual.capitulosLidos.add(progressoLocal.capituloId);
    }

    if (timestampData(progressoLocal.data) >= timestampData(atual.data)) {
      atual.data = progressoLocal.data;
      atual.capituloAtual = progressoLocal.capituloId;
    }

    progressoPorObra.set(obra.id, atual);
  });

  const lendo: TItem[] = [];
  const historico: TItem[] = [];

  progressoPorObra.forEach((grupo, obraId) => {
    const obra = obrasPorId.get(obraId);

    if (!obra) {
      return;
    }

    const totalCapitulos = obra.capitulos.length;
    const capitulosLidosValidos = obra.capitulos.filter((capitulo) =>
      grupo.capitulosLidos.has(capitulo.id),
    ).length;
    const progressoCalculado = totalCapitulos
      ? Math.round((capitulosLidosValidos / totalCapitulos) * 100)
      : 0;

    // Em progresso_leitura, "progresso: 100" pode significar que apenas
    // o capítulo atual foi concluído. Quando há capítulos registrados,
    // calculamos o progresso da obra pela quantidade de capítulos lidos,
    // igual ao Diário do perfil. O valor informado fica apenas como
    // fallback para leituras mantidas localmente.
    const progressoFinal =
      capitulosLidosValidos > 0
        ? progressoCalculado
        : Math.min(99, Math.max(1, Math.round(grupo.progressoInformado)));
    const capitulo = obra.capitulos.find(
      (itemCapitulo) => itemCapitulo.id === grupo.capituloAtual,
    );
    const registroBase = grupo.registros[0] || {
      obra_id: obra.id,
      atualizado_em: grupo.data,
      origem_local: true,
    };
    const extras = {
      data: grupo.data || obra.publicadaEm,
      ultimaLeituraEm: grupo.data || obra.publicadaEm,
      progresso: progressoFinal,
      capituloAtual: capitulo?.titulo || "",
      capituloAtualId: grupo.capituloAtual,
      capitulosLidosIds: Array.from(grupo.capitulosLidos),
    };

    historico.push(
      criarItemPerfil<TCategoria, TObra>(
        "historico" as TCategoria,
        obra,
        registroBase,
        extras,
      ) as TItem,
    );

    if (progressoFinal > 0 && !concluidasIds.has(obraId)) {
      lendo.push(
        criarItemPerfil<TCategoria, TObra>(
          "lendo" as TCategoria,
          obra,
          registroBase,
          extras,
        ) as TItem,
      );
    }
  });

  const estado = {
    tudo: [],
    lendo: ordenarPorData(lendo),
    "quero-ler": queroLer,
    favoritas: itensFavoritas,
    concluidas: itensConcluidas,
    avaliacoes: itensAvaliacoes,
    historico: ordenarPorData(historico),
  } as Record<string, TItem[]>;

  estado.tudo = mesclarTudoPerfil([
    estado.lendo,
    estado["quero-ler"],
    estado.favoritas,
    estado.concluidas,
    estado.avaliacoes,
    estado.historico,
  ]);

  const anotacoesPorObra = montarMapaAnotacoesPorObraListas(anotacoesVisiveis);
  const notasPorObra = new Map<string, number>();

  avaliacoes
    .filter((registro) => registroPermitido(registro, proprioPerfil))
    .forEach((registro) => {
      const obraId = pegarTexto(registro.obra_id);
      const nota = Math.max(0, Math.min(5, pegarNumero(registro.nota)));

      if (obraId && nota > 0) {
        notasPorObra.set(obraId, Math.round(nota * 2) / 2);
      }
    });

  (Object.keys(estado) as TCategoria[]).forEach((categoriaEstado) => {
    estado[categoriaEstado] = aplicarAnotacoesAosItensListas(
      estado[categoriaEstado].map((item) => ({
        ...item,
        nota: notasPorObra.get(item.obra.id) || item.nota,
      })),
      anotacoesPorObra,
    ) as TItem[];
  });

  return estado as Record<TCategoria, TItem[]>;
}
