import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const mobile of [false, true]) {
  test(`Explorar carrega capítulos sem aguardar perfis: ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    let release, profileStarted;
    const held = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { profileStarted = resolve; });
    let catalog = 0;
    page.on('request', request => {
      if (new URL(request.url()).pathname.endsWith('/rpc/listar_obras_catalogo')) catalog++;
    });
    await page.route('**/rest/v1/profiles_publicos?*', async request => {
      profileStarted();
      await held;
      await request.continue();
    });
    const chapters = page.waitForRequest(request => new URL(request.url()).pathname === '/rest/v1/capitulos');
    try {
      await page.goto('/explorar', { waitUntil: 'domcontentloaded' });
      // A implementação serial não inicia capítulos enquanto o perfil está retido.
      await Promise.all([started, chapters]);
      await expect(page.locator('main a[href^="/obra/"]')).toHaveCount(0);
      release();
      const content = page.locator('main:has(a[href^="/obra/"])');
      await expect(content).toBeVisible();
      expect(catalog).toBe(6);
    } finally {
      release();
    }
  });

  test(`Explorar mantém acessibilidade após leituras paralelas: ${mobile ? 'mobile' : 'desktop'}`, async ({ page }) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.goto('/explorar', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main:has(a[href^="/obra/"])')).toBeVisible();
    const axe = await new AxeBuilder({ page }).include('main:has(a[href^="/obra/"])')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id)).toEqual([]);
  });
}
