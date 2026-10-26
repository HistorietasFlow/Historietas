import { criarId } from "./adicionar-capitulo-id-utils";
import { criarHrefLeituraCapitulo } from "./adicionar-capitulo-route-utils";

type ObraNotificacao = { id: string; titulo: string; autor: string; publicado: boolean; capa: string; classificacaoIndicativa: string; slug: string; link: string };
type CapituloNotificacao = { id: string; titulo: string; ordem?: number };

export function criarNotificacaoNovoCapitulo(obra: ObraNotificacao, capitulo: CapituloNotificacao, numeroCapitulo: number, criadaEm: string) {
  return { id: criarId(), tipo: "novo-capitulo" as const, titulo: obra.publicado ? "Novo capítulo publicado" : "Novo capítulo salvo em rascunho", mensagem: `${capitulo.titulo} foi adicionado em ${obra.titulo}.`, obraId: obra.id, obraTitulo: obra.titulo, autor: obra.autor, capituloId: capitulo.id, capituloTitulo: `Capítulo ${numeroCapitulo}: ${capitulo.titulo}`, href: criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo), lida: false, criadaEm, obraPublicada: obra.publicado, capa: obra.capa, classificacaoIndicativa: obra.classificacaoIndicativa };
}
