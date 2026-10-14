import type { ReactNode } from "react";

type ProfileTabContentProps = {
  bibliotecaPerfilAtiva: boolean;
  comunidadePerfilAtiva: boolean;
  diarioPerfilAtivo: boolean;
  obrasPerfilAtivo: boolean;
  sobrePerfilAtivo: boolean;
  renderBiblioteca: () => ReactNode;
  renderComunidade: () => ReactNode;
  renderDiario: () => ReactNode;
  renderObras: () => ReactNode;
  renderSobre: () => ReactNode;
};

export function ProfileTabContent({
  bibliotecaPerfilAtiva,
  comunidadePerfilAtiva,
  diarioPerfilAtivo,
  obrasPerfilAtivo,
  sobrePerfilAtivo,
  renderBiblioteca,
  renderComunidade,
  renderDiario,
  renderObras,
  renderSobre,
}: ProfileTabContentProps) {
  return (
    <>
      {bibliotecaPerfilAtiva && renderBiblioteca()}
      {diarioPerfilAtivo && renderDiario()}
      {comunidadePerfilAtiva && renderComunidade()}
      {sobrePerfilAtivo && renderSobre()}
      {obrasPerfilAtivo && renderObras()}
    </>
  );
}
