import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { obterDetalheNotificacao } from "./notificacoes-display-utils";
import {
  pegarBooleano,
  pegarTagsSupabase,
  pegarTexto,
} from "./notificacoes-data-normalizers";
import {
  calcularProgressoLeitura,
  normalizarNotificacao,
  normalizarTipoNotificacao,
} from "./notificacoes-local-normalizers";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "./notificacoes-models";

export type SupabaseObraRow = Record<string, unknown>;
export type SupabaseCapituloRow = Record<string, unknown>;

export function normalizarObraSupabase(
  row: SupabaseObraRow,
  index: number
): ObraLocal {
  const titulo = pegarTexto(row.titulo, `Obra ${index + 1}`);
  const slug = pegarTexto(row.slug, criarSlugBase(titulo));

  return {
    id: pegarTexto(row.id, `supabase-${index + 1}`),
    titulo,
    autor: pegarTexto(row.autor ?? row.nome_autor ?? row.autor_nome, "Autor não informado"),
    autorId: pegarTexto(row.user_id ?? row.userId ?? row.autor_id ?? row.autorId, ""),
    genero: pegarTexto(row.genero, "Não informado"),
    formato: pegarTexto(row.formato, "Não informado"),
    classificacaoIndicativa: pegarTexto(
      row.classificacao_indicativa ?? row.classificacaoIndicativa,
      "Não informada"
    ),
    sinopse: pegarTexto(row.sinopse, "Nenhuma sinopse informada."),
    tags: pegarTagsSupabase(row.tags),
    capa: pegarTexto(row.capa_url ?? row.capaUrl ?? row.capa, ""),
    capaNome: pegarTexto(row.capa_nome ?? row.capaNome, ""),
    publicado: pegarBooleano(row.publicado, false),
    capitulos: [],
    criadaEm: pegarTexto(row.created_at ?? row.criada_em ?? row.criadaEm, ""),
    ultimoCapituloLidoId: "",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug,
    link: pegarTexto(row.link ?? row.href, `/obra/${slug}`),
  };
}

export function normalizarCapituloSupabase(
  row: SupabaseCapituloRow,
  index: number
): CapituloLocal & { obraId: string } {
  return {
    id: pegarTexto(row.id, `capitulo-supabase-${index + 1}`),
    titulo: pegarTexto(row.titulo, `Capítulo ${index + 1}`),
    texto: pegarTexto(row.texto ?? row.conteudo, ""),
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: pegarTexto(row.created_at ?? row.criado_em ?? row.criadoEm, ""),
    lido: false,
    lidoEm: "",
    obraId: pegarTexto(row.obra_id ?? row.obraId, ""),
  };
}

export function mesclarObrasPorIdSlug(
  obrasBase: ObraLocal[],
  obrasNovas: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [];

  function obterIdentificadores(obra: ObraLocal) {
    return new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((valor) => valor.trim())
        .filter(Boolean)
    );
  }

  [...obrasBase, ...obrasNovas].forEach((obra) => {
    const identificadoresObra = obterIdentificadores(obra);
    const indiceExistente = obrasMescladas.findIndex((obraExistente) => {
      const identificadoresExistentes = obterIdentificadores(obraExistente);

      return Array.from(identificadoresObra).some((identificador) =>
        identificadoresExistentes.has(identificador)
      );
    });

    if (indiceExistente < 0) {
      obrasMescladas.push(obra);
      return;
    }

    const existente = obrasMescladas[indiceExistente];
    const capitulosPorId = new Map<string, CapituloLocal>();

    [...existente.capitulos, ...obra.capitulos].forEach((capitulo) => {
      const capituloExistente = capitulosPorId.get(capitulo.id);

      capitulosPorId.set(
        capitulo.id,
        capituloExistente
          ? {
              ...capituloExistente,
              ...capitulo,
              curtiu: capituloExistente.curtiu || capitulo.curtiu,
              salvo: capituloExistente.salvo || capitulo.salvo,
              comentario: capitulo.comentario || capituloExistente.comentario,
              lido: capituloExistente.lido || capitulo.lido,
              lidoEm: capitulo.lidoEm || capituloExistente.lidoEm,
            }
          : capitulo
      );
    });

    const capitulos = Array.from(capitulosPorId.values());

    obrasMescladas[indiceExistente] = {
      ...existente,
      ...obra,
      autorId: obra.autorId || existente.autorId || "",
      capitulos,
      capa: obra.capa || existente.capa,
      capaNome: obra.capaNome || existente.capaNome,
      link: obra.link || existente.link,
      ultimoCapituloLidoId:
        obra.ultimoCapituloLidoId || existente.ultimoCapituloLidoId,
      ultimaLeituraEm: obra.ultimaLeituraEm || existente.ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
    };
  });

  return obrasMescladas;
}

export function normalizarNotificacaoSupabase(
  registro: Record<string, unknown>,
  index: number
): NotificacaoLocal | null {
  const metadata =
    registro.metadata &&
    typeof registro.metadata === "object" &&
    !Array.isArray(registro.metadata)
      ? (registro.metadata as Record<string, unknown>)
      : {};

  const id =
    pegarTexto(registro.notificacao_id) ||
    pegarTexto(metadata.notificacao_id) ||
    pegarTexto(registro.id) ||
    `notificacao-supabase-${index + 1}`;

  if (!id.trim()) {
    return null;
  }

  const criadaEm =
    pegarTexto(
      registro.criado_em ??
        registro.criada_em ??
        registro.created_at ??
        registro.atualizado_em ??
        registro.updated_at
    ) || new Date().toISOString();
  const tipo = normalizarTipoNotificacao(
    registro.tipo ?? metadata.tipo
  );
  const titulo = pegarTexto(
    registro.titulo ?? metadata.titulo,
    obterDetalheNotificacao({
      id,
      obraId: "",
      capituloId: "",
      link: "",
      titulo: "Nova notificação",
      mensagem: "Você recebeu uma nova notificação.",
      tipo,
      lida: false,
      criadaEm,
    })
  );
  const mensagem = pegarTexto(
    registro.mensagem ??
      registro.texto ??
      registro.descricao ??
      metadata.mensagem ??
      metadata.texto,
    "Você recebeu uma nova notificação."
  );

  return normalizarNotificacao(
    {
      id,
      obraId: pegarTexto(
        registro.obra_id ?? registro.obraId ?? metadata.obra_id
      ),
      capituloId: pegarTexto(
        registro.capitulo_id ??
          registro.capituloId ??
          metadata.capitulo_id
      ),
      link: pegarTexto(
        registro.link ??
          registro.href ??
          metadata.link ??
          metadata.href
      ),
      titulo,
      mensagem,
      tipo,
      lida: registro.lida === true || registro.lida === "true",
      criadaEm,
      autorId: pegarTexto(
        registro.autor_id ??
          registro.autorId ??
          registro.remetente_id ??
          registro.ator_id ??
          metadata.autor_id ??
          metadata.remetente_id ??
          metadata.ator_id
      ),
      autorNome: pegarTexto(
        registro.autor_nome ??
          registro.autorNome ??
          registro.remetente_nome ??
          metadata.autor_nome ??
          metadata.remetente_nome ??
          metadata.ator_nome
      ),
      autorAvatar: pegarTexto(
        registro.autor_avatar ??
          registro.autorAvatar ??
          registro.remetente_avatar ??
          metadata.autor_avatar ??
          metadata.remetente_avatar
      ),
      solicitacaoId: pegarTexto(
        registro.solicitacao_id ??
          registro.solicitacaoId ??
          metadata.solicitacao_id ??
          metadata.solicitacaoId
      ),
    },
    index
  );
}
