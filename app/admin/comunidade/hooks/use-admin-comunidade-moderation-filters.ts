import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DenunciaComContexto } from "../lib/admin-comunidade-report-context-utils";
import {
  filtrarDenunciasModeracao,
  filtrarDenunciasPerfisModeracao,
  type StatusFiltroDenuncia,
} from "../lib/admin-comunidade-filter-utils";
import type { DenunciaPerfilComContexto } from "../loaders/carregar-denuncias-perfis-moderacao";

type UseAdminComunidadeModerationFiltersParams = {
  denuncias: DenunciaComContexto[];
  denunciasPerfis: DenunciaPerfilComContexto[];
  setMenuDenunciaAbertoId: Dispatch<SetStateAction<string>>;
};

export function useAdminComunidadeModerationFilters({
  denuncias,
  denunciasPerfis,
  setMenuDenunciaAbertoId,
}: UseAdminComunidadeModerationFiltersParams) {
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroDenuncia>(
    "todas"
  );
  const [busca, setBusca] = useState("");
  const [buscaModeracaoAberta, setBuscaModeracaoAberta] = useState(false);
  const [mostrarFiltrosModeracao, setMostrarFiltrosModeracao] = useState(false);

  const denunciasFiltradas = useMemo(
    () => filtrarDenunciasModeracao(denuncias, statusFiltro, busca),
    [busca, denuncias, statusFiltro]
  );

  const denunciasPerfisFiltradas = useMemo(
    () =>
      filtrarDenunciasPerfisModeracao(
        denunciasPerfis,
        statusFiltro,
        busca
      ),
    [busca, denunciasPerfis, statusFiltro]
  );

  useEffect(() => {
    const fecharMenuTimer = window.setTimeout(() => {
      setMenuDenunciaAbertoId("");
    }, 0);

    return () => {
      window.clearTimeout(fecharMenuTimer);
    };
  }, [busca, setMenuDenunciaAbertoId, statusFiltro]);

  function limparFiltros() {
    setStatusFiltro("todas");
    setBusca("");
    setBuscaModeracaoAberta(false);
    setMostrarFiltrosModeracao(false);
  }

  return {
    statusFiltro,
    setStatusFiltro,
    busca,
    setBusca,
    buscaModeracaoAberta,
    setBuscaModeracaoAberta,
    mostrarFiltrosModeracao,
    setMostrarFiltrosModeracao,
    denunciasFiltradas,
    denunciasPerfisFiltradas,
    limparFiltros,
  };
}
