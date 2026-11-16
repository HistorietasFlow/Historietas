import "server-only";
import sharp from "sharp";
import { imagemPublicaStory } from "../../stories/avaliacao-story-payload";

/** Não encaminhar cookies/Authorization, seguir redirects, aceitar SVG ou baixar sem limite. */
export async function carregarMidiaStory(value: string | null, bucket: "avatars" | "capas-obras") {
  const url = imagemPublicaStory(value, process.env.NEXT_PUBLIC_SUPABASE_URL || "", bucket);
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { cache: "no-store", credentials: "omit", redirect: "error", signal: controller.signal });
      if (!response.ok || !response.body || !/^image\/(?:png|jpeg|webp)(?:;|$)/i.test(response.headers.get("content-type") || "") ||
        Number(response.headers.get("content-length") || 0) > 5 * 1024 * 1024) {
        await response.body?.cancel();
        return null;
      }
      const reader = response.body.getReader(), chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          length += result.value.length;
          if (length > 5 * 1024 * 1024) { controller.abort(); return null; }
          chunks.push(result.value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      const input = Buffer.concat(chunks);
      const meta = await sharp(input, { limitInputPixels: 20_000_000 }).metadata();
      if (!meta.format || !["png", "jpeg", "webp"].includes(meta.format) || (meta.pages || 1) !== 1) return null;
      const cover = bucket === "capas-obras";
      return `data:image/png;base64,${(await sharp(input, { limitInputPixels: 20_000_000 }).rotate()
        .resize(cover ? 636 : 160, cover ? 882 : 160, { fit: cover ? "contain" : "cover", background: "#000" }).png().toBuffer()).toString("base64")}`;
    } finally { clearTimeout(timer); }
  } catch { return null; }
}
