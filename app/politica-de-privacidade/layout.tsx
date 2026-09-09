import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Política de privacidade",
  descricao: "Saiba como o Historietas coleta, utiliza, protege e permite controlar seus dados pessoais.",
  caminho: "/politica-de-privacidade",
});

export default function PrivacidadeLayout({ children }: { children: ReactNode }) {
  return children;
}
