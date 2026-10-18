# Deploy na Magalu Cloud com domínio próprio

Este guia prepara a migração do portfólio React/Vite para um bucket privado de Object Storage da Magalu Cloud com arquivos de leitura pública por ACL, e um Worker da Cloudflare entregando o conteúdo por HTTPS. Os domínios previstos são `sergionascimentojr.com` e `www.sergionascimentojr.com`.

O repositório contém a configuração e o código de publicação. A criação dos recursos Magalu, o deploy do Worker e o corte de produção são etapas operacionais a executar na sua conta. Preserve os recursos anteriores para rollback; este guia não pressupõe que o domínio esteja atendendo tráfego pela AWS neste momento.

A zona DNS foi movida da conta Cloudflare anterior para a conta de destino e está **Active**. O titular confirmou o uso do domínio somente para o portfólio, sem email ou outros serviços. A próxima etapa é validar a entrega da origem Magalu e associar os domínios ao Worker; não é preciso repetir a mudança de nameservers. Consulte sempre a zona atual no painel.

## Arquitetura e requisitos

```text
GoDaddy: registro de sergionascimentojr.com
  └─ Cloudflare: DNS, Custom Domains e certificado HTTPS
       └─ Worker: proxy de leitura dos arquivos
            └─ Magalu Object Storage: bucket privado, objetos de dist/ public-read
```

A Cloudflare é uma dependência desta arquitetura: a Magalu armazena o site e a Cloudflare entrega as requisições no domínio próprio. Esse caminho é descrito no [guia oficial de hospedagem estática da Magalu](https://docs.magalu.cloud/docs/storage/object-storage/use-cases/static-website/). Não há necessidade de transferir o registro do domínio da GoDaddy.

Para hospedar sem o Worker, uma alternativa é uma VM Linux na Magalu com IP público, Caddy ou Nginx e certificado HTTPS administrado no servidor. Essa opção acrescenta manutenção do sistema operacional e do servidor web; não é o caminho implementado aqui. Consulte a [criação de VM Linux](https://docs.magalu.cloud/docs/computing/virtual-machine/how-to/create-instances/create-instance) e a [visão geral de redes](https://docs.magalu.cloud/docs/network/overview).

Você precisará de:

- Conta ativa na Magalu Cloud, com permissão para configurar Object Storage; nesta implantação é usada a conta pessoal.
- Acesso à conta Cloudflare de destino e à zona ativa. O acesso à conta anterior permite guardar um backup adicional, se necessário.
- Acesso à GoDaddy para alterar os nameservers e ao DNS atual para fazer backup.
- Acesso às configurações de Actions do repositório GitHub.
- Node.js 22+, npm, Python 3.12 e AWS CLI v2 para os comandos locais. A AWS CLI funciona como cliente S3 da Magalu; a hospedagem de destino não depende de uma conta AWS.

Verifique os preços e limites vigentes nas contas dos provedores antes de provisionar. Os comandos locais de teste não criam recursos na nuvem.

## 1. Salvar o estado atual

Antes de novas mudanças, recomenda-se registrar fora do repositório:

1. Nameservers atuais configurados na GoDaddy.
2. Exportação ou cópia completa da zona DNS atual, incluindo nome, tipo, valor, prioridade e TTL.
3. Destino exato da distribuição CloudFront e configurações dos registros de apex e `www`.
4. Registros adicionais existentes, como TXT de validação, CAA e subdomínios. Em outros domínios que usem email, preserve também MX e SPF/DKIM/DMARC.
5. Estado de DNSSEC e registros DS no registrador, se estiver habilitado.
6. Versão do site e configuração AWS que serão usadas para rollback.
7. Configurações Cloudflare anteriores que não fazem parte do export DNS: SSL/TLS, regras de redirecionamento e cache, Workers, rotas e demais serviços usados.

Conserve o bucket AWS, a distribuição CloudFront, o certificado ACM e a zona Route 53 durante a validação, quando fizerem parte da infraestrutura anterior. O novo workflow não atualiza mais a AWS: confirme e registre qual revisão e endpoint estarão disponíveis para recuperação, sem assumir que o DNS atual já aponta para eles.

## 2. Bucket privado e credenciais na Magalu

No [console da Magalu Cloud](https://console.magalu.cloud), selecione a conta e a região desejadas. Para este portfólio foi criado o bucket **privado** `portfolio-sergio-prod`, na região `br-se1`. O bucket não precisa ter o nome do domínio. Mantenha sua ACL privada e não habilite listagem pública.

Confirme o endpoint no console. Os exemplos usam:

```text
MGC_REGION=br-se1
MGC_S3_ENDPOINT=https://br-se1.magaluobjects.com
MGC_BUCKET=portfolio-sergio-prod
MGC_BUCKET_HOST=portfolio-sergio-prod.br-se1.magaluobjects.com
```

Esses valores devem apontar para a mesma região e bucket. O endpoint do cliente S3 tem `https://` e não contém o nome do bucket. Já `MGC_BUCKET_HOST`, usado pelo Worker, contém o bucket e não inclui protocolo ou caminho.

### Credencial escolhida para esta conta pessoal

A configuração atual usa uma chave pessoal de Object Storage chamada `portfolio-github-actions`, criada com autorização do titular, com **acesso total ao Object Storage e sem expiração**. Ela não é uma chave limitada ao bucket do portfólio. Seu uso fica dedicado ao GitHub Actions; o script publica apenas no destino configurado, mas isso não restringe a abrangência da credencial no provedor.

Guarde o **Key Pair ID** e o **Key Pair Secret** dessa chave somente nos secrets `MGC_ACCESS_KEY_ID` e `MGC_SECRET_ACCESS_KEY` do GitHub. A API Key geral é um componente diferente do par S3. Não coloque nenhum desses valores em código, arquivos do repositório, `wrangler.jsonc` ou variáveis Vite, que podem ser incluídas no navegador. Consulte o [guia de chaves do Object Storage](https://docs.magalu.cloud/docs/devops-tools/api-keys/how-to/object-storage/create-api-keys) e a [documentação dos componentes da credencial](https://docs.magalu.cloud/docs/devops-tools/api-keys/overview/).

Para publicar objetos com sua ACL, o publicador usa `s3:PutObject` e `s3:PutObjectAcl`. Não lista nem apaga objetos e verifica os arquivos por GET anônimo. Essas são as operações necessárias ao script; a chave pessoal escolhida tem permissões mais amplas.

### Leitura pública apenas dos objetos publicados

O publicador envia cada arquivo com `aws s3api put-object --acl public-read`. Essa ACL mantém o proprietário com `FULL_CONTROL` e permite leitura pública daquele objeto. A ACL do bucket continua privada, sem `ListBucket` público. O Worker acessa esses objetos por HTTPS sem credenciais.

Não é necessário criar Bucket Policy nem descobrir o tenant UUID para esse fluxo. A Magalu documenta ACLs de objetos e de buckets separadas, sem herança recursiva: [ACLs do Object Storage](https://docs.magalu.cloud/docs/storage/object-storage/how-to/permissions/acls-ht). O suporte a ACL no upload também aparece no [exemplo oficial de PutObject](https://docs.magalu.cloud/docs/storage/object-storage/troubleshooting/presigned-url).

Mantenha somente conteúdo publicável em `dist/`: cada arquivo enviado pelo publicador ficará acessível diretamente pela URL de origem. Para objetos anteriores que ainda estejam privados, publique novamente pelo script. Se já existir uma Bucket Policy, revise-a antes: regras da policy podem prevalecer sobre ACLs. Preserve a administração do proprietário ao alterá-la; consulte [problemas de permissionamento](https://docs.magalu.cloud/docs/storage/object-storage/troubleshooting/bucket-permission).

### Alternativa com identidade e permissões restritas

Em um contexto de organização, o fluxo documentado usa uma Service Account com par S3 próprio, escopos `object-storage.read`/`object-storage.write`, permissões IAM correspondentes e Bucket Policy limitando ações e bucket. Para este publicador, a identidade também precisa poder definir a ACL do objeto. As três camadas devem ser configuradas; gerar apenas a chave não limita o acesso ao bucket. Consulte [Object Storage com Service Account](https://docs.magalu.cloud/docs/storage/object-storage/how-to/permissions/service-account-access) e [chaves de Service Accounts no Turia IAM](https://docs.magalu.cloud/docs/account-management/turia/turia-iam/organization/how-to/manage-sa-apikes).

Esse caminho é uma alternativa para evoluir a configuração. Não foi verificado como chave restrita de tenant pessoal e não descreve a credencial pessoal atualmente escolhida.

## 3. Compilar e publicar no bucket sem alterar o domínio

Na raiz do repositório, execute:

```bash
npm ci
npm run test:deploy
npm run worker:check
npm run build
```

Configure o destino no terminal. Exemplo em PowerShell:

```powershell
$env:MGC_S3_ENDPOINT = 'https://br-se1.magaluobjects.com'
$env:MGC_REGION = 'br-se1'
$env:MGC_BUCKET = 'portfolio-sergio-prod'
```

Este é um procedimento manual alternativo; a chave `portfolio-github-actions` fica dedicada aos secrets do GitHub. Para publicação local, use uma credencial Magalu própria para essa operação, com `s3:PutObject` e `s3:PutObjectAcl`, disponibilizada no processo como `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`. Esses nomes são usados pelo cliente compatível com S3. Não use credenciais AWS nem reutilize um `AWS_SESSION_TOKEN` de outra sessão. Prefira injetar os valores por um gerenciador de segredos, sem gravá-los no histórico do terminal.

```bash
python scripts/deploy-magalu.py
```

Para validar somente endpoint, região e nome do bucket, sem credenciais nem upload, use `python scripts/deploy-magalu.py --validate` depois de definir as variáveis do destino.

O publicador usa `MGC_S3_ENDPOINT` explicitamente e define `--acl public-read` em cada upload. Envia e verifica os bytes dos arquivos do build antes de publicar `index.html` e preserva arquivos antigos para clientes que ainda usam uma versão anterior. Assets com nome versionado podem receber cache longo; arquivos que mudam no mesmo endereço e HTML precisam de revalidação.

A origem tem [consistência eventual](https://docs.magalu.cloud/docs/storage/object-storage/additional-explanations/product-limits/). Aguarde e repita a validação após o upload; não considere um único 404 imediato como falha definitiva. A publicação do HTML por último reduz a janela em que ele referencia arquivos ainda indisponíveis.

Valide o acesso público sem enviar credenciais:

```bash
curl -I https://portfolio-sergio-prod.br-se1.magaluobjects.com/index.html
```

Use `curl.exe` no Windows se `curl` for um alias do PowerShell. Confirme HTTP 200 e `Content-Type: text/html`. Pegue um caminho real de JS/CSS em `dist/index.html` e valide também o objeto correspondente. Confira que uma listagem anônima do bucket continua negada e que o proprietário mantém o acesso. A raiz do bucket não precisa mostrar o site ou listar arquivos: o Worker fará o mapeamento para `index.html`.

## 4. Publicar e testar o Worker

O código está em [infra/cloudflare/worker.mjs](../infra/cloudflare/worker.mjs) e a configuração em [infra/cloudflare/wrangler.jsonc](../infra/cloudflare/wrangler.jsonc).

Edite `vars.MGC_BUCKET_HOST` para o host do bucket confirmado no passo 2, por exemplo `portfolio-sergio-prod.br-se1.magaluobjects.com`. Mantenha `workers_dev: true` e `routes: []` nesta etapa. Não inclua credenciais S3: a origem é de leitura pública.

Para desenvolvimento e validação local:

```bash
npm run worker:check
npm run worker:dev
```

O Worker local pode buscar os objetos no bucket configurado. Depois de validar, autentique na conta Cloudflare correta e publique:

```bash
npx wrangler login
npm run worker:deploy
```

O Wrangler exibirá a URL `https://<worker>.<conta>.workers.dev`. Teste essa URL antes de configurar os domínios de produção. Este deploy publica o Worker; não cria bucket nem migra a zona DNS.

O Worker aceita GET/HEAD, mapeia a raiz para `index.html` e preserva os caminhos dos objetos. O fallback de SPA é limitado a uma origem que retorna 404, caminho sem extensão e cliente que aceita HTML; um asset ausente continua sendo erro. Uma falha 403 da origem resulta em 502 para não esconder problema de permissão.

Somente arquivos versionados em `/assets/` recebem cache longo. HTML e demais objetos exigem revalidação; erros usam `no-store`. O Worker não aplica cache de borda às respostas que precisam ser frescas. **Não configure uma regra global Cache Everything** que substitua esse comportamento. `sergionascimentojr.com` e `www` entregam o mesmo conteúdo; HTTP redireciona para HTTPS. O cabeçalho `X-Portfolio-Origin: magalu-cloud` identifica a entrega pelo Worker.

Valide a página inicial, imagens, scripts e folhas de estilo no navegador, incluindo celular e atualização da página. Verifique erros no console e na aba Network.

## 5. Conferir a zona DNS ativa na conta de destino

A mudança entre contas já foi feita e a nova zona está **Active**. Confirme esse estado no painel antes de associar os Custom Domains. Os nameservers utilizados devem ser os atribuídos à zona de destino, que permanecem registrados na GoDaddy. Não é necessário mudar o registrador nem repetir essa configuração.

O titular confirmou que o domínio será usado somente para o portfólio, sem email ou outros serviços a preservar. O export da zona anterior continua sendo um backup útil, mas não é um bloqueio adicional para este corte já autorizado. Salve o estado atual e os destinos anteriores conhecidos para rollback. Não trate a existência da zona antiga como backup permanente.

### Referência para migrações entre contas

Se precisar repetir esse processo para outro domínio ou reconstruir a configuração anterior:

1. Recomenda-se exportar a zona da conta anterior em **DNS → Records → Import and Export → Export** e guardar uma cópia fora do repositório.
2. Prepare a zona na conta de destino. Durante o preparo ela pode ficar **Pending**, enquanto a conta anterior continua delegada. Não use uma zona Pending como se já pudesse fazer proxy.
3. Importe o arquivo BIND e compare nomes, tipos, valores, TTL, prioridade e estado de proxy. O export Cloudflare inclui atributos `cf-proxied:true/false`, que prevalecem sobre a opção geral de proxy na importação.
4. Recrie configurações que não fazem parte do DNS, como SSL/TLS, redirects, cache e Workers/rotas. Certificados da conta anterior não são transferidos automaticamente.
5. Prepare DNSSEC e, no momento do corte, troque na GoDaddy os nameservers pelo par atribuído à nova zona. Não misture os pares das duas contas. Aguarde a zona de destino ficar **Active**.

O scan automático pode omitir nomes específicos e, ao mudar de conta, capturar IPs do proxy Cloudflare como se fossem a origem, causando erro 1000. Ele não substitui uma cópia autenticada dos registros quando é necessário preservar configurações existentes. Se houver email ou outros serviços em outro domínio, confira seus registros antes da troca. Referências: [mover domínio entre contas](https://developers.cloudflare.com/fundamentals/manage-domains/move-domain/), [exportar/importar registros](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/) e [limitações do scan](https://developers.cloudflare.com/dns/zone-setups/reference/dns-quick-scan/).

Não copie IPs observados do CloudFront nem do proxy Cloudflare como se fossem a origem. Se recuperar registros do Route 53, um **ALIAS não é um CNAME DNS comum**: recrie a equivalência usando o destino real e [CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/).

### Certificados e DNSSEC

Confira o estado do certificado na conta de destino antes de usar o Worker em produção. A emissão não é necessariamente imediata. Quando a origem anterior suporta acesso direto com certificado válido, manter seus registros em **DNS only** durante a emissão pode ajudar uma transição; não aplique essa opção sem confirmar que a origem funciona assim. Preserve a intenção dos registros CAA existentes e confira a compatibilidade com os novos certificados. Consulte [Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/enable-universal-ssl/) e [CAA](https://developers.cloudflare.com/ssl/edge-certificates/caa-records/).

Antes de qualquer futura mudança de nameservers, confira DS/DNSSEC no registrador. No fluxo comum, remova o DS antigo, mantenha a assinatura anterior até seu TTL expirar, troque os nameservers e só então habilite DNSSEC na zona nova e publique seu novo DS. Não basta desligar DNSSEC na conta antiga nem reutilizar seu DS: uma chave incompatível pode causar SERVFAIL. Veja [migração e rollback DNSSEC](https://developers.cloudflare.com/dns/dnssec/) e [atualização de nameservers](https://developers.cloudflare.com/dns/nameservers/update-nameservers/).

Não exclua manualmente a zona anterior durante a transição. Depois de mover a delegação, ela pode passar para **Moved Away** e seguir para exclusão automática, portanto não é um backup duradouro. Preserve os arquivos e as configurações que precisará para reconstrução. Referência: [estados de zona](https://developers.cloudflare.com/dns/zone-setups/reference/domain-status/).

### Validar um subdomínio de teste

Na zona ativa, configure primeiro um Custom Domain de teste sem registros conflitantes, por exemplo `preview.sergionascimentojr.com`, para o Worker. Valide por HTTPS nesse endereço. Mude apex e `www` para o Worker no corte planejado do próximo passo.

## 6. Cortar apex e www para o Worker

Com bucket, Worker, subdomínio de teste e certificado validados, abra **Workers & Pages → seu Worker → Settings → Domains & Routes → Add → Custom Domain**.

1. Faça uma última cópia dos registros e valide o destino anterior previsto para rollback.
2. No momento do corte de cada hostname, remova o registro CNAME conflitante, caso exista. Preserve verificações de propriedade e quaisquer registros de outros serviços que existam.
3. Adicione `sergionascimentojr.com` como Custom Domain.
4. Adicione `www.sergionascimentojr.com` como outro Custom Domain.
5. Aguarde os certificados/domínios indicarem estado ativo e valide os dois endereços por HTTPS.

A Cloudflare cria os registros e administra os certificados de Custom Domains. Um hostname com CNAME existente impede essa criação; se houver outro registro conflitante, substitua apenas o registro daquele hostname durante o corte, conforme o painel indicar. Não aponte um CNAME diretamente para o bucket esperando que isso emita certificado para seu domínio. Referência: [Custom Domains de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

A origem do Worker é acessada por HTTPS. Mantenha SSL/TLS em **Full (Strict)** conforme a orientação de hospedagem da Magalu; não use Flexible como correção de erro de certificado. Confirme também o redirecionamento de HTTP para HTTPS realizado pelo Worker.

Na configuração versionada, `routes: []` mantém o deploy inicial sem apropriar os domínios de produção. **Não faça um novo deploy do Worker mantendo esse array vazio depois do corte:** o Wrangler sobrescreve as rotas configuradas pelo painel. Antes do próximo deploy, registre conscientemente os dois Custom Domains em `routes` com `custom_domain: true`, preservando as demais opções da configuração:

```json
{
  "routes": [
    { "pattern": "sergionascimentojr.com", "custom_domain": true },
    { "pattern": "www.sergionascimentojr.com", "custom_domain": true }
  ]
}
```

Esse trecho deve ser mesclado no arquivo existente e passa a gerenciar o roteamento de produção. Como alternativa para gerenciamento exclusivamente pelo painel, remova as chaves `route`/`routes` do arquivo e defina `workers_dev: false` depois de concluir os testes. A [documentação de configuração do Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth) explica esse comportamento. Não altere essa configuração de produção durante o preparo inicial.

Confirme no final:

```bash
curl -I https://sergionascimentojr.com/
curl -I https://www.sergionascimentojr.com/
curl -I http://sergionascimentojr.com/
```

Os dois HTTPS devem apresentar certificado válido, entregar o portfólio e incluir `X-Portfolio-Origin: magalu-cloud`. O HTTP deve redirecionar para HTTPS. Confira também imagens, JS/CSS, atualização da página, console do navegador, contato e links externos. Se este procedimento for reutilizado em um domínio com outros serviços, valide também os registros desses serviços.

## 7. Ativar deploy automático

No GitHub, abra **Settings → Secrets and variables → Actions**.

Em **Variables**, configure:

```text
MGC_S3_ENDPOINT=https://br-se1.magaluobjects.com
MGC_REGION=br-se1
MGC_BUCKET=portfolio-sergio-prod
MGC_DEPLOY_ENABLED=false
```

Em **Secrets**, configure `MGC_ACCESS_KEY_ID` e `MGC_SECRET_ACCESS_KEY` com o par da Magalu. Não são os antigos secrets AWS. O workflow mapeia esses secrets para os nomes `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` somente durante o upload compatível com S3.

Depois da validação manual, altere `MGC_DEPLOY_ENABLED` para o valor exato `true` e execute o workflow manualmente na branch `master`. Confirme o upload e a versão apresentada pelo domínio. Os próximos pushes em `master` poderão publicar no bucket. Pull Requests apenas validam; não devem publicar.

A pipeline de aplicação não precisa de token Cloudflare e não publica o Worker. Mudanças no Worker seguem o procedimento manual do passo 4. Consulte também [.github/workflows/README.md](../.github/workflows/README.md).

## 8. Rollback

Se houver falha, defina primeiro `MGC_DEPLOY_ENABLED=false` no GitHub para interromper novos uploads. Isso não desfaz o DNS nem reverte o conteúdo já enviado.

Para restaurar a origem anterior mantendo o DNS na conta Cloudflare de destino:

1. Remova do Worker apenas os Custom Domains de produção que estão sendo revertidos.
2. Restaure os registros de apex e `www` para o destino real validado no backup, preservando os demais serviços. Se o rollback escolhido for a infraestrutura AWS, confirme a distribuição CloudFront e o certificado antes de apontar para ela.
3. Confirme certificado, conteúdo e respostas DNS. O cache de DNS pode fazer parte dos visitantes usar o destino anterior por algum tempo.

Se precisar reverter também a mudança de conta, confirme primeiro que a zona anterior ainda existe e pode ser reativada para atender DNS e proxy. Como ela pode entrar no ciclo de exclusão automática, trocar apenas os nameservers de volta não garante a recuperação. Se necessário, reconstrua as configurações pelo export preservado. Coordene o DS/DNSSEC com a zona que voltará a atender: não mantenha o DS da conta nova ao apontar para outra chave, mesmo que ambas as contas sejam Cloudflare.

Para reverter somente uma versão do site na Magalu, faça build de uma revisão conhecida e execute o publicador novamente. Assets anteriores preservados facilitam a transição, mas não substituem um backup do HTML e da revisão. Não habilite deploy em duas revisões concorrentes.

Preserve os recursos anteriores até concluir o período de observação escolhido. Remoção de bucket, distribuição, certificado, zona DNS ou credenciais antigas é uma etapa posterior, após conferir dependências e obter autorização; os comandos de publicação deste guia não removem esses recursos. A exclusão automática da zona antiga pela Cloudflare é um processo separado, por isso o backup independente é necessário.

## Problemas comuns

- **403 no objeto:** confira conta, bucket e se o upload definiu `--acl public-read`. A identidade de upload precisa de `s3:PutObject` e `s3:PutObjectAcl`. Se houver Bucket Policy, confira se não impede a ACL. Um 403 na listagem anônima do bucket é esperado nesta configuração privada.
- **404 logo após upload:** confirme caminho e região, aguarde a consistência eventual e teste novamente. Verifique se o build realmente contém o arquivo.
- **Arquivo JS recebe HTML:** confira o caminho do asset e o fallback do Worker. Um arquivo ausente deve retornar erro; publicar `index.html` sem seus assets pode quebrar a aplicação.
- **Domínio não pode ser adicionado ao Worker:** confira se a zona está ativa na conta correta e se existe CNAME conflitante no hostname. Remova-o somente durante o corte planejado.
- **Falha TLS:** aguarde a emissão, confira CAA e estado do Custom Domain. Não ignore validação de certificado.
- **SERVFAIL depois da troca de nameservers:** confira o DS/DNSSEC e a delegação usando o backup e o guia do provedor.
- **Site antigo aparece:** confirme o destino DNS, a revisão publicada e os cabeçalhos de cache. Aguarde propagação ou revalidação; não aplique cache longo ao HTML para mascarar a falha.
