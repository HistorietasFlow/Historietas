import "server-only";
import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";
import type { PayloadStoryAvaliacao } from "../../stories/avaliacao-story-payload";

// Coordenadas medidas no modelo 942×1670. Escala uniforme, sem esticar assets.
export const STORY = { width: 1080, height: 1920, scale: 1080 / 942, offsetY: (1920 - 1670 * (1080 / 942)) / 2 } as const;
export type MidiasStory = { capa: string; leitor: string | null; autor: string | null; wordmark: string;
  legenda: string; por: string; separador: string };
const p = (n: number) => n * STORY.scale;
function box(x: number, y: number, w: number, h: number): CSSProperties {
  return { position: "absolute", left: p(x), top: p(y) + STORY.offsetY, width: p(w), height: p(h), display: "flex" };
}

/** Encaixe conservador; texto nunca sai da caixa nem é cortado por overflow. */
export function tamanhoTextoStory(text: string, max: number, width: number, height: number) {
  const weight = (word: string) => [...word].reduce((sum, c) => sum + (/[MW@ÁÃÔÓ]/.test(c) ? 1 : /[ilI.,']/.test(c) ? 0.3 : 0.64), 0);
  for (let size = max; size >= 16; size--) {
    let lines = 1, line = 0, fits = true;
    for (const word of text.split(/\s+/)) {
      const length = weight(word) * size;
      if (length > width) { fits = false; break; }
      const next = line ? line + 0.32 * size + length : length;
      if (next > width) { lines++; line = length; } else line = next;
    }
    if (fits && lines * size * 1.12 <= height) return size;
  }
  throw new Error("texto_excede_layout");
}

function Foto({ src, x, y, size, radius }: { src: string | null; x: number; y: number; size: number; radius: number }) {
  return <div style={{ ...box(x, y, size, size), borderRadius: p(radius), overflow: "hidden", border: `${p(1.5)}px solid #888`, background: "#000" }}>
    {/* eslint-disable-next-line @next/next/no-img-element -- Raster embutido em ImageResponse, sem rede no render. */}
    {src ? <img src={src} alt="" width={p(size)} height={p(size)} /> : null}
  </div>;
}

export function comporStoryAvaliacao(payload: PayloadStoryAvaliacao, media: MidiasStory, geist: ArrayBuffer) {
  if (!geist?.byteLength) throw new Error("fonte_indisponivel");
  const leitor = payload.leitor.nome.texto, titulo = payload.obra.titulo.texto, autor = payload.autor.nome.texto;
  if (!payload.compartilhavel || !leitor || !titulo || !autor ||
    payload.leitor.nome.truncado || payload.obra.titulo.truncado || payload.autor.nome.truncado ||
    !Number.isInteger(payload.avaliacao.nota * 2) || payload.avaliacao.nota < 0.5 || payload.avaliacao.nota > 5) throw new Error("payload_invalido");
  const title = titulo.toLocaleUpperCase("pt-BR");
  // Não acionar o fallback remoto de fontes/emoji do ImageResponse com nomes.
  if (![leitor, title, autor].every(value => /^[\u0020-\u024f\u0300-\u036f\u2000-\u206f]+$/.test(value))) throw new Error("glifo_indisponivel");
  const handle = payload.autor.mostrarHandle && payload.autor.mostrarSeparador && payload.autor.username ? `@${payload.autor.username}` : null;
  const text = (x: number, y: number, w: number, h: number, value: string, max: number, color = "#fff", center = false) =>
    <div style={{ ...box(x, y, w, h), fontSize: p(tamanhoTextoStory(value, max, w, h)), lineHeight: 1.12,
      color, alignItems: "center", justifyContent: center ? "center" : "flex-start", textAlign: center ? "center" : "left",
      wordBreak: "normal" }}>{value}</div>;
  return new ImageResponse(
    <div style={{ width: STORY.width, height: STORY.height, background: "#000", color: "#fff", display: "flex", position: "relative", fontFamily: "geist", fontWeight: 400 }}>
      <Foto src={media.leitor} x={230} y={118} size={123} radius={22} />
      {text(382, 135, 394, 50, leitor, 44)}
      {/* eslint-disable-next-line @next/next/no-img-element -- Rótulo fixo do modelo aprovado. */}
      <img src={media.legenda} alt="" width={p(314)} height={p(43)} style={box(380,186,314,43)} />
      <div style={{ ...box(193, 296, 554, 768), borderRadius: p(39), border: `${p(1.6)}px solid #969696`, overflow: "hidden", background: "#000" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Bytes validados antes do render. */}
        <img src={media.capa} alt="" width={p(554)} height={p(768)} style={{ objectFit: "contain" }} />
      </div>
      {text(194, 1108, 554, 90, title, 66, "#fff", true)}
      <Foto src={media.autor} x={212} y={1227} size={76} radius={17} />
      {/* eslint-disable-next-line @next/next/no-img-element -- Prefixo fixo do modelo aprovado. */}
      <img src={media.por} alt="" width={p(80)} height={p(60)} style={box(309,1234,80,60)} />
      {text(400, 1227, 335, 76, autor, 44, "#b6b6b6")}
      <div style={{ ...box(213, 1361, 110, 1.5), background: "#626262" }} />
      {[0, 1, 2, 3, 4].map(index => {
        const amount = Math.min(1, Math.max(0, payload.avaliacao.nota - index));
        const star = (color: string) => <svg width={p(31)} height={p(33)} viewBox="0 0 100 100">
          <path d="M50 2 61 36 97 36 68 57 79 91 50 70 21 91 32 57 3 36 39 36Z" fill={color} />
        </svg>;
        // Metade esquerda por recorte local, sem aproximar/arredondar a nota.
        return <div key={index} style={box(350 + index * 54, 1345, 31, 33)}>
          {star(amount === 1 ? "#fff" : "#444")}
          {amount === 0.5 ? <div style={{ position: "absolute", display: "flex", left: 0, top: 0, width: p(15.5), height: p(33), overflow: "hidden" }}>
            {star("#fff")}
          </div> : null}
        </div>;
      })}
      <div style={{ ...box(619, 1361, 110, 1.5), background: "#626262" }} />
      {handle ? text(213, 1410, 516, 50, handle, 35, "#fff", true) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- Símbolo original, removido junto do handle. */}
      {handle ? <img src={media.separador} alt="" width={p(40)} height={p(40)} style={box(451,1464,40,40)} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- Wordmark autorizado, sem redesenho. */}
      <img src={media.wordmark} alt="" width={p(331)} height={p(72)} style={{ ...box(305.5, 1514, 331, 72) }} />
    </div>,
    { width: STORY.width, height: STORY.height, fonts: [{ name: "geist", data: geist, weight: 400, style: "normal" }],
      headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } },
  );
}
