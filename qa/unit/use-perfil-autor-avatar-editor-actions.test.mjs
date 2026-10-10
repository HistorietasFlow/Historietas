import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-avatar-editor-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  mime = "image/png",
  maxSize = 1_048_576,
  resultadoLeitura = "data:image/png;base64,abc",
  falharLeitura = false,
} = {}) {
  const chamadas = [];
  globalThis.__profileAvatarEditorDependencies = {
    maxSize,
    obterTipoMimeUploadStorage(categoria, arquivo) {
      chamadas.push(["mime", categoria, arquivo.name]);
      return mime;
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { obterTipoMimeUploadStorage } from "../../../lib/storageUploads";',
        "const obterTipoMimeUploadStorage = globalThis.__profileAvatarEditorDependencies.obterTipoMimeUploadStorage;",
      )
      .replace(
        'import { AVATAR_MAX_SIZE } from "../constants";',
        "const AVATAR_MAX_SIZE = globalThis.__profileAvatarEditorDependencies.maxSize;",
      )
      .replace(/import type \{ ChangeEvent, RefObject \} from "react";\n/,""),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const FileReaderOriginal = globalThis.FileReader;
  class FileReaderMock {
    result = null;
    onload = null;
    onerror = null;

    readAsDataURL(arquivo) {
      chamadas.push(["readAsDataURL", arquivo.name]);
      if (falharLeitura) {
        this.onerror?.();
        return;
      }
      this.result = resultadoLeitura;
      this.onload?.();
    }
  }
  globalThis.FileReader = FileReaderMock;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return {
    ...modulo,
    chamadas,
    restaurar() {
      if (FileReaderOriginal === undefined) {
        delete globalThis.FileReader;
      } else {
        globalThis.FileReader = FileReaderOriginal;
      }
    },
  };
}

function criarAcoes(modulo, input = { current: { value: "selecionado" } }) {
  const estados = [];
  return {
    ...modulo.usePerfilAutorAvatarEditorActions({
      avatarInputRef: input,
      setAvatarErro(valor) {
        estados.push(["erro", valor]);
      },
      setAvatarPerfilEditor(valor) {
        estados.push(["avatar", valor]);
      },
      setAvatarNomePerfilEditor(valor) {
        estados.push(["nome", valor]);
      },
      setAvatarArquivoPerfilEditor(valor) {
        estados.push(["arquivo", valor]);
      },
    }),
    estados,
    input,
  };
}

function criarEvento(arquivo) {
  return {
    target: {
      files: arquivo ? [arquivo] : [],
      value: "arquivo.png",
    },
  };
}

test("rejeita tipo inválido e limpa o input", async () => {
  const modulo = await carregarModulo({ mime: "" });
  try {
    const acoes = criarAcoes(modulo);
    const evento = criarEvento({ name: "avatar.svg", size: 100 });

    acoes.selecionarAvatarAutor(evento);

    assert.equal(evento.target.value, "");
    assert.deepEqual(acoes.estados, [
      ["erro", ""],
      ["erro", "Escolha PNG, JPG, WEBP ou GIF."],
    ]);
    assert.deepEqual(modulo.chamadas, [["mime", "avatars", "avatar.svg"]]);
  } finally {
    modulo.restaurar();
  }
});

test("rejeita arquivo maior que 1 MB antes de ler", async () => {
  const modulo = await carregarModulo({ maxSize: 1000 });
  try {
    const acoes = criarAcoes(modulo);
    const evento = criarEvento({ name: "avatar.png", size: 1001 });

    acoes.selecionarAvatarAutor(evento);

    assert.equal(evento.target.value, "");
    assert.deepEqual(acoes.estados, [
      ["erro", ""],
      ["erro", "A imagem precisa ter no máximo 1 MB."],
    ]);
    assert.equal(
      modulo.chamadas.some((chamada) => chamada[0] === "readAsDataURL"),
      false,
    );
  } finally {
    modulo.restaurar();
  }
});

test("carrega preview, nome e arquivo quando a imagem é válida", async () => {
  const modulo = await carregarModulo();
  try {
    const arquivo = { name: "avatar.png", size: 500 };
    const acoes = criarAcoes(modulo);

    acoes.selecionarAvatarAutor(criarEvento(arquivo));

    assert.deepEqual(acoes.estados, [
      ["erro", ""],
      ["avatar", "data:image/png;base64,abc"],
      ["nome", "avatar.png"],
      ["arquivo", arquivo],
      ["erro", ""],
    ]);
    assert.deepEqual(modulo.chamadas, [
      ["mime", "avatars", "avatar.png"],
      ["readAsDataURL", "avatar.png"],
    ]);
  } finally {
    modulo.restaurar();
  }
});

test("preserva mensagem de erro quando FileReader falha", async () => {
  const modulo = await carregarModulo({ falharLeitura: true });
  try {
    const acoes = criarAcoes(modulo);

    acoes.selecionarAvatarAutor(
      criarEvento({ name: "avatar.png", size: 500 }),
    );

    assert.deepEqual(acoes.estados, [
      ["erro", ""],
      ["erro", "Não consegui carregar essa imagem."],
    ]);
  } finally {
    modulo.restaurar();
  }
});

test("remover avatar limpa estados e input", async () => {
  const modulo = await carregarModulo();
  try {
    const acoes = criarAcoes(modulo);

    acoes.removerAvatarAutor();

    assert.deepEqual(acoes.estados, [
      ["avatar", ""],
      ["nome", ""],
      ["arquivo", null],
      ["erro", ""],
    ]);
    assert.equal(acoes.input.current.value, "");
  } finally {
    modulo.restaurar();
  }
});

test("Perfil de Autor delega as ações do editor de avatar para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorAvatarEditorActions \} from "\.\/hooks\/use-perfil-autor-avatar-editor-actions";/,
  );
  assert.match(
    pagina,
    /const \{ selecionarAvatarAutor, removerAvatarAutor \} =[\s\S]*?usePerfilAutorAvatarEditorActions\(\{/,
  );
  assert.doesNotMatch(pagina, /function selecionarAvatarAutor\(/);
  assert.doesNotMatch(pagina, /function removerAvatarAutor\(/);
  assert.doesNotMatch(pagina, /AVATAR_MAX_SIZE/);
  assert.doesNotMatch(pagina, /obterTipoMimeUploadStorage/);
  assert.match(source, /new FileReader\(\)/);
  assert.match(source, /obterTipoMimeUploadStorage\("avatars", arquivo\)/);
});
