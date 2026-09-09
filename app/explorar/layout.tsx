import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Explorar histórias",
  descricao: "Explore webnovels, fanfics, mangás, contos e histórias originais publicadas no Historietas.",
  caminho: "/explorar",
});

export default function ExplorarLayout({ children }: { children: ReactNode }) {
  return children;
}
