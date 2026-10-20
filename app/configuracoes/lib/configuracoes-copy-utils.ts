export async function copiarTextoConfiguracoes(texto: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return;
    } catch {
      // Em alguns navegadores o Clipboard API existe, mas é bloqueado.
    }
  }

  const campoTemporario = document.createElement("textarea");

  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);

  try {
    campoTemporario.select();

    if (!document.execCommand("copy")) {
      throw new Error("Não foi possível copiar os dados.");
    }
  } finally {
    campoTemporario.remove();
  }
}
