import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Central de ajuda",
  descricao: "Encontre respostas sobre conta, publicação, leitura, comunidade e privacidade no Historietas.",
  caminho: "/ajuda",
});

export default function AjudaLayout({ children }: { children: ReactNode }) {
  return children;
}
