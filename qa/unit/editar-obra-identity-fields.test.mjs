import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const fieldsSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraIdentityFields.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("Editar Obra delega somente a apresentação dos campos de identificação", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraIdentityFields \} from "\.\/components\/EditarObraIdentityFields";/,
  );
  assert.match(
    pageSource,
    /<EditarObraIdentityFields[\s\S]*?titulo=\{titulo\}[\s\S]*?autor=\{autor\}[\s\S]*?onTituloChange=\{\(novoTitulo\) => \{[\s\S]*?setTitulo\(novoTitulo\);[\s\S]*?marcarAlteracao\(\);[\s\S]*?\}\}[\s\S]*?onAutorChange=\{\(novoAutor\) => \{[\s\S]*?setAutor\(novoAutor\);[\s\S]*?marcarAlteracao\(\);[\s\S]*?\}\}[\s\S]*?\/\>/,
  );
  assert.doesNotMatch(pageSource, /id="editar-obra-titulo"/);
  assert.doesNotMatch(pageSource, /id="editar-obra-autor"/);
});

test("campos preservam identificadores, textos, hints e callbacks de apresentação", () => {
  for (const trecho of [
    'htmlFor="editar-obra-titulo"',
    "Título da obra",
    'id="editar-obra-titulo"',
    "value={titulo}",
    'placeholder="Digite o título"',
    "Mínimo: 3 letras ou números.",
    'htmlFor="editar-obra-autor"',
    "Autor",
    'id="editar-obra-autor"',
    "value={autor}",
    'placeholder="Nome do autor"',
    "Mínimo: 2 letras ou números.",
    'type="text"',
    "onTituloChange(event.target.value)",
    "onAutorChange(event.target.value)",
  ]) {
    assert.ok(fieldsSource.includes(trecho), trecho);
  }
});

test("campos recebem somente dados e callbacks de apresentação com estilos compartilhados", () => {
  assert.match(fieldsSource, /titulo: string/);
  assert.match(fieldsSource, /autor: string/);
  assert.match(fieldsSource, /onTituloChange: \(titulo: string\) => void/);
  assert.match(fieldsSource, /onAutorChange: \(autor: string\) => void/);
  assert.match(
    fieldsSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?hintStyle,[\s\S]*?inputStyle,[\s\S]*?labelStyle,[\s\S]*?\} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.doesNotMatch(
    fieldsSource,
    /setTitulo|setAutor|marcarAlteracao|useState|useEffect/,
  );
});
