import { obterTextoRegistro } from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";

export function obterMetadataAtividadeSeguindo(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {} as RegistroSupabaseGenerico;
  }

  return valor as RegistroSupabaseGenerico;
}

export function obterRotuloAtividadeSeguindo(tipo: string) {
  if (tipo === "leu_capitulo") return "Leitura";
  if (tipo === "comecou_ler") return "Começou";
  if (tipo === "concluiu_obra") return "Concluiu";
  if (tipo === "avaliou_obra") return "Avaliou";
  if (tipo === "favoritou_obra") return "Favoritou";
  if (tipo === "salvou_obra") return "Salvou";
  if (tipo === "publicou_review") return "Review";
  if (tipo === "criou_lista") return "Lista";
  return "Diário";
}

export function montarTextoAtividadeSeguindo({
  tipo,
  tituloObra,
  nota,
}: {
  tipo: string;
  tituloObra: string;
  nota: number;
}) {
  if (tipo === "leu_capitulo") return `leu um capítulo de ${tituloObra}`;
  if (tipo === "comecou_ler") return `começou a ler ${tituloObra}`;
  if (tipo === "concluiu_obra") return `concluiu ${tituloObra}`;

  if (tipo === "avaliou_obra") {
    const notaTexto =
      Number.isFinite(nota) && nota > 0
        ? ` com ${nota.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} estrelas`
        : "";

    return `avaliou ${tituloObra}${notaTexto}`;
  }

  if (tipo === "favoritou_obra") return `favoritou ${tituloObra}`;
  if (tipo === "salvou_obra") return `salvou ${tituloObra}`;
  if (tipo === "publicou_review") {
    return `publicou uma review${tituloObra ? ` sobre ${tituloObra}` : ""}`;
  }
  if (tipo === "criou_lista") return "criou uma lista de leitura";

  return tituloObra
    ? `interagiu com ${tituloObra}`
    : "registrou uma atividade no Diário";
}

export function obterDataRegistroAtividadeSeguindo(
  registro: RegistroSupabaseGenerico,
) {
  return (
    obterTextoRegistro(registro, "criado_em") ||
    obterTextoRegistro(registro, "created_at") ||
    obterTextoRegistro(registro, "atualizado_em") ||
    obterTextoRegistro(registro, "updated_at")
  );
}

export function registroAtividadeSeguindoPodeAparecer(
  registro: RegistroSupabaseGenerico,
  fallback: "publico" | "parcial" | "privado",
) {
  const visibilidade =
    obterTextoRegistro(registro, "visibilidade") || fallback;

  if (
    visibilidade !== "publico" &&
    visibilidade !== "parcial" &&
    visibilidade !== "privado"
  ) {
    return fallback === "publico" || fallback === "parcial";
  }

  return visibilidade === "publico" || visibilidade === "parcial";
}

type UsuarioAtividadeSeguindo = {
  id: string;
  nome: string;
  handle: string;
  avatar: string;
};

export function criarAtividadeSeguindoPorDados({
  id,
  usuario,
  tipo,
  tituloObra,
  nota,
  data,
  href,
}: {
  id: string;
  usuario: UsuarioAtividadeSeguindo;
  tipo: string;
  tituloObra: string;
  nota: number;
  data: string;
  href: string;
}) {
  return {
    id,
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioHandle: usuario.handle,
    usuarioAvatar: usuario.avatar,
    tipo,
    tipoRotulo: obterRotuloAtividadeSeguindo(tipo),
    titulo: tituloObra,
    descricao: montarTextoAtividadeSeguindo({
      tipo,
      tituloObra,
      nota,
    }),
    data,
    href,
  };
}
