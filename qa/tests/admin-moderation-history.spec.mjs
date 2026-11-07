import { expect, test } from "@playwright/test";
import {
  hasModeratorCredentials,
  hasVisitorCredentials,
  loginAsModerator,
  loginAsVisitor,
  monitorRuntime,
} from "./helpers.mjs";

test.describe("histórico administrativo de moderação", () => {
  test.skip(
    !hasModeratorCredentials,
    "Credenciais locais do moderador E2E não configuradas.",
  );

  test("exibe decisões e responsáveis somente no painel restrito", async ({
    page,
  }) => {
    await loginAsModerator(page);
    const runtime = monitorRuntime(page);
    await page.goto("/admin/comunidade", { waitUntil: "domcontentloaded" });

    const abrirHistorico = page.getByRole("button", {
      name: "Ver histórico de moderação",
    });
    await expect(abrirHistorico).toBeVisible();
    await abrirHistorico.click();

    const historico = page.getByLabel("Histórico de moderação");
    await expect(historico.getByText("Decisões e responsáveis")).toBeVisible();
    await expect(historico.getByText("Status alterado").first()).toBeVisible();
    await expect(historico.getByText("Moderador E2E").first()).toBeVisible();
    await expect(
      historico.getByText("Análise E2E registrada internamente.").first(),
    ).toBeVisible();
    await expect(historico.getByText(/Pendente → Em análise/).first()).toBeVisible();

    runtime.assertClean();
  });

  test("não expõe o histórico para usuário autenticado sem papel administrativo", async ({
    page,
  }) => {
    test.skip(
      !hasVisitorCredentials,
      "Credenciais locais do visitante E2E não configuradas.",
    );

    await loginAsVisitor(page);
    await page.goto("/admin/comunidade", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Acesso negado", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ver histórico de moderação" }),
    ).toHaveCount(0);
  });
});
