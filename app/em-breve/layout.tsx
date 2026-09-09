import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Próximos lançamentos",
  descricao: "Conheça as obras que serão lançadas em breve e acompanhe as próximas histórias do Historietas.",
  caminho: "/em-breve",
});

export default function EmBreveLayout({ children }: { children: ReactNode }) {
  return children;
}
