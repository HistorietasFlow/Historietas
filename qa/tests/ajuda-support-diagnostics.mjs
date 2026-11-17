import { SAFE_FLOW_MARKER, sanitizeSafeFlowDiagnostic } from "../scripts/playwright-safe-flow-schema.mjs";

export const supportTitle = page => page.getByLabel("Título do problema", { exact: false });

export function readSupportFormCounts(page) {
  // One DOM read keeps totals and visibility from different renders from mixing.
  const elements = page.locator("#problema-tecnico form").or(supportTitle(page));
  return elements.evaluateAll(nodes => {
    const counts = { forms: 0, visibleForms: 0, titles: 0, visibleTitles: 0 };
    for (const node of nodes) {
      const { width, height } = node.getBoundingClientRect();
      const visible = width > 0 && height > 0 && node.checkVisibility({ visibilityProperty: true });
      if (node.tagName === "FORM") {
        counts.forms++;
        if (visible) counts.visibleForms++;
      } else {
        counts.titles++;
        if (visible) counts.visibleTitles++;
      }
    }
    return counts;
  });
}

export async function reportSupportFormFailure(page, device) {
  let counts = null;
  try { counts = await readSupportFormCounts(page); } catch { /* Page already closed. */ }
  const diagnostic = sanitizeSafeFlowDiagnostic({ scenario: "ajuda-support-form", device, counts });
  if (diagnostic) process.stdout.write(`${SAFE_FLOW_MARKER}${JSON.stringify(diagnostic)}\n`);
}
