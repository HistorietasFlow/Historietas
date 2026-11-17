"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import { normalizarHistoriasEmComum } from "../lib/profile-common-stories-data.mjs";

type HistoriaEmComum = ReturnType<typeof normalizarHistoriasEmComum>[number];

type Props = {
  usuarioLogadoId: string;
  usuarioVisitadoId: string;
  language: HistorietasLanguage;
  isDesktop: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const textos: Record<HistorietasLanguage, { titulo: string; descricao: string; capa: string }> = {
  "pt-BR": {
    titulo: "Histórias em comum",
    descricao: "Obras que vocês dois marcaram como favoritas publicamente.",
    capa: "Capa de",
  },
  en: {
    titulo: "Stories in common",
    descricao: "Stories you both publicly added to your favorites.",
    capa: "Cover of",
  },
  es: {
    titulo: "Historias en común",
    descricao: "Obras que ambos marcaron públicamente como favoritas.",
    capa: "Portada de",
  },
};

export function ProfileCommonStoriesSection({
  usuarioLogadoId,
  usuarioVisitadoId,
  language,
  isDesktop,
}: Props) {
  const [itens, setItens] = useState<HistoriaEmComum[]>([]);
  const valido = UUID.test(usuarioLogadoId) && UUID.test(usuarioVisitadoId)
    && usuarioLogadoId.toLowerCase() !== usuarioVisitadoId.toLowerCase();

  useEffect(() => {
    if (!valido) return;
    let ativo = true;
    let requisicao = 0;

    async function carregar() {
      const atual = ++requisicao;
      // Em refoco, retire imediatamente dados antigos antes de revalidar privacidade.
      setItens([]);
      try {
        const { data, error } = await supabase.rpc("listar_historias_em_comum", {
          p_outro_usuario: usuarioVisitadoId,
          p_apos_obra: null,
          p_limite: 12,
        });
        if (!ativo || requisicao !== atual) return;
        if (error) return;
        setItens(normalizarHistoriasEmComum(data));
      } catch {
        // Falhas de rede ou autorização nunca revelam dados anteriores.
      }
    }

    function revalidar() {
      if (document.visibilityState === "visible") void carregar();
    }

    void carregar();
    window.addEventListener("focus", revalidar);
    document.addEventListener("visibilitychange", revalidar);

    return () => {
      ativo = false;
      requisicao += 1;
      window.removeEventListener("focus", revalidar);
      document.removeEventListener("visibilitychange", revalidar);
    };
  }, [usuarioLogadoId, usuarioVisitadoId, valido]);

  if (!valido || itens.length === 0) return null;
  const texto = textos[language] ?? textos["pt-BR"];

  return (
    <section
      aria-label={texto.titulo}
      style={{
        borderRadius: 20,
        border: "1px solid var(--historietas-perfil-border, rgba(255,255,255,0.13))",
        background: "var(--historietas-perfil-bg-card, rgba(255,255,255,0.04))",
        padding: isDesktop ? "20px 22px" : "16px",
        margin: "18px 0",
        minWidth: 0,
      }}
    >
      <h2 style={{ color: "var(--historietas-perfil-text, #fff)", fontSize: 19,
        fontWeight: 750, lineHeight: 1.3, margin: 0 }}>
        {texto.titulo}
      </h2>
      <p style={{ color: "var(--historietas-perfil-text-muted, #a1a1aa)",
        fontSize: 13, margin: "5px 0 17px" }}>
        {texto.descricao}
      </p>
      <div style={{ display: "grid", gap: isDesktop ? 16 : 12,
        gridTemplateColumns: isDesktop ? "repeat(3, minmax(0,1fr))" : "repeat(2, minmax(0,1fr))" }}>
        {itens.map((item) => (
          <Link key={item.id} href={item.href}
            style={{ display: "flex", flexDirection: "column", gap: 7,
              minWidth: 0, color: "inherit", textDecoration: "none" }}>
            <div
              aria-label={`${texto.capa} ${item.titulo}`}
              role="img"
              style={{
                width: "100%", aspectRatio: "4 / 5", borderRadius: 12,
                background: "var(--historietas-perfil-bg-page, #18181b)",
                backgroundImage: item.capa ? `url(${JSON.stringify(item.capa)})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
              }}
            />
            <strong data-historietas-user-content="true" style={{
              fontSize: 13, fontWeight: 700,
              color: "var(--historietas-perfil-text, #fff)",
              lineHeight: 1.35, overflowWrap: "anywhere",
            }}>{item.titulo}</strong>
            {item.autor && (
              <span data-historietas-user-content="true" style={{
                fontSize: 12, color: "var(--historietas-perfil-text-muted, #a1a1aa)",
                lineHeight: 1.3, overflowWrap: "anywhere",
              }}>{item.autor}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
