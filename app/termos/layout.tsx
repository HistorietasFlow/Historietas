import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Termos e políticas",
  descricao: "Consulte os termos, as diretrizes da comunidade e a política de privacidade do Historietas.",
  caminho: "/termos",
});

export default function TermosLayout({ children }: { children: ReactNode }) {
  return children;
}
