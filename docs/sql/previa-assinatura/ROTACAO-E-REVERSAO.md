# Operação da chave da prévia

Este procedimento serve à revisão e ao ensaio descartável. A aplicação da migration, a configuração de credenciais, o deployment e a ativação são decisões distintas.

## Preparar a chave e o ambiente

1. Para cada ambiente, gere um segredo dedicado de 32 bytes aleatórios e represente-o por 64 caracteres hexadecimais minúsculos. Entregue o mesmo valor ao Vault daquele projeto e ao servidor daquele ambiente da Vercel por um canal de administração de segredos. Prefira campos de segredo. Exclua o valor de histórico de shell, comandos SQL em texto aberto, logs, traces, repositório e variáveis `NEXT_PUBLIC_`. O UUID da entrada do Vault pode ser usado no procedimento abaixo.
2. No Vault, use o nome `historietas_previa_v1_<versao>`. A versão aceita de 1 a 64 letras ASCII, números ou hífens. Crie uma entrada nova para cada rotação, com novo UUID. No servidor da Vercel use uma variável do tipo Secret exclusiva da aplicação e deste ambiente. Alterações de variáveis valem para um novo deployment. Mantenha a chave e os dois cabeçalhos da prova fora dos logs do servidor e dos registros de requisição.
3. Confira no projeto-alvo se o Vault real existe, se `pgcrypto` fornece `extensions.hmac`, se os schemas `vault`, `previa_assinatura` e `previa_interno` estão fora dos schemas expostos da Data API e se a aplicação consegue usar a identidade do visitante e o JWT do leitor. O ensaio local verifica as ACLs da instalação. Na revisão do ambiente, confira também funções ou permissões extras que exponham o Vault. A rota não utiliza `service_role`.
4. A instalação por si só não exige ativar ou instalar Vault. Antes de habilitar, confirme o novo deployment, a proteção Vercel do site, a correspondência de ambiente e a versão do segredo por identificadores administrativos. O primeiro teste funcional após a habilitação deve conferir a obra de teste pública, a restrita e a indisponibilidade para um leitor bloqueado.

## Troca planejada com pausa breve

1. Prepare B no Vault e no próximo deployment. Mantenha apenas A autorizada no banco até iniciar a pausa.
2. Execute `pausar.sql` sob autorização específica e aguarde o commit. Ele remove a referência ativa e as permissões da entrada da prévia. Uma chamada nova fica sem texto, mesmo se tiver sido assinada antes do commit. Uma consulta que já estava autorizada no PostgreSQL pode terminar e entregar o trecho.
3. Direcione a aplicação ao deployment com B. Enquanto o banco está pausado, nenhuma das chaves habilita a entrega. Depois de confirmar o deployment, execute `habilitar-referencia.sql` com o UUID de B e confirme o commit. O script recusa substituir uma referência ativa e concede somente os acessos de execução necessários. Nenhum dos scripts concede leitura do Vault ou de `auth.sessions` aos leitores.
4. Confira se B atende um leitor autorizado e preserva a privacidade da obra, e se a instância A continua recusada. Se a verificação falhar, pause a prévia e mantenha-a pausada durante o diagnóstico. Retire A dos ambientes antigos e descarte sua entrada desativada do Vault pelo procedimento administrativo aprovado. Não reutilize A para outro ambiente.

Os scripts de operação e reversão serializam as mudanças administrativas entre si. Um timeout aborta a transação. Confirme o estado pelo UUID da referência e pelas permissões antes de repetir uma operação.

## Revogar em emergência

Pause imediatamente no banco e confirme o commit, sem aguardar deployment ou expiração da prova. Retire a credencial comprometida do Vault e da Vercel em seguida. O corte afeta novas decisões de leitura; conteúdo já entregue ou já autorizado pode chegar ao leitor. Para retomar, use outra chave e outro UUID. O log operacional deve registrar versão, horário, responsável e resultado, sem assinatura, segredo, JWT ou trecho.

## Voltar a aplicação ou reverter a migration

- Se a aplicação voltar ao deployment de A depois de B ter sido autorizada, mantenha A revogada. Para recuperar a disponibilidade, volte a um deployment compatível com B ou pause e provisione C.
- Para reverter os objetos desta proposta, pause o recurso e confirme que os consumidores deixaram de usá-lo. Execute `reverter.sql` como `postgres`. O script recusa uma referência ativa ou grants de execução a leitores e utiliza `RESTRICT`. Se houver dependência inesperada, a transação inteira falha. Identifique o consumidor antes de repetir.
- A reversão remove somente a RPC, a auxiliar, a tabela de referência e o novo schema. Preserva as funções de #2363, os dados de leitura e o conteúdo do Vault. A remoção administrativa de cada segredo tem autorização própria. Se futuramente a migration já constar do histórico remoto, registre a reversão pelo processo versionado do projeto para manter banco e histórico coerentes.

Fontes oficiais: [Supabase Vault](https://supabase.com/docs/guides/database/vault), [Vercel Secrets](https://vercel.com/docs/environment-variables/sensitive-environment-variables), [mudanças por deployment](https://vercel.com/docs/environment-variables/managing-environment-variables) e [visibilidade de consultas STABLE no PostgreSQL](https://www.postgresql.org/docs/17/xfunc-volatility.html).
