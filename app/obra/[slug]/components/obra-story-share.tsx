"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../../../components/HistorietasLanguageProvider";
import { supabase } from "../../../../lib/supabase/client";
import { storyShareTranslations } from "../lib/story-share-translations";
import { manterFocoNoDialogo } from "../lib/obra-dialog-focus";

export default function ObraStoryShare({ slug, leitorId, nota }: { slug: string; leitorId: string; nota: number }) {
  const { language } = useHistorietasLanguage();
  const t = storyShareTranslations[language];
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = useRef(true);
  const sequence = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const image = useRef<{ url: string; file: File } | null>(null);
  const [eligible, setEligible] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<keyof typeof t | null>(null);
  const [sharing, setSharing] = useState(false);

  function discard() {
    sequence.current++;
    pending.current?.abort();
    if (image.current) URL.revokeObjectURL(image.current.url);
    image.current = null;
  }
  function close() {
    discard();
    dialog.current?.close();
    setUrl(""); setState("idle"); setMessage(null);
    trigger.current?.focus();
  }

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    void fetch("/api/story-avaliacao", { method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ slug, leitorId, acao: "confirmar" }),
    }).then(async response => {
      const result = await response.json();
      if (active.current && !controller.signal.aborted) setEligible(response.ok && result.disponivel === true && result.nota === nota);
    }).catch(() => { /* Falha nunca certifica avaliação local/otimista. */ });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session && session.user.id !== leitorId)) {
        active.current = false; controller.abort(); discard();
        dialog.current?.close(); setEligible(false); setUrl(""); setState("idle");
      }
    });
    const element = dialog.current;
    return () => { active.current = false; controller.abort(); discard(); element?.close(); data.subscription.unsubscribe(); };
  }, [slug, leitorId, nota]);

  async function generate() {
    if (!active.current || !eligible) return;
    discard();
    const version = sequence.current;
    const controller = new AbortController(); pending.current = controller;
    setUrl(""); setMessage(null); setState("loading");
    dialog.current?.showModal();
    try {
      const response = await fetch("/api/story-avaliacao", { method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ slug, leitorId, acao: "gerar" }) });
      if (!response.ok || response.headers.get("content-type") !== "image/png") throw new Error("indisponivel");
      const blob = await response.blob();
      if (!active.current || sequence.current !== version) return;
      const file = new File([blob], "historietas-avaliacao.png", { type: "image/png" });
      const nextUrl = URL.createObjectURL(file);
      image.current = { url: nextUrl, file }; setUrl(nextUrl); setState("ready");
    } catch {
      if (active.current && sequence.current === version && !controller.signal.aborted) setState("error");
    }
  }
  function download() {
    if (!active.current || !image.current) return;
    const link = document.createElement("a"); link.href = image.current.url;
    link.download = "historietas-avaliacao.png"; document.body.append(link); link.click(); link.remove();
    setMessage("downloaded");
  }
  async function share() {
    if (!active.current || !image.current || sharing) return;
    const version = sequence.current;
    try {
      const files = [image.current.file];
      if (!navigator.share || !navigator.canShare?.({ files })) { download(); setMessage("fallback"); return; }
      setSharing(true);
      // Invocado no gesto do usuário, sem await de rede que perca a ativação nativa.
      await navigator.share({ files });
      if (active.current && version === sequence.current) setMessage("sent");
    } catch (error) {
      if (!active.current || version !== sequence.current) return;
      if (error instanceof DOMException && error.name === "AbortError") setMessage("cancelled");
      else { download(); setMessage("fallback"); }
    } finally { setSharing(false); }
  }

  return <div className="story-share">
    {eligible && <button ref={trigger} type="button" onClick={() => void generate()}>{t.open}</button>}
    <dialog ref={dialog} aria-labelledby={titleId} onKeyDown={event => manterFocoNoDialogo(event, close)} onCancel={event => { event.preventDefault(); close(); }}>
      <div className="story-share-heading"><h2 id={titleId}>{t.title}</h2><button type="button" onClick={close} autoFocus>{t.close}</button></div>
      <div aria-live="polite" role="status">{state === "loading" ? t.loading : message ? t[message] : ""}</div>
      {state === "error" && <div role="alert"><p>{t.error}</p><button type="button" onClick={() => void generate()}>{t.retry}</button></div>}
      {state === "ready" && url && <>
        {/* eslint-disable-next-line @next/next/no-img-element -- Prévia dos mesmos bytes PNG do download. */}
        <img className="story-share-preview" src={url} alt={t.preview} width={1080} height={1920} onError={() => { discard(); setUrl(""); setState("error"); }} />
        <div className="story-share-actions"><button type="button" onClick={download}>{t.download}</button><button type="button" onClick={() => void share()} disabled={sharing}>{t.share}</button></div>
      </>}
    </dialog>
    <style jsx>{`
      .story-share { margin-top: 12px; }
      button { min-height: 44px; border: 1px solid #777; border-radius: 10px; background: #18181b; color: #fff; padding: 10px 16px; cursor: pointer; font: inherit; }
      button:focus-visible { outline: 3px solid #c4b5fd; outline-offset: 3px; }
      button:disabled { opacity: .6; cursor: wait; }
      dialog { color: #fff; background: #101014; border: 1px solid #777; border-radius: 16px; padding: 20px; width: min(520px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); box-sizing: border-box; overflow-y: auto; }
      dialog::backdrop { background: #000b; }
      .story-share-heading, .story-share-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      h2 { font-size: 20px; margin: 0; }
      .story-share-preview { display: block; width: auto; max-width: 100%; height: auto; max-height: 62dvh; margin: 16px auto; object-fit: contain; }
      [role=status]:not(:empty) { margin: 12px 0; }
    `}</style>
  </div>;
}
