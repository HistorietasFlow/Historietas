import type { ReactNode } from "react";
import { criarMetadataPagina } from "../../lib/seo";

import { urlSupabaseDoEnsaio } from "../../lib/server/previa-abertura-local";
import { origemPreviaVercel } from "../../lib/server/origem-previa-vercel.mjs";
import { HabilitarPreviaLocal } from "./components/explorar-previa";

export const metadata = criarMetadataPagina({
  titulo: "Explorar histórias",
  descricao: "Explore webnovels, fanfics, mangás, contos e histórias originais publicadas no Historietas.",
  caminho: "/explorar",
});

export default function ExplorarLayout({ children }: { children: ReactNode }) {
  const mostrarPrevia = urlSupabaseDoEnsaio() ||
    (process.env.HISTORIETAS_PREVIA_INTERFACE === "1" && origemPreviaVercel(process.env));
  return mostrarPrevia ? <HabilitarPreviaLocal>{children}</HabilitarPreviaLocal> : children;
}
