import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Termos de uso",
  descricao: "Leia as condições para criar uma conta, publicar obras e usar os recursos oferecidos pelo Historietas.",
  caminho: "/termos-de-uso",
});

export default function TermosDeUsoLayout({ children }: { children: ReactNode }) {
  return children;
}
