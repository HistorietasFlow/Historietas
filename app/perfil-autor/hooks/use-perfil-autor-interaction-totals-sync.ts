import { useEffect, type Dispatch, type SetStateAction } from "react";
import { totaisInteracoesObrasPerfilVazio } from "../constants";
import type {
  ObraLocal,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import { carregarTotaisInteracoesObrasPerfilAutor } from "../lib/profile-interactions-loader";

export function usePerfilAutorInteractionTotalsSync({
  obras,
  setTotaisInteracoesObras,
}: {
  obras: ObraLocal[];
  setTotaisInteracoesObras: Dispatch<
    SetStateAction<TotaisInteracoesObrasPerfilAutor>
  >;
}) {
  useEffect(() => {
    let cancelado = false;

    async function carregarTotaisReaisPerfil() {
      if (obras.length === 0) {
        setTotaisInteracoesObras(totaisInteracoesObrasPerfilVazio);
        return;
      }

      const totaisReais = await carregarTotaisInteracoesObrasPerfilAutor(obras);

      if (!cancelado) {
        setTotaisInteracoesObras(totaisReais);
      }
    }

    void carregarTotaisReaisPerfil();

    return () => {
      cancelado = true;
    };
  }, [obras, setTotaisInteracoesObras]);
}
