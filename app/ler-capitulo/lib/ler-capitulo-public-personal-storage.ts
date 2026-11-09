import { carregarObrasLocaisNormalizadas, salvarObrasPreservandoContas } from "./ler-capitulo-local-storage";
import { preservarEstadoPessoalLeitor } from "./ler-capitulo-public-snapshot";
import type { ObraLocal } from "./ler-capitulo-work-normalization";

// O snapshot público não contém drafts ou edições locais do autor. Persisti-lo
// inteiro apagaria esses dados. Atualiza exclusivamente campos pessoais já conhecidos.
export function persistirEstadoPessoalLeituraPublica(obras: ObraLocal[], usuarioId: string) {
  try {
    const locais = carregarObrasLocaisNormalizadas(usuarioId);
    const porId = new Map(obras.map((obra) => [obra.id, obra]));
    salvarObrasPreservandoContas(locais.map((local) => {
      const pessoal = porId.get(local.id);
      return pessoal ? preservarEstadoPessoalLeitor(local, pessoal) : local;
    }), usuarioId);
  } catch {
    // Cache pessoal indisponível não bloqueia conteúdo confirmado nem autoriza
    // substituir dados que não foi possível ler com segurança.
  }
}
