import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

import { urlSupabaseDoEnsaio } from "../../lib/server/previa-abertura-local";
import { HabilitarPreviaLocal } from "./components/explorar-previa";

export const metadata = criarMetadataPagina({
  titulo: "Explorar histórias",
  descricao: "Explore webnovels, fanfics, mangás, contos e histórias originais publicadas no Historietas.",
  caminho: "/explorar",
});

export default function ExplorarLayout({ children }: { children: ReactNode }) {
  return urlSupabaseDoEnsaio() ? <HabilitarPreviaLocal>{children}</HabilitarPreviaLocal> : children;
}
