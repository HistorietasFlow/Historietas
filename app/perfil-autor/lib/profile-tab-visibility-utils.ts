import type { PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";
import type { AbaPerfilAutor } from "../types";

export function obterVisibilidadeAbasPerfilAutor({
  perfilPertenceAoUsuario,
  existeBloqueio,
  privacidadeCarregando,
  permissoes,
}: {
  perfilPertenceAoUsuario: boolean;
  existeBloqueio: boolean;
  privacidadeCarregando: boolean;
  permissoes: PermissoesAbasPerfil;
}) {
  const bloqueadoEntreUsuarios =
    !perfilPertenceAoUsuario && existeBloqueio;
  const abaVisivel = (permitida: boolean) =>
    perfilPertenceAoUsuario ||
    (!bloqueadoEntreUsuarios && !privacidadeCarregando && permitida);

  const obras = abaVisivel(permissoes.obras);
  const sobre = abaVisivel(permissoes.sobre);
  const diario = abaVisivel(permissoes.diario);
  const comunidade = abaVisivel(permissoes.comunidade);
  const biblioteca = abaVisivel(permissoes.biblioteca);
  const atividades = abaVisivel(permissoes.atividades);

  const totalVisiveis =
    Number(obras) +
    Number(diario) +
    Number(comunidade) +
    Number(sobre) +
    Number(biblioteca);

  const primeiraVisivel: AbaPerfilAutor | null = obras
    ? "obras"
    : diario
      ? "diario"
      : comunidade
        ? "comunidade"
        : sobre
          ? "sobre"
          : biblioteca
            ? "biblioteca"
            : null;

  return {
    perfilBloqueadoEntreUsuarios: bloqueadoEntreUsuarios,
    obrasPerfilVisivel: obras,
    sobrePerfilVisivel: sobre,
    diarioPerfilVisivel: diario,
    comunidadePerfilVisivel: comunidade,
    bibliotecaPerfilVisivel: biblioteca,
    atividadesPerfilVisivel: atividades,
    totalAbasPerfilVisiveis: totalVisiveis,
    temAbasPerfilVisiveis: totalVisiveis > 0,
    conteudoPrivadoBloqueado: Boolean(
      !perfilPertenceAoUsuario &&
        !privacidadeCarregando &&
        totalVisiveis === 0,
    ),
    primeiraAbaPerfilVisivel: primeiraVisivel,
  };
}
