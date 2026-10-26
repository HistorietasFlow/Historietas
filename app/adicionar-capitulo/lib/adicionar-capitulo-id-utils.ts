export function gerarUuidFallbackAdicionarCapitulo() {
  const bytes = new Uint8Array(16);
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.getRandomValues === "function") {
    cryptoGlobal.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hexadecimal = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  );

  return `${hexadecimal[0]}${hexadecimal[1]}${hexadecimal[2]}${hexadecimal[3]}-${hexadecimal[4]}${hexadecimal[5]}-${hexadecimal[6]}${hexadecimal[7]}-${hexadecimal[8]}${hexadecimal[9]}-${hexadecimal[10]}${hexadecimal[11]}${hexadecimal[12]}${hexadecimal[13]}${hexadecimal[14]}${hexadecimal[15]}`;
}

export function criarId() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return gerarUuidFallbackAdicionarCapitulo();
}
