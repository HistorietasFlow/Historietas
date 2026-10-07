import { useEffect, useState } from "react";

export function useObraCommentsNow(comentariosAbertos: boolean) {
  const [agoraComentarios, setAgoraComentarios] = useState(() => Date.now());

  useEffect(() => {
    if (!comentariosAbertos) {
      return;
    }

    const inicioRelogioComentarios = window.setTimeout(() => {
      setAgoraComentarios(Date.now());
    }, 0);

    const relogioComentarios = window.setInterval(() => {
      setAgoraComentarios(Date.now());
    }, 1000);

    return () => {
      window.clearTimeout(inicioRelogioComentarios);
      window.clearInterval(relogioComentarios);
    };
  }, [comentariosAbertos]);

  return agoraComentarios;
}
