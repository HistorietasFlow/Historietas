import Link from "next/link";
import { useState } from "react";
import { lerProximoCapitulo, registrarProximoCapitulo } from "../../../lib/publicacao-proximo-capitulo";
import { emptyMiniBoxStyle, emptyMiniTitleStyle } from "../lib/painel-autor-empty-state-style-utils";
import { criarHrefAdicionarCapituloPainel } from "../lib/painel-autor-route-utils";
import type { ObraLocal } from "../lib/painel-autor-types";
import { chapterButtonStyle } from "../lib/painel-autor-work-actions-style-utils";

export function PainelAutorNextChapter({
  autorId,
  obras,
}: {
  autorId: string;
  obras: ObraLocal[];
}) {
  const [confirmacao, setConfirmacao] = useState(() => lerProximoCapitulo(autorId));
  if (!confirmacao) return null;

  const obra = obras.find(
    item => item.id === confirmacao.obraId && item.autorId === autorId && item.publicado &&
      item.capitulos.some(capitulo => capitulo.id === confirmacao.capituloId && capitulo.publicado !== false),
  );
  if (!obra) return null;

  return (
    <section aria-labelledby="painel-proximo-capitulo" style={emptyMiniBoxStyle}>
      <h2 id="painel-proximo-capitulo" style={emptyMiniTitleStyle}>Capítulo 1 publicado</h2>
      <span>{obra.titulo}</span>
      <Link
        href={criarHrefAdicionarCapituloPainel(obra.id)}
        prefetch={false}
        style={{ ...chapterButtonStyle, justifySelf: "start" }}
        onClick={() => {
          registrarProximoCapitulo(null);
          setConfirmacao(null);
        }}
      >
        Adicionar próximo capítulo
      </Link>
    </section>
  );
}
