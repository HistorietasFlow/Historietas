import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import type {
  DiarioPerfilEstado,
  DiarioPerfilItem,
  ObraLocal,
  VisibilidadeDiarioPerfil,
} from "../types";
import {
  mesclarObrasPorIdSlug,
  pegarNumero,
  pegarTexto,
} from "./data-normalizers";
import { colecaoTemObraPerfilBiblioteca } from "./library-normalizers";
import {
  criarItemAtividadeDiarioPerfil,
  criarItemDiarioPerfil,
  montarMapaObrasDiario,
  obterObraRegistroDiario,
} from "./profile-diary-item-utils";
import { coletarObraIdsRegistrosDiarioPerfil } from "./profile-diary-local-utils";
import { ordenarItensDiarioPerfil } from "./profile-diary-merge-utils";
import {
  obterDataRegistroDiario,
  obterVisibilidadeRegistroDiario,
  registroDiarioPodeAparecer,
} from "./profile-diary-record-utils";
import {
  formatarMediaAvaliacaoAutor,
  obterTimestampData,
} from "./profile-formatters";
import { carregarObrasPublicadasPorIdsSupabase } from "./profile-published-works-loader";
import { carregarRegistrosDiarioPerfil } from "./profile-user-collections-loader";

export async function carregarDiarioPerfilSupabase(
  userId: string,
  obrasDisponiveis: ObraLocal[],
  incluirPrivados: boolean,
  liberarConteudoDiario: boolean,
  liberarAtividades: boolean,
  obrasConcluidasIdsLocais: string[] = [],
): Promise<Omit<DiarioPerfilEstado, "carregando">> {
  const incluirItensDoDiario = incluirPrivados || liberarConteudoDiario;
  const incluirItensDasAtividades = incluirPrivados || liberarAtividades;
  const [seguindoObras, favoritos, concluidas, progresso] = await Promise.all([
    carregarRegistrosDiarioPerfil("seguindo_obras", userId),
    carregarRegistrosDiarioPerfil("favoritos", userId),
    carregarRegistrosDiarioPerfil("concluidas", userId),
    carregarRegistrosDiarioPerfil("progresso_leitura", userId),
  ]);

  const [avaliacoes, diarioAtividades] = await Promise.all([
    carregarRegistrosDiarioPerfil("obra_avaliacoes", userId),
    carregarRegistrosDiarioPerfil("diario_atividades", userId),
  ]);

  const capituloIdsSemObra = Array.from(
    new Set(
      progresso
        .filter(
          (registro) =>
            !pegarTexto(registro.obra_id ?? registro.obraId),
        )
        .map((registro) =>
          pegarTexto(registro.capitulo_id ?? registro.capituloId),
        )
        .filter(Boolean),
    ),
  );
  let obraIdPorCapituloSemObra = new Map<string, string>();

  if (capituloIdsSemObra.length > 0) {
    try {
      const { data, error } = await supabase
        .from("capitulos")
        .select("id,obra_id")
        .in("id", capituloIdsSemObra)
        .limit(capituloIdsSemObra.length);

      if (!error && Array.isArray(data)) {
        const paresCapituloObra: Array<[string, string]> = [];

        for (const registro of data) {
          const capituloId = pegarTexto(registro?.id);
          const obraId = pegarTexto(registro?.obra_id);

          if (capituloId && obraId) {
            paresCapituloObra.push([capituloId, obraId]);
          }
        }

        obraIdPorCapituloSemObra = new Map<string, string>(
          paresCapituloObra,
        );
      }
    } catch {
      // Mantém os registros originais caso o capítulo não possa ser resolvido.
    }
  }

  const progressoCompleto = progresso.map((registro) => {
    if (pegarTexto(registro.obra_id ?? registro.obraId)) {
      return registro;
    }

    const obraIdResolvido = obraIdPorCapituloSemObra.get(
      pegarTexto(registro.capitulo_id ?? registro.capituloId),
    );

    return obraIdResolvido
      ? { ...registro, obra_id: obraIdResolvido }
      : registro;
  });

  const idsObrasDiario = Array.from(
    new Set([
      ...coletarObraIdsRegistrosDiarioPerfil(seguindoObras),
      ...coletarObraIdsRegistrosDiarioPerfil(favoritos),
      ...coletarObraIdsRegistrosDiarioPerfil(concluidas),
      ...coletarObraIdsRegistrosDiarioPerfil(avaliacoes),
      ...coletarObraIdsRegistrosDiarioPerfil(progressoCompleto),
      ...coletarObraIdsRegistrosDiarioPerfil(diarioAtividades),
    ]),
  );
  const idsObrasDisponiveis = new Set(
    obrasDisponiveis.map((obra) => obra.id).filter(Boolean),
  );
  const idsObrasFaltantes = idsObrasDiario.filter(
    (obraId) => !idsObrasDisponiveis.has(obraId),
  );
  const obrasFaltantes = await carregarObrasPublicadasPorIdsSupabase(
    idsObrasFaltantes,
  );
  const obrasParaDiario = mesclarObrasPorIdSlug(
    obrasDisponiveis,
    obrasFaltantes,
  ).filter(
    (obra) =>
      incluirPrivados ||
      !ehClassificacao18(obra.classificacaoIndicativa),
  );
  const { obrasPorId, obrasPorCapituloId } =
    montarMapaObrasDiario(obrasParaDiario);

  const concluidasIds = new Set(
    concluidas
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "parcial"),
      )
      .map((registro) => pegarTexto(registro.obra_id ?? registro.obraId))
      .filter(Boolean),
  );

  const progressoPorObra = new Map<
    string,
    {
      obra: ObraLocal;
      capitulosLidos: Map<string, string>;
      ultimoCapituloLidoId: string;
      ultimaLeituraEm: string;
      progressoInformado: number;
      visibilidade: VisibilidadeDiarioPerfil;
    }
  >();

  progressoCompleto.forEach((registro) => {
    if (!registroDiarioPodeAparecer(registro, incluirItensDoDiario, "privado")) {
      return;
    }

    const registroLido =
      typeof registro.lido === "boolean" ? registro.lido : true;

    if (!registroLido) {
      return;
    }

    const obra = obterObraRegistroDiario(
      registro,
      obrasPorId,
      obrasPorCapituloId,
    );

    if (
      !obra ||
      concluidasIds.has(obra.id) ||
      colecaoTemObraPerfilBiblioteca(obrasConcluidasIdsLocais, obra)
    ) {
      return;
    }

    const capituloId = pegarTexto(
      registro.capitulo_id ?? registro.capituloId,
    );
    const capituloPublicado = obra.capitulos.find(
      (capitulo) => capitulo.id === capituloId,
    );
    const data =
      obterDataRegistroDiario(registro) ||
      capituloPublicado?.lidoEm ||
      obra.ultimaLeituraEm ||
      obra.criadaEm;
    const grupoAtual = progressoPorObra.get(obra.id) || {
      obra,
      capitulosLidos: new Map<string, string>(),
      ultimoCapituloLidoId: "",
      ultimaLeituraEm: "",
      progressoInformado: 0,
      visibilidade: obterVisibilidadeRegistroDiario(
        registro,
        "privado",
      ),
    };

    if (capituloId) {
      grupoAtual.capitulosLidos.set(capituloId, data);
    }

    grupoAtual.progressoInformado = Math.max(
      grupoAtual.progressoInformado,
      pegarNumero(registro.progresso),
    );

    if (
      obterTimestampData(data) >=
      obterTimestampData(grupoAtual.ultimaLeituraEm)
    ) {
      grupoAtual.ultimoCapituloLidoId = capituloId;
      grupoAtual.ultimaLeituraEm = data;
      grupoAtual.visibilidade = obterVisibilidadeRegistroDiario(
        registro,
        "privado",
      );
    }

    progressoPorObra.set(obra.id, grupoAtual);
  });

  const lendoPorObra = new Map<string, DiarioPerfilItem>();

  progressoPorObra.forEach((grupo, obraId) => {
    const totalCapitulos = grupo.obra.capitulos.length;
    const capitulosLidosValidos = grupo.obra.capitulos.filter((capitulo) =>
      grupo.capitulosLidos.has(capitulo.id),
    ).length;
    const progressoCalculado = totalCapitulos
      ? Math.round((capitulosLidosValidos / totalCapitulos) * 100)
      : 0;
    const progressoObra =
      capitulosLidosValidos > 0
        ? progressoCalculado
        : Math.min(
            99,
            Math.max(1, Math.round(grupo.progressoInformado)),
          );

    if (progressoObra <= 0) {
      return;
    }

    const capitulos = grupo.obra.capitulos.map((capitulo) => {
      const lidoEm = grupo.capitulosLidos.get(capitulo.id) || "";

      return {
        ...capitulo,
        lido: Boolean(lidoEm),
        lidoEm,
      };
    });

    const obraComProgresso: ObraLocal = {
      ...grupo.obra,
      capitulos,
      ultimoCapituloLidoId: grupo.ultimoCapituloLidoId,
      ultimaLeituraEm: grupo.ultimaLeituraEm,
      progressoLeitura: progressoObra,
    };

    lendoPorObra.set(
      obraId,
      criarItemDiarioPerfil(
        "lendo",
        obraComProgresso,
        grupo.ultimaLeituraEm || grupo.obra.criadaEm,
        `Leitura em andamento • ${progressoObra}% concluída`,
        {
          progresso: progressoObra,
          visibilidade: grupo.visibilidade,
        },
      ),
    );
  });

  const lendoAgora = ordenarItensDiarioPerfil(Array.from(lendoPorObra.values()));

  const queroLer = ordenarItensDiarioPerfil(
    seguindoObras
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "privado"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra || concluidasIds.has(obra.id)) {
          return null;
        }

        return criarItemDiarioPerfil(
          "quero_ler",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          "Adicionada para acompanhar depois",
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "privado",
            ),
          },
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const favoritas = ordenarItensDiarioPerfil(
    favoritos
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "parcial"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra) {
          return null;
        }

        return criarItemDiarioPerfil(
          "favorita",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          "Obra favoritada no Diário",
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "parcial",
            ),
          },
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const concluidasItens = ordenarItensDiarioPerfil(
    concluidas
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "parcial"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);

        if (!obra) {
          return null;
        }

        return criarItemDiarioPerfil(
          "concluida",
          obra,
          obterDataRegistroDiario(registro) || obra.ultimaLeituraEm || obra.criadaEm,
          "Obra marcada como concluída",
          {
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "parcial",
            ),
          },
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const avaliacoesItens = ordenarItensDiarioPerfil(
    avaliacoes
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "publico"),
      )
      .map((registro) => {
        const obra = obterObraRegistroDiario(registro, obrasPorId, obrasPorCapituloId);
        const nota = Number(registro.nota ?? registro.rating ?? registro.avaliacao);

        if (!obra || !Number.isFinite(nota) || nota <= 0) {
          return null;
        }

        return criarItemDiarioPerfil(
          "avaliacao",
          obra,
          obterDataRegistroDiario(registro) || obra.criadaEm,
          `Avaliou com ${formatarMediaAvaliacaoAutor(nota).replace(".", ",")} estrelas`,
          {
            nota,
            visibilidade: obterVisibilidadeRegistroDiario(
              registro,
              "publico",
            ),
          },
        );
      })
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const atividadesDoDiario = ordenarItensDiarioPerfil(
    diarioAtividades
      .filter((registro) =>
        registroDiarioPodeAparecer(registro, incluirItensDoDiario, "privado"),
      )
      .map((registro) =>
        criarItemAtividadeDiarioPerfil(registro, obrasPorId, obrasPorCapituloId),
      )
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );
  const atividadesReais = ordenarItensDiarioPerfil(
    diarioAtividades
      .filter((registro) =>
        registroDiarioPodeAparecer(
          registro,
          incluirItensDasAtividades,
          "privado",
        ),
      )
      .map((registro) =>
        criarItemAtividadeDiarioPerfil(registro, obrasPorId, obrasPorCapituloId),
      )
      .filter((item): item is DiarioPerfilItem => Boolean(item)),
  );

  const reviews = atividadesDoDiario.filter((item) => item.tipo === "review");

  const atividades = ordenarItensDiarioPerfil([
    ...atividadesReais,
    ...lendoAgora,
    ...queroLer,
    ...favoritas,
    ...concluidasItens,
    ...avaliacoesItens,
  ]).slice(0, 12);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas: concluidasItens,
    avaliacoes: avaliacoesItens,
    reviews,
    atividades,
  };
}
