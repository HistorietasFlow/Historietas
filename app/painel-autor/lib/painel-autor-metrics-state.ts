import type { ContratoMetricas } from "../../../lib/metricas";
import { criarChaveInteracao } from "./painel-autor-interaction-utils";

export function prepararEstadoMetricasPainel(metricas: ContratoMetricas) {
  const favoritosSupabase = new Set<string>();
  const concluidasSupabase = new Set<string>();
  const capitulosSalvos = new Set<string>();
  const capitulosCurtidos = new Set<string>();
  const progressoPorCapitulo = new Map<string, string>();
  const progressoCarregado = metricas.carregado;
  const capitulosComMetricas = new Set(metricas.capitulos.keys());

  metricas.obras.forEach((metrica) => {
    if (metrica.usuario.favoritou) favoritosSupabase.add(metrica.id);
    if (metrica.usuario.concluiu) concluidasSupabase.add(metrica.id);
  });

  metricas.capitulos.forEach((metrica) => {
    const chave = criarChaveInteracao(metrica.obraId, metrica.id);
    if (metrica.usuario.salvou) {
      capitulosSalvos.add(metrica.id);
      capitulosSalvos.add(chave);
    }
    if (metrica.usuario.curtiu) {
      capitulosCurtidos.add(metrica.id);
      capitulosCurtidos.add(chave);
    }
    if (metrica.usuario.leu) {
      progressoPorCapitulo.set(metrica.id, metrica.usuario.lidoEm);
      progressoPorCapitulo.set(chave, metrica.usuario.lidoEm);
    }
  });

  return { favoritosSupabase, concluidasSupabase, capitulosSalvos, capitulosCurtidos, progressoPorCapitulo, progressoCarregado, capitulosComMetricas };
}
