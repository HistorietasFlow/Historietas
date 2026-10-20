import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/seguindo/hooks/use-seguindo-profile-context-state.ts", import.meta.url), "utf8");

test("contexto de perfil social preserva IDs, nome e seus setters", () => {
  assert.match(page, /useSeguindoPageAccessContextState\(\)/);
  assert.match(hook, /const \[perfilSocialId, setPerfilSocialId\] = useState\(""\)/);
  assert.match(hook, /const \[perfilSocialNome, setPerfilSocialNome\] = useState\(""\)/);
  assert.match(hook, /return \{ perfilSocialId, setPerfilSocialId, perfilSocialNome, setPerfilSocialNome \}/);
});
