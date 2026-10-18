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

A API Key geral da Magalu Cloud não substitui esse par S3. Configure as credenciais da conta correta; não use as chaves AWS anteriores. No processo de upload, os secrets são expostos ao cliente compatível com S3 pelos nomes `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. Todas as chamadas de publicação devem usar explicitamente `MGC_S3_ENDPOINT`.

Nesta conta pessoal foi escolhida, com autorização do titular, a chave `portfolio-github-actions`, de acesso total ao Object Storage e sem expiração. Seu uso fica dedicado ao GitHub Actions. Ela não é limitada ao bucket do portfólio, embora o workflow publique apenas no destino configurado. Guarde os valores somente nos secrets; não os inclua em arquivos versionados, no Worker ou em variáveis Vite.

## Permissões

A identidade autenticada do deploy precisa executar `s3:PutObject` e `s3:PutObjectAcl` nos objetos do destino. O script usa `put-object --acl public-read` e verifica o conteúdo com GET público; não precisa de `s3:ListBucket` nem de exclusão. Essas são as operações necessárias, não uma descrição do alcance da chave pessoal, que é mais amplo. Não são necessárias permissões CloudFront.

A ACL `public-read` de cada objeto mantém o proprietário com `FULL_CONTROL` e permite leitura anônima. O bucket permanece privado, sem listagem pública. Esta configuração dispensa Bucket Policy; se já existir uma, suas regras devem ser compatíveis com a leitura pública e preservar a administração do proprietário. Consulte [ACLs da Magalu](https://docs.magalu.cloud/docs/storage/object-storage/how-to/permissions/acls-ht).

Para uma futura identidade limitada ao bucket, o caminho documentado em organizações usa Service Account, escopos da chave, grants IAM e Bucket Policy. Isso não foi confirmado como opção de chave restrita na conta pessoal atual. O [guia completo](../../docs/deploy-magalu.md) descreve essa alternativa.

## Operação e recuperação

O pipeline compila o projeto e executa as verificações de deploy antes da publicação. Os arquivos do build são enviados antes de `index.html`, que é publicado por último. Arquivos antigos permanecem no bucket para permitir o carregamento de versões anteriores durante a transição.

O deploy automático atualiza apenas os objetos. Para alterações no Worker, valide com `npm run test:deploy` e `npm run worker:check`, depois publique manualmente com `npm run worker:deploy` na sua conta Cloudflare autenticada. Os Custom Domains são configurados no painel durante o corte; o repositório começa com `routes: []`. Antes de redeploy após o corte, sincronize esses domínios na configuração ou siga o modo de gerenciamento por painel descrito no guia: manter `routes: []` pode removê-los.

Para interromper novos uploads, altere `MGC_DEPLOY_ENABLED` para `false`. Isso não desfaz uma publicação nem restaura o DNS. O procedimento para recuperar a origem anterior e a mudança de conta DNS está em [docs/deploy-magalu.md](../../docs/deploy-magalu.md). Conserve os recursos anteriores e o backup independente dos registros até encerrar a migração.
