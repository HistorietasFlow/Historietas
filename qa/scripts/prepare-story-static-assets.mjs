import sharp from "sharp";
import { mkdirSync } from "node:fs";
const input = "qa/references/Historietas_Modelo_Stories_Aprovado.png";
mkdirSync("lib/server/stories/assets",{recursive:true});
// Cópia de pixels dos rótulos fixos aprovados, sem tentar adivinhar sua fonte.
for (const [name,rect] of [
  ["minha-avaliacao",{left:380,top:186,width:314,height:43}],
  ["por",{left:309,top:1234,width:80,height:60}],
  ["separador",{left:451,top:1464,width:40,height:40}],
]) await sharp(input).extract(rect).png().toFile(`lib/server/stories/assets/${name}.png`);
