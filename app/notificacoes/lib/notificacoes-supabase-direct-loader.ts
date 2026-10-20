import {
  acessoConteudo18Confirmado,
  ehClassificacao18,
} from "../../../lib/historietasAdultContent";
import { supabase } from "../../../lib/supabase/client";
import { dataNotificacao } from "./notificacoes-filter-utils";
import { pegarTexto } from "./notificacoes-data-normalizers";
import type { NotificacaoLocal } from "./notificacoes-models";
import { carregarPerfisNotificacoes } from "./notificacoes-supabase-profile-loader";
import { normalizarNotificacaoSupabase } from "./notificacoes-record-normalizers";
import { extrairSlugObraDeLinkNotificacao } from "./notificacoes-work-fallback-utils";

export async function carregarNotificacoesDiretasSupabase(
  userId: string
): Promise<NotificacaoLocal[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .limit(300);

    if (error || !Array.isArray(data)) {
      return [];
    }
    let notificacoesDataSeguras = data;

    if (!acessoConteudo18Confirmado()) {
      const tiposRelacionadosAObra = new Set([
        "novo-capitulo",
        "comentario-obra",
        "curtida-obra",
        "comentario-capitulo",
        "curtida-capitulo",
        "curtida-comentario-capitulo",
      ]);

      const referenciasNotificacoes = data.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return {
            item,
            obraId: "",
            slug: "",
            tipo: "",
          };
        }

        const registro = item as Record<string, unknown>;
        const metadata =
          registro.metadata &&
          typeof registro.metadata === "object" &&
          !Array.isArray(registro.metadata)
            ? (registro.metadata as Record<string, unknown>)
            : {};
        const obraId = pegarTexto(
          registro.obra_id ??
            registro.obraId ??
            metadata.obra_id ??
            metadata.obraId
        );
        const link = pegarTexto(
          registro.link ??
            registro.href ??
            metadata.link ??
            metadata.href
        );
        const slug = extrairSlugObraDeLinkNotificacao(link);
        const tipo = pegarTexto(registro.tipo ?? metadata.tipo)
          .trim()
          .toLowerCase();

        return {
          item,
          obraId,
          slug,
          tipo,
        };
      });

      const obraIds = Array.from(
        new Set(
          referenciasNotificacoes
            .map((referencia) => referencia.obraId)
            .filter(Boolean)
        )
      );
      const obraSlugs = Array.from(
        new Set(
          referenciasNotificacoes
            .map((referencia) => referencia.slug)
            .filter(Boolean)
        )
      );
      const classificacoesPorId = new Map<string, string>();
      const classificacoesPorSlug = new Map<string, string>();

      if (obraIds.length > 0) {
        try {
          const { data: obrasPorIdData, error: obrasPorIdError } =
            await supabase
              .from("obras")
              .select("id, slug, classificacao_indicativa")
              .in("id", obraIds)
              .limit(obraIds.length);

          if (!obrasPorIdError && Array.isArray(obrasPorIdData)) {
            obrasPorIdData.forEach((obra) => {
              if (!obra || typeof obra !== "object" || Array.isArray(obra)) {
                return;
              }

              const registro = obra as Record<string, unknown>;
              const id = pegarTexto(registro.id);
              const slug = pegarTexto(registro.slug);
              const classificacao = pegarTexto(
                registro.classificacao_indicativa
              );

              if (id && classificacao) {
                classificacoesPorId.set(id, classificacao);
              }

              if (slug && classificacao) {
                classificacoesPorSlug.set(slug, classificacao);
              }
            });
          }
        } catch {
          // Falha fechada: notificacoes de obra sem classificacao confirmada
          // serao descartadas enquanto o acesso 18+ nao estiver liberado.
        }
      }

      if (obraSlugs.length > 0) {
        try {
          const { data: obrasPorSlugData, error: obrasPorSlugError } =
            await supabase
              .from("obras")
              .select("id, slug, classificacao_indicativa")
              .in("slug", obraSlugs)
              .limit(obraSlugs.length);

          if (!obrasPorSlugError && Array.isArray(obrasPorSlugData)) {
            obrasPorSlugData.forEach((obra) => {
              if (!obra || typeof obra !== "object" || Array.isArray(obra)) {
                return;
              }

              const registro = obra as Record<string, unknown>;
              const id = pegarTexto(registro.id);
              const slug = pegarTexto(registro.slug);
              const classificacao = pegarTexto(
                registro.classificacao_indicativa
              );

              if (id && classificacao) {
                classificacoesPorId.set(id, classificacao);
              }

              if (slug && classificacao) {
                classificacoesPorSlug.set(slug, classificacao);
              }
            });
          }
        } catch {
          // Falha fechada: notificacoes de obra sem classificacao confirmada
          // serao descartadas enquanto o acesso 18+ nao estiver liberado.
        }
      }

      notificacoesDataSeguras = referenciasNotificacoes
        .filter((referencia) => {
          const relacionadaAObra =
            Boolean(referencia.obraId || referencia.slug) ||
            tiposRelacionadosAObra.has(referencia.tipo);

          if (!relacionadaAObra) {
            return true;
          }

          const classificacaoIndicativa =
            (referencia.obraId
              ? classificacoesPorId.get(referencia.obraId)
              : "") ||
            (referencia.slug
              ? classificacoesPorSlug.get(referencia.slug)
              : "") ||
            "";

          if (!classificacaoIndicativa) {
            return false;
          }

          return !ehClassificacao18(classificacaoIndicativa);
        })
        .map((referencia) => referencia.item);
    }

    const notificacoesNormalizadas = notificacoesDataSeguras
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        return normalizarNotificacaoSupabase(
          item as Record<string, unknown>,
          index
        );
      })
      .filter(
        (notificacao): notificacao is NotificacaoLocal => Boolean(notificacao)
      );

    const perfis = await carregarPerfisNotificacoes(
      notificacoesNormalizadas
        .map((notificacao) => notificacao.autorId || "")
        .filter(Boolean)
    );

    return notificacoesNormalizadas
      .map((notificacao) => {
        const perfil = notificacao.autorId
          ? perfis.get(notificacao.autorId)
          : null;

        return {
          ...notificacao,
          autorNome:
            notificacao.autorNome || perfil?.nome || "",
          autorAvatar:
            notificacao.autorAvatar || perfil?.avatar || "",
        };
      })
      .sort((a, b) => dataNotificacao(b) - dataNotificacao(a));
  } catch {
    return [];
  }
}
