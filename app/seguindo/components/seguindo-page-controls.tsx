"use client";

import type { Dispatch, SetStateAction } from "react";
import { SeguindoHeader } from "./seguindo-header";
import { SeguindoSocialToolbar } from "./seguindo-social-toolbar";
import { SeguindoSortingPanel } from "./seguindo-sorting-panel";
import type {
  AbaConteudoSeguindo,
  OrdenacaoSeguindo,
} from "../lib/seguindo-page-types";

type SeguindoPageControlsProps = {
  isDesktop: boolean;
  busca: string;
  setBusca: Dispatch<SetStateAction<string>>;
  buscaSeguindoAberta: boolean;
  setBuscaSeguindoAberta: Dispatch<SetStateAction<boolean>>;
  setMostrarPainelOrdenacao: Dispatch<SetStateAction<boolean>>;
  visualizandoListaSocialDoPerfil: boolean;
  descricaoListaSocial: string;
  abaConteudo: AbaConteudoSeguindo;
  totalDisponivelGeral: number;
  trocarAbaConteudo: (aba: AbaConteudoSeguindo) => void;
  totalSeguidores: number;
  totalObrasSeguidas: number;
  totalPessoasSeguidas: number;
  mostrarPainelOrdenacao: boolean;
  opcoesOrdenacao: Array<{ valor: OrdenacaoSeguindo; rotulo: string }>;
  ordenacao: OrdenacaoSeguindo;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoSeguindo>>;
};

export function SeguindoPageControls({
  isDesktop,
  busca,
  setBusca,
  buscaSeguindoAberta,
  setBuscaSeguindoAberta,
  setMostrarPainelOrdenacao,
  visualizandoListaSocialDoPerfil,
  descricaoListaSocial,
  abaConteudo,
  totalDisponivelGeral,
  trocarAbaConteudo,
  totalSeguidores,
  totalObrasSeguidas,
  totalPessoasSeguidas,
  mostrarPainelOrdenacao,
  opcoesOrdenacao,
  ordenacao,
  setOrdenacao,
}: SeguindoPageControlsProps) {
  return (
    <>
      <SeguindoHeader
        isDesktop={isDesktop}
        busca={busca}
        setBusca={setBusca}
        buscaSeguindoAberta={buscaSeguindoAberta}
        setBuscaSeguindoAberta={setBuscaSeguindoAberta}
        setMostrarPainelOrdenacao={setMostrarPainelOrdenacao}
        visualizandoListaSocialDoPerfil={visualizandoListaSocialDoPerfil}
        descricaoListaSocial={descricaoListaSocial}
        abaConteudo={abaConteudo}
      />

      {totalDisponivelGeral > 0 && (
        <>
          <SeguindoSocialToolbar
            isDesktop={isDesktop}
            abaConteudo={abaConteudo}
            trocarAbaConteudo={trocarAbaConteudo}
            totalSeguidores={totalSeguidores}
            totalObrasSeguidas={totalObrasSeguidas}
            totalPessoasSeguidas={totalPessoasSeguidas}
          />

          {mostrarPainelOrdenacao && (
            <SeguindoSortingPanel
              isDesktop={isDesktop}
              opcoesOrdenacao={opcoesOrdenacao}
              ordenacao={ordenacao}
              setOrdenacao={setOrdenacao}
              setMostrarPainelOrdenacao={setMostrarPainelOrdenacao}
            />
          )}
        </>
      )}
    </>
  );
}
