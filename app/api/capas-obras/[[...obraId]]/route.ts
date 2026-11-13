import "server-only";
import { criarEntregaPrivadaCapa } from "../../../../lib/server/capas/entrega-privada";
import { autenticarUsuarioCapa } from "../../../../lib/server/capas/autenticar-usuario";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Catch-all opcional: erros de caminho também passam pela resposta no-store,
// em vez do 404 estático do framework com ETag.
const entregar = criarEntregaPrivadaCapa({
  disponivel: () => false,
  autenticar: autenticarUsuarioCapa,
  async autorizar() {
    // PR 1 ainda em desenvolvimento. Não inventar RPC, campos ou bucket.
    // Mesmo mudar apenas o gate não fornece um adaptador que entregue bytes.
    throw new Error("dependencias_transacionais_nao_validadas");
  },
});

export { entregar as GET, entregar as HEAD, entregar as POST, entregar as PUT,
  entregar as PATCH, entregar as DELETE, entregar as OPTIONS };
