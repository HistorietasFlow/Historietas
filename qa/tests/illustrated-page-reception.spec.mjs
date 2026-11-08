import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { authorEmail, authorPassword, visitorEmail, visitorPassword, destructiveEnabled } from "./helpers.mjs";

// Endpoint sem UI: exercita HTTP real, Auth, Data API e decoder do build local.
// Nao salvar Bearer JWTs em traces de investigacao/retries.
test.use({ trace: "off" });
test("pré-validação autenticada usa bytes canônicos e mantém todo upload bloqueado", async ({ request, baseURL }) => {
  test.skip(!destructiveEnabled || !process.env.E2E_PUBLIC_WORK_ID, "Exige fixtures descartáveis locais.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  expect(["localhost", "127.0.0.1"]).toContain(new URL(url).hostname);
  expect(["localhost", "127.0.0.1"]).toContain(new URL(baseURL).hostname);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const author = createClient(url, key, options);
  const visitor = createClient(url, key, options);
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
  const login = await author.auth.signInWithPassword({ email: authorEmail, password: authorPassword });
  expect(login.error).toBeNull();
  const guest = await visitor.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword });
  expect(guest.error).toBeNull();
  const chapter = await author.from("capitulos").insert({ obra_id: process.env.E2E_PUBLIC_WORK_ID,
    user_id: login.data.user.id, titulo: "QA recepção sem upload", texto: "Texto preservado",
    ordem: 98765, publicado: false }).select("id").single();
  expect(chapter.error).toBeNull();
  const id = chapter.data.id;
  const endpoint = "/api/capitulos-ilustrados/prevalidar-pagina";
  const send = (reserva, data, token = login.data.session.access_token, extra = {}) => request.post(endpoint, {
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/octet-stream",
      "x-reserva-id": reserva, "x-capitulo-id": id, "x-versao-esperada": "0", ...extra }, data,
  });
  try {
    const unauthenticated = await request.post(endpoint, { data: Buffer.from("não ler") });
    expect(unauthenticated.status()).toBe(401);
    for (const [format, mime] of [["png", "image/png"], ["jpeg", "image/jpeg"], ["webp", "image/webp"]]) {
      const result = await author.rpc("reservar_pagina_capitulo", { p_capitulo_id: id, p_versao_esperada: 0,
        p_chave_requisicao: randomUUID(), p_mime_type: mime });
      expect(result.error).toBeNull();
      const reservation = result.data.reservaId;
      const source = await sharp({ create: { width: 12, height: 18, channels: 3, background: "#123456" } })
        .withMetadata({ exif: { IFD0: { ImageDescription: "Metadado privado QA" } } }).toFormat(format).toBuffer();
      const response = await send(reservation, source);
      const body = await response.json();
      expect(response.status(), JSON.stringify(body)).toBe(200);
      expect(response.headers()["cache-control"]).toBe("no-store");
      expect(body).toMatchObject({ estado: "validado_sem_upload", uploadHabilitado: false,
        mimeType: mime, largura: 12, altura: 18 });
      expect(body.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(body.sha256).not.toBe(createHash("sha256").update(source).digest("hex"));
      expect(body).not.toHaveProperty("storage_path");
      expect(await (await send(reservation, source)).json()).toEqual(body); // Retry nao grava nada.
      expect((await send(reservation, source, guest.data.session.access_token)).status()).toBe(403);
      expect((await send(reservation, source, login.data.session.access_token, { "x-versao-esperada": "1" })).status()).toBe(409);
      expect((await send(reservation, Buffer.from("<svg></svg>"))).status()).toBe(422);
      expect((await send(reservation, Buffer.alloc(2097153))).status()).toBe(413);
      const ext = format === "jpeg" ? "jpg" : format;
      const path = `${login.data.user.id}/capitulos/${id}/${reservation}.${ext}`;
      const forbidden = await author.storage.from("arquivos-obras").upload(path, source, { contentType: mime });
      expect(String(forbidden.error?.statusCode)).toBe("403");
      expect((await author.rpc("liberar_reserva_pagina_capitulo", { p_reserva_id: reservation })).error).toBeNull();
      expect((await send(reservation, source)).status()).toBe(410);
    }
    const list = await admin.storage.from("arquivos-obras").list(`${login.data.user.id}/capitulos/${id}`);
    expect(list.error).toBeNull();
    expect(list.data).toEqual([]);
    const preserved = await author.from("capitulos").select("tipo_conteudo,versao_paginas,texto").eq("id", id).single();
    expect(preserved.data).toEqual({ tipo_conteudo: "texto", versao_paginas: 0, texto: "Texto preservado" });
  } finally {
    expect((await author.from("capitulos").delete().eq("id", id)).error).toBeNull();
    await author.auth.signOut({ scope: "local" });
    await visitor.auth.signOut({ scope: "local" });
  }
});
