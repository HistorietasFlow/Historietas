export const explorarBuscaToggleCss = `
  button[aria-label="Abrir busca"],
  button[aria-label="Fechar busca"],
  button[aria-label="Abrir busca"]:hover,
  button[aria-label="Fechar busca"]:hover,
  button[aria-label="Abrir busca"]:active,
  button[aria-label="Fechar busca"]:active,
  button[aria-label="Abrir busca"]:focus,
  button[aria-label="Fechar busca"]:focus,
  button[aria-label="Abrir busca"]:focus-visible,
  button[aria-label="Fechar busca"]:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  input[placeholder="Buscar histórias..."],
  input[placeholder="Buscar histórias..."]:hover,
  input[placeholder="Buscar histórias..."]:focus,
  input[placeholder="Buscar histórias..."]:focus-visible,
  input[placeholder="Buscar autores..."],
  input[placeholder="Buscar autores..."]:hover,
  input[placeholder="Buscar autores..."]:focus,
  input[placeholder="Buscar autores..."]:focus-visible {
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
  }
`;
