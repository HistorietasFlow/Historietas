type ObraComCapitulosPainel = {
  capitulos: Array<{
    curtiu: boolean;
    salvo: boolean;
    comentario: string;
  }>;
};

export function calcularCurtidas(obra: ObraComCapitulosPainel) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

export function calcularComentarios(obra: ObraComCapitulosPainel) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

export function calcularSalvos(obra: ObraComCapitulosPainel) {
  return obra.capitulos.filter((capitulo) => capitulo.salvo).length;
}
