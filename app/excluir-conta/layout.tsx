import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Excluir conta",
  descricao: "Veja como excluir sua conta e seus dados do Historietas ou envie uma solicitação caso não consiga entrar.",
  caminho: "/excluir-conta",
});

export default function ExcluirContaLayout({ children }: { children: ReactNode }) {
  return children;
}
