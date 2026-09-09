import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Histórias em alta",
  descricao: "Veja as histórias, webnovels, fanfics e mangás que estão em alta entre os leitores do Historietas.",
  caminho: "/em-alta",
});

export default function EmAltaLayout({ children }: { children: ReactNode }) {
  return children;
}
