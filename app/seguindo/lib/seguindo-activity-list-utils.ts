import { normalizarTexto } from "../../../lib/utils";

type AtividadeListaSeguindo = {
  usuarioId: string;
  tipo: string;
  titulo: string;
  href: string;
  data: string;
};

function ordenarAtividadesSeguindo<T extends AtividadeListaSeguindo>(itens: T[]) {
  return [...itens].sort(
    (atividadeA, atividadeB) =>
      new Date(atividadeB.data).getTime() - new Date(atividadeA.data).getTime(),
  );
}

export function deduplicarAtividadesSeguindo<T extends AtividadeListaSeguindo>(
  itens: T[],
) {
  const atividadesPorChave = new Map<string, T>();

  ordenarAtividadesSeguindo(itens).forEach((atividade) => {
    const chave = [
      atividade.usuarioId,
      atividade.tipo,
      normalizarTexto(atividade.titulo),
      atividade.href,
    ].join("|");

    if (!atividadesPorChave.has(chave)) {
      atividadesPorChave.set(chave, atividade);
    }
  });

  return ordenarAtividadesSeguindo(Array.from(atividadesPorChave.values()));
}
