import { agruparIdsAlvosDenunciados } from "../lib/admin-comunidade-target-id-utils";
import { criarMapasContextoModeracao } from "../lib/admin-comunidade-context-map-utils";
import {
  montarDenunciasComContextoModeracao,
  type DenunciaComContexto,
} from "../lib/admin-comunidade-report-context-utils";
import { buscarAlvosPrimariosModeracao } from "./carregar-alvos-primarios-moderacao";
import { buscarAnotacoesDiarioContextoModeracao } from "./carregar-anotacoes-diario-contexto-moderacao";
import { buscarCapitulosContextoModeracao } from "./carregar-capitulos-contexto-moderacao";
import { buscarDenunciasBaseModeracao } from "./carregar-denuncias-base-moderacao";
import { buscarObrasContextoModeracao } from "./carregar-obras-contexto-moderacao";
import { buscarPerfisContextoModeracao } from "./carregar-perfis-contexto-moderacao";

export async function carregarDenunciasComContextoModeracao(): Promise<
  DenunciaComContexto[]
> {
  const denunciasMapeadas = await buscarDenunciasBaseModeracao();

  const {
    postIds,
    comentarioIds,
    comentarioCapituloIds,
    obraIdsDenunciadas,
    capituloIdsDenunciados,
    comentarioObraIds,
    diarioAnotacaoIds,
    comentarioDiarioIds,
  } = agruparIdsAlvosDenunciados(denunciasMapeadas);

  const {
    posts,
    comentarios,
    comentariosCapitulos,
    comentariosObras,
    comentariosDiario,
  } = await buscarAlvosPrimariosModeracao({
    postIds,
    comentarioIds,
    comentarioCapituloIds,
    comentarioObraIds,
    comentarioDiarioIds,
  });

  const diarioAnotacoes =
    await buscarAnotacoesDiarioContextoModeracao({
      diarioAnotacaoIds,
      comentariosDiario,
    });

  const capitulos =
    await buscarCapitulosContextoModeracao({
      capituloIdsDenunciados,
      comentariosCapitulos,
    });

  const obras =
    await buscarObrasContextoModeracao({
      obraIdsDenunciadas,
      capitulos,
      comentariosObras,
      diarioAnotacoes,
    });

  const perfis = await buscarPerfisContextoModeracao({
    denunciasMapeadas,
    comentariosCapitulos,
    comentariosObras,
    comentariosDiario,
    diarioAnotacoes,
    capitulos,
    obras,
  });

  const {
    perfisPorId,
    postsPorId,
    comentariosPorId,
    comentariosCapitulosPorId,
    comentariosObrasPorId,
    comentariosDiarioPorId,
    diarioAnotacoesPorId,
    capitulosPorId,
    obrasPorId,
  } = criarMapasContextoModeracao({
    perfis,
    posts,
    comentarios,
    comentariosCapitulos,
    comentariosObras,
    comentariosDiario,
    diarioAnotacoes,
    capitulos,
    obras,
  });

  const denunciasComContexto = montarDenunciasComContextoModeracao({
    denunciasMapeadas,
    perfisPorId,
    postsPorId,
    comentariosPorId,
    comentariosCapitulosPorId,
    comentariosObrasPorId,
    comentariosDiarioPorId,
    diarioAnotacoesPorId,
    capitulosPorId,
    obrasPorId,
  });

  return denunciasComContexto;
}
