# CA publica do monitor SQL

`supabase-prod-ca-2021.crt` foi obtido em 11/11/2026 por HTTPS, com validacao
normal do certificado web, da URL usada pelo painel oficial Supabase:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

Proveniencia do link: [configuracao oficial do painel, commit fixo](https://github.com/supabase/supabase/blob/f38928ad90f1c2bd44f668411fb1d2312754d258/apps/studio/hooks/custom-content/custom-content.json),
chave `ssl:certificate_url`, ambiente `prod`. O download retornou HTTP 200.
O arquivo baixado do painel pelo responsavel foi conferido separadamente e
possui o mesmo fingerprint SHA-256 DER.
Nao foi copiado do handshake SQL, de outro projeto ou de uma resposta de forum.
O certificado e publico, nao contem chave privada nem exige secret adicional.

SHA-256 do certificado DER:
`807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA`.
Validade: 28/04/2021 a 26/04/2031 UTC. O preflight confere pin, CA, assinatura
propria e validade; nao baixa nem aceita uma nova raiz automaticamente.
Rotacao exige obter novamente a CA do painel/fonte oficial, revisar sua
proveniencia, atualizar o pin e testar a cadeia e hostname em PR propria.

O workflow aponta `PGSSLROOTCERT` exclusivamente para este arquivo e preserva
`PGSSLMODE=verify-full`. Nao altera o trust store global, o Sentry ou o app.
Uma CA ausente/invalida deve bloquear, nunca retornar ao bundle do sistema,
`require`, `prefer` ou verificacao TLS desabilitada.
