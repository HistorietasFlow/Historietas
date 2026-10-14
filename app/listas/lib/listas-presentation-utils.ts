import { formatarMesAno } from "./listas-format-utils";
import { tituloSecaoPublica } from "./listas-profile-text-utils";

type ItemComDataListas = {
  data: string;
};

export function calcularTotalResultadosListas({
  modo,
  itensPerfil,
  autores,
  obras,
}: {
  modo: string;
  itensPerfil: unknown[];
  autores: unknown[];
  obras: unknown[];
}) {
  return modo === "perfil"
    ? itensPerfil.length
    : modo === "autores"
      ? autores.length
      : obras.length;
}

export function obterTituloPaginaListas({
  tituloPersonalizado,
  modo,
  origemPerfil,
  perfilNome,
  secao,
  genero,
}: {
  tituloPersonalizado: string;
  modo: string;
  origemPerfil: string;
  perfilNome: string;
  secao: string;
  genero: string;
}) {
  return (
    tituloPersonalizado ||
    (modo === "perfil"
      ? `${origemPerfil === "biblioteca" ? "Biblioteca" : "Diário"} de ${
          perfilNome || "usuário"
        }`
      : modo === "autores"
        ? "Autores para conhecer"
        : tituloSecaoPublica(secao, genero))
  );
}

export function deveAgruparPorMesListas(modo: string, categoria: string) {
  return modo === "perfil" && (categoria === "avaliacoes" || categoria === "historico");
}

export function agruparItensPerfilPorMesListas<TItem extends ItemComDataListas>(
  itens: TItem[],
) {
  const grupos = new Map<string, TItem[]>();

  itens.forEach((item) => {
    const chave = formatarMesAno(item.data);
    const atuais = grupos.get(chave) || [];
    atuais.push(item);
    grupos.set(chave, atuais);
  });

  return Array.from(grupos.entries());
}
