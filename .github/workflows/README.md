# GitHub Actions

O workflow [ci.yml](ci.yml) valida e compila o portfólio em pushes e Pull Requests para `master`. O [deploy.yml](deploy.yml) repete as verificações e publica no bucket de Object Storage da Magalu Cloud quando habilitado. A entrega por HTTPS e domínio próprio é feita por um Worker da Cloudflare, publicado separadamente.

## Execução

- Push para `master`.
- Pull Requests para `master`, apenas para validação pelo `ci.yml`.
- Execução manual em **Actions → workflow de deploy → Run workflow**.

O upload exige a variável de repositório `MGC_DEPLOY_ENABLED` com o valor exato `true` e não é executado em Pull Requests. Deixe a variável ausente ou com `false` durante a preparação.

## Variáveis e secrets

Em **Settings → Secrets and variables → Actions → Variables**, crie:

- `MGC_S3_ENDPOINT`: endpoint HTTPS da região, por exemplo `https://br-se1.magaluobjects.com`. Confirme o valor no console da Magalu.
- `MGC_REGION`: região correspondente, por exemplo `br-se1`.
- `MGC_BUCKET`: nome do bucket, por exemplo `portfolio-sergio-prod`.
- `MGC_DEPLOY_ENABLED`: comece com `false`; altere para `true` após a validação descrita no [guia de migração](../../docs/deploy-magalu.md).

Em **Secrets → New repository secret**, crie:

- `MGC_ACCESS_KEY_ID`: **Key Pair ID** do Object Storage da Magalu Cloud.
- `MGC_SECRET_ACCESS_KEY`: **Key Pair Secret** correspondente.

A API Key geral da Magalu Cloud não substitui esse par S3. Configure as credenciais da conta e organização corretas; não use as chaves AWS anteriores. No processo de upload, os secrets são expostos ao cliente compatível com S3 pelos nomes `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. Todas as chamadas de publicação devem usar explicitamente `MGC_S3_ENDPOINT`.

## Permissões

A identidade autenticada do deploy precisa de `s3:PutObject` nos objetos do bucket de destino. O script usa `put-object` e verifica o conteúdo com GET público; não precisa de `s3:ListBucket` nem de exclusão. Restrinja as permissões ao bucket do portfólio. Conceda acesso autenticado adicional somente se precisar de outras ferramentas de administração. Não são necessárias permissões CloudFront.

A leitura anônima é outra regra: somente `s3:GetObject` nos objetos públicos. Não conceda listagem, escrita ou exclusão ao principal `*`. Preserve a administração autenticada ao editar a Bucket Policy da Magalu Cloud.

## Operação e recuperação

O pipeline compila o projeto e executa as verificações de deploy antes da publicação. Os arquivos do build são enviados antes de `index.html`, que é publicado por último. Arquivos antigos permanecem no bucket para permitir o carregamento de versões anteriores durante a transição.

O deploy automático atualiza apenas os objetos. Para alterações no Worker, valide com `npm run test:deploy` e `npm run worker:check`, depois publique manualmente com `npm run worker:deploy` na sua conta Cloudflare autenticada. Os Custom Domains são configurados no painel durante o corte; o repositório começa com `routes: []`. Antes de redeploy após o corte, sincronize esses domínios na configuração ou siga o modo de gerenciamento por painel descrito no guia: manter `routes: []` pode removê-los.

Para interromper novos uploads, altere `MGC_DEPLOY_ENABLED` para `false`. Isso não desfaz uma publicação nem restaura o DNS. O procedimento para recuperar a origem anterior e a mudança de conta DNS está em [docs/deploy-magalu.md](../../docs/deploy-magalu.md). Conserve os recursos anteriores e o backup independente dos registros até encerrar a migração.
