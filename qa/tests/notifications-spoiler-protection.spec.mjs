import { test, expect } from "@playwright/test";
import {
  hasAuthorCredentials,
  loginAsAuthor,
  monitorRuntime,
} from "./helpers.mjs";

test("notificacoes nao indexam o texto potencialmente sensivel de comentarios", async ({
  page,
}) => {
  test.skip(!hasAuthorCredentials, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD.");
  await loginAsAuthor(page);
  const runtime = monitorRuntime(page);

  await page.goto("/notificacoes", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();
  const notificacoesDoComentario = page.getByRole("heading", {
    name: "Novo comentário na Comunidade",
    exact: true,
  });
  await expect.poll(() => notificacoesDoComentario.count()).toBeGreaterThan(0);

  await page
    .getByRole("textbox", { name: "Buscar notificações..." })
    .fill("Comentário E2E disponível para denúncia");

  await expect(page.getByText("Nada encontrado", { exact: true })).toBeVisible();
  await expect(notificacoesDoComentario).toHaveCount(0);
  runtime.assertClean();
});
