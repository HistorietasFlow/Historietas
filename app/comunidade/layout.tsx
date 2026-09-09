import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Comunidade de leitores e autores",
  descricao: "Participe de discussões, recomendações e conversas entre leitores e autores da comunidade Historietas.",
  caminho: "/comunidade",
});

export default function ComunidadeLayout({ children }: { children: ReactNode }) {
  return children;
}
