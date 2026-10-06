export function criarComentarioObraId() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return `comentario-obra-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function dataComentarioObra(comentario: { criadoEm: string }) {
  const data = new Date(comentario.criadoEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

export function obterIdsComentarioComRespostas(
  comentarios: Array<{ id: string; comentarioPaiId: string }>,
  comentarioId: string,
) {
  const ids = new Set<string>([comentarioId]);
  let encontrouNovos = true;

  while (encontrouNovos) {
    encontrouNovos = false;

    comentarios.forEach((comentario) => {
      if (
        comentario.comentarioPaiId &&
        ids.has(comentario.comentarioPaiId) &&
        !ids.has(comentario.id)
      ) {
        ids.add(comentario.id);
        encontrouNovos = true;
      }
    });
  }

  return ids;
}

export function formatarTempoRelativoComentarioObra(
  criadaEm: string,
  agora = Date.now()
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function obterObraIdComentarios(
  obra: { id?: string } | null,
) {
  return obra?.id?.trim() || "";
}

export function mesclarComentariosObraPorId(
  comentariosAtuais: ComentarioObraPublico[],
  novosComentarios: ComentarioObraPublico[],
) {
  const comentariosPorId = new Map(
    comentariosAtuais.map((comentario) => [comentario.id, comentario]),
  );

  novosComentarios.forEach((comentario) => {
    comentariosPorId.set(comentario.id, comentario);
  });

  return Array.from(comentariosPorId.values());
}

export function criarEstruturaComentariosObra(
  comentarios: ComentarioObraPublico[],
  ordenacao: OrdenacaoComentariosObra
) {
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [comentario.id, comentario])
  );
  const respostasPorRaiz = new Map<string, ComentarioObraPublico[]>();
  const comentariosRaiz: ComentarioObraPublico[] = [];

  function obterRaiz(comentario: ComentarioObraPublico) {
    let atual = comentario;
    const visitados = new Set<string>([comentario.id]);

    while (atual.comentarioPaiId) {
      const pai = comentariosPorId.get(atual.comentarioPaiId);

      if (!pai || visitados.has(pai.id)) {
        break;
      }

      visitados.add(pai.id);
      atual = pai;
    }

    return atual;
  }

  comentarios.forEach((comentario) => {
    const paiExiste = Boolean(
      comentario.comentarioPaiId &&
        comentariosPorId.has(comentario.comentarioPaiId)
    );

    if (!paiExiste) {
      comentariosRaiz.push(comentario);
      return;
    }

    const raiz = obterRaiz(comentario);
    const respostasAtuais = respostasPorRaiz.get(raiz.id) || [];

    respostasPorRaiz.set(raiz.id, [...respostasAtuais, comentario]);
  });

  respostasPorRaiz.forEach((respostas, raizId) => {
    respostasPorRaiz.set(
      raizId,
      [...respostas].sort(
        (a, b) => dataComentarioObra(a) - dataComentarioObra(b)
      )
    );
  });

  comentariosRaiz.sort((a, b) => {
    if (ordenacao === "recentes") {
      return dataComentarioObra(b) - dataComentarioObra(a);
    }

    const relevanciaA =
      a.curtidas.length * 3 + (respostasPorRaiz.get(a.id)?.length || 0);
    const relevanciaB =
      b.curtidas.length * 3 + (respostasPorRaiz.get(b.id)?.length || 0);

    return relevanciaB - relevanciaA || dataComentarioObra(b) - dataComentarioObra(a);
  });

  return {
    comentariosRaiz,
    respostasPorRaiz,
  };
}

export type OrdenacaoComentariosObra = "relevantes" | "recentes";

export type RespostaComentarioObra = {
  comentarioPaiId: string;
  autorId: string;
  autorNome: string;
};

export type SupabaseComentarioObraRow = {
  id: string;
  obra_id: string;
  user_id: string;
  comentario: string | null;
  comentario_pai_id: string | null;
  criado_em: string | null;
};

export type ComentarioObraPublico = {
  id: string;
  obraId: string;
  userId: string;
  nome: string;
  avatar: string;
  texto: string;
  criadoEm: string;
  comentarioPaiId: string;
  local: boolean;
  curtidas: string[];
};

export type PaginaComentariosObra = {
  comentarios: ComentarioObraPublico[];
  temMais: boolean;
  proximoOffset: number;
};
