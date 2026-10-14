import { supabase } from "../../../lib/supabase/client";
import {
  carregarAnotacoesLocaisListas,
} from "./listas-diary-annotation-utils";
import {
  carregarObrasLocaisListas,
} from "./listas-local-work-utils";
import {
  carregarObrasPublicadas,
} from "./listas-published-works-loader";
import {
  carregarRegistrosUsuario,
} from "./listas-profile-records-loader";
import {
  montarListasPerfilEstado,
  registroPermitido,
} from "./listas-profile-state-utils";
import {
  carregarListaIdsListas,
} from "./listas-storage-utils";
import { pegarTexto } from "./listas-value-utils";

type RegistroGenerico = Record<string, unknown>;
type ObraLista = Awaited<ReturnType<typeof carregarObrasPublicadas>>[number];

type ItemObraListaLike<TCategoria extends string> = {
  chave: string;
  obra: ObraLista;
  categorias: TCategoria[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
};

type StorageKeysListas = {
  seguindo: string;
  favoritas: string;
  concluidas: string;
};

export async function carregarListasDoPerfil<
  TCategoria extends string,
  TItem extends ItemObraListaLike<TCategoria>,
>(
  userId: string,
  proprioPerfil: boolean,
  storageKeys: StorageKeysListas,
) {
  const [seguindo, favoritas, concluidas, avaliacoes, progresso, anotacoes] =
    await Promise.all([
      carregarRegistrosUsuario(
        "seguindo_obras",
        userId,
      ),
      carregarRegistrosUsuario(
        "favoritos",
        userId,
      ),
      carregarRegistrosUsuario(
        "concluidas",
        userId,
      ),
      carregarRegistrosUsuario(
        "obra_avaliacoes",
        userId,
      ),
      carregarRegistrosUsuario(
        "progresso_leitura",
        userId,
      ),
      carregarRegistrosUsuario(
        "diario_anotacoes",
        userId,
      ),
    ]);

  const capituloIdsSemObra = Array.from(
    new Set(
      progresso
        .filter((registro) => !pegarTexto(registro.obra_id))
        .map((registro) => pegarTexto(registro.capitulo_id))
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
      // Mantém os registros originais caso não seja possível resolver o capítulo.
    }
  }

  const progressoCompleto = progresso.map((registro) => {
    if (pegarTexto(registro.obra_id)) {
      return registro;
    }

    const obraIdResolvido = obraIdPorCapituloSemObra.get(
      pegarTexto(registro.capitulo_id),
    );

    return obraIdResolvido
      ? { ...registro, obra_id: obraIdResolvido }
      : registro;
  });

  const seguindoLocais = proprioPerfil
    ? carregarListaIdsListas(storageKeys.seguindo, userId)
    : [];
  const favoritasLocais = proprioPerfil
    ? carregarListaIdsListas(storageKeys.favoritas, userId)
    : [];
  const concluidasLocais = proprioPerfil
    ? carregarListaIdsListas(storageKeys.concluidas, userId)
    : [];
  const obrasLocais = proprioPerfil ? carregarObrasLocaisListas(userId) : [];
  const anotacoesLocais = proprioPerfil
    ? carregarAnotacoesLocaisListas(userId)
    : [];
  const anotacoesVisiveis = [...anotacoesLocais, ...anotacoes];

  const registrosVisiveis = [
    ...seguindo,
    ...favoritas,
    ...concluidas,
    ...avaliacoes,
    ...progressoCompleto,
    ...anotacoesVisiveis,
  ].filter((registro) =>
    anotacoesVisiveis.includes(registro)
      ? true
      : registroPermitido(registro, proprioPerfil),
  );

  const idsObrasRemotos = Array.from(
    new Set(
      registrosVisiveis
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
  const obras = idsObrasRemotos.length > 0
    ? await carregarObrasPublicadas(idsObrasRemotos)
    : await carregarObrasPublicadas([]);
  return montarListasPerfilEstado<
    ObraLista,
    TCategoria,
    TItem
  >({
    userId,
    proprioPerfil,
    seguindo: seguindo as RegistroGenerico[],
    favoritas: favoritas as RegistroGenerico[],
    concluidas: concluidas as RegistroGenerico[],
    avaliacoes: avaliacoes as RegistroGenerico[],
    progressoCompleto: progressoCompleto as RegistroGenerico[],
    anotacoesVisiveis: anotacoesVisiveis as RegistroGenerico[],
    seguindoLocais,
    favoritasLocais,
    concluidasLocais,
    obrasLocais,
    obras,
  });
}
