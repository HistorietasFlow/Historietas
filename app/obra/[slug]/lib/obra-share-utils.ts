export function copiarTextoComFallback(texto: string) {
  const campoTemporario = document.createElement("textarea");

  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);
  campoTemporario.select();

  let copiado = false;

  try {
    copiado = document.execCommand("copy");
  } catch {
    copiado = false;
  }

  document.body.removeChild(campoTemporario);

  return copiado;
}
