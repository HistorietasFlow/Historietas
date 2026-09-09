import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

export const metadata = criarMetadataPagina({
  titulo: "Diretrizes da comunidade",
  descricao: "Conheça as regras de convivência, segurança e respeito que orientam a comunidade Historietas.",
  caminho: "/diretrizes-da-comunidade",
});

export default function DiretrizesLayout({ children }: { children: ReactNode }) {
  return children;
}
