# Deploy na Magalu Cloud com domínio próprio

Este guia prepara a migração do portfólio React/Vite para um bucket público de Object Storage da Magalu Cloud, com um Worker da Cloudflare entregando o conteúdo por HTTPS. Os domínios previstos são `sergionascimentojr.com` e `www.sergionascimentojr.com`.

O repositório contém a configuração e o código de publicação. A criação dos recursos Magalu, o deploy do Worker e o corte de produção são etapas operacionais a executar na sua conta. Preserve os recursos anteriores para rollback; este guia não pressupõe que o domínio esteja atendendo tráfego pela AWS neste momento.

O caminho escolhido inclui mover a zona DNS de uma conta Cloudflare anterior para a conta de destino. No preparo inicial, foi criada uma nova zona em estado **Pending**, sem alterar os nameservers existentes. Consulte os valores atribuídos à nova zona no painel; o corte só deve ocorrer depois de exportar o DNS antigo, importar e conferir os registros, preparar certificados e verificar DNSSEC.

## Arquitetura e requisitos

```text
GoDaddy: registro de sergionascimentojr.com
  └─ Cloudflare: DNS, Custom Domains e certificado HTTPS
       └─ Worker: proxy de leitura dos arquivos
            └─ Magalu Object Storage: conteúdo de dist/
```

A Cloudflare é uma dependência desta arquitetura: a Magalu armazena o site e a Cloudflare entrega as requisições no domínio próprio. Esse caminho é descrito no [guia oficial de hospedagem estática da Magalu](https://docs.magalu.cloud/docs/storage/object-storage/use-cases/static-website/). Não há necessidade de transferir o registro do domínio da GoDaddy.

Para hospedar sem o Worker, uma alternativa é uma VM Linux na Magalu com IP público, Caddy ou Nginx e certificado HTTPS administrado no servidor. Essa opção acrescenta manutenção do sistema operacional e do servidor web; não é o caminho implementado aqui. Consulte a [criação de VM Linux](https://docs.magalu.cloud/docs/computing/virtual-machine/how-to/create-instances/create-instance) e a [visão geral de redes](https://docs.magalu.cloud/docs/network/overview).

Você precisará de:

- Conta ativa e organização correta na Magalu Cloud, com permissão para configurar Object Storage.
- Acesso à conta Cloudflare anterior para exportar a zona e à conta de destino para preparar a nova zona.
- Acesso à GoDaddy para alterar os nameservers e ao DNS atual para fazer backup.
- Acesso às configurações de Actions do repositório GitHub.
- Node.js 22+, npm, Python 3.12 e AWS CLI v2 para os comandos locais. A AWS CLI funciona como cliente S3 da Magalu; a hospedagem de destino não depende de uma conta AWS.

Verifique os preços e limites vigentes nas contas dos provedores antes de provisionar. Os comandos locais de teste não criam recursos na nuvem.

## 1. Salvar o estado atual

Antes de mudar DNS, registre fora do repositório:

1. Nameservers atuais configurados na GoDaddy.
2. Exportação ou cópia completa da zona DNS atual, incluindo nome, tipo, valor, prioridade e TTL.
3. Destino exato da distribuição CloudFront e configurações dos registros de apex e `www`.
4. Registros MX, TXT de SPF/DKIM/DMARC, CAA, verificações de propriedade e subdomínios existentes.
5. Estado de DNSSEC e registros DS no registrador, se estiver habilitado.
6. Versão do site e configuração AWS que serão usadas para rollback.
7. Configurações Cloudflare anteriores que não fazem parte do export DNS: SSL/TLS, regras de redirecionamento e cache, Workers, rotas e demais serviços usados.

Conserve o bucket AWS, a distribuição CloudFront, o certificado ACM e a zona Route 53 durante a validação, quando fizerem parte da infraestrutura anterior. O novo workflow não atualiza mais a AWS: confirme e registre qual revisão e endpoint estarão disponíveis para recuperação, sem assumir que o DNS atual já aponta para eles.

## 2. Criar bucket e credenciais na Magalu

No [console da Magalu Cloud](https://console.magalu.cloud), selecione a organização e a região desejadas. Crie um bucket exclusivo para os arquivos públicos do portfólio, por exemplo `portfolio-sergio-prod`. Use nome em minúsculas, sem pontos; ele não precisa ser igual ao domínio.

Anote o endpoint exibido para a região. Neste guia, os exemplos usam:

```text
MGC_REGION=br-se1
MGC_S3_ENDPOINT=https://br-se1.magaluobjects.com
MGC_BUCKET=portfolio-sergio-prod
MGC_BUCKET_HOST=portfolio-sergio-prod.br-se1.magaluobjects.com
```

Confirme esses valores no console; eles devem apontar para a mesma região e bucket. O endpoint do cliente S3 tem `https://` e não contém o nome do bucket. Já `MGC_BUCKET_HOST`, usado pelo Worker, contém o bucket e não inclui protocolo ou caminho.

Crie credenciais para **Object Storage** no ID Magalu conforme o [guia de chaves do produto](https://docs.magalu.cloud/docs/devops-tools/api-keys/how-to/object-storage/create-api-keys). Selecione explicitamente o serviço Object Storage e os acessos necessários para publicação. Guarde o **Key Pair ID** e o **Key Pair Secret**; a API Key geral é um componente diferente, conforme a [documentação de credenciais](https://docs.magalu.cloud/docs/devops-tools/api-keys/overview/).

Use uma identidade própria para o deploy, com `s3:PutObject` apenas nos objetos do bucket do portfólio. O script não lista nem apaga objetos e verifica os arquivos por GET público. A limpeza automática não faz parte deste deploy. Não coloque chaves no código, em `wrangler.jsonc`, em arquivos versionados ou em variáveis Vite que serão incluídas no navegador.

### Leitura pública sem escrita anônima

O Worker acessa a origem sem credenciais, portanto os objetos publicados precisam permitir leitura pública. Na edição de Bucket Policy, adicione esta declaração à política do bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicPortfolioRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "portfolio-sergio-prod/*"
    }
  ]
}
```

Esse é o trecho de leitura pública, não uma substituição completa para as permissões da sua conta. **Antes de salvar, inclua ou preserve as declarações autenticadas de administração e deploy.** Na Magalu, a política pode substituir o acesso anterior e bloquear a própria conta se seu tenant não tiver uma declaração correspondente. Consulte [Bucket Policy](https://docs.magalu.cloud/docs/storage/object-storage/how-to/permissions/policies/) e [problemas de permissionamento](https://docs.magalu.cloud/docs/storage/object-storage/troubleshooting/bucket-permission).

Se o bucket ainda não tem política, inclua uma declaração explícita para o **tenant proprietário** antes de salvá-la. O exemplo de recuperação da Magalu permite ao proprietário administrar seu bucket desta forma:

```json
{
  "Effect": "Allow",
  "Principal": { "MGC": ["SEU_TENANT_ID_PROPRIETARIO"] },
  "Action": "s3:*",
  "Resource": ["portfolio-sergio-prod", "portfolio-sergio-prod/*"]
}
```

Mescle esse objeto no array `Statement` e substitua o ID pelo tenant proprietário confirmado no console. O acesso amplo dessa declaração é apenas para a administração autenticada do proprietário, nunca para `*`. Para limitar a credencial do CI, use uma conta de serviço de deploy separada.

Para a identidade autenticada de deploy, as declarações têm o seguinte formato; substitua o principal pelo tenant ou pela conta de serviço apropriada e mantenha a administração existente:

```json
[
  {
    "Effect": "Allow",
    "Principal": { "MGC": ["SEU_PRINCIPAL_AUTENTICADO"] },
    "Action": "s3:PutObject",
    "Resource": "portfolio-sergio-prod/*"
  }
]
```

Esses objetos devem ser mesclados no array `Statement`, não colados como uma política isolada. O formato de principal para conta de serviço é descrito pela Magalu; não substitua por um ARN IAM da AWS. Nos exemplos Magalu, `Resource` é o nome do bucket ou `bucket/*`.

Não conceda `s3:ListBucket`, `s3:PutObject` ou `s3:DeleteObject` ao principal `*`. O bucket deve conter apenas arquivos que podem ser públicos, pois sua URL de origem também será acessível diretamente.

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

Disponibilize o Key Pair ID e o Key Pair Secret da Magalu no processo pelos nomes `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`, usados pelo cliente compatível com S3. Não use credenciais AWS nem reutilize um `AWS_SESSION_TOKEN` de outra sessão. Prefira injetar esses valores pelo seu gerenciador de segredos; evite gravar credenciais no histórico do terminal.

```bash
python scripts/deploy-magalu.py
```

Para validar somente endpoint, região e nome do bucket, sem credenciais nem upload, use `python scripts/deploy-magalu.py --validate` depois de definir as variáveis do destino.

O publicador usa `MGC_S3_ENDPOINT` explicitamente, envia e verifica os bytes dos arquivos do build antes de publicar `index.html` e preserva arquivos antigos para clientes que ainda usam uma versão anterior. Assets com nome versionado podem receber cache longo; arquivos que mudam no mesmo endereço e HTML precisam de revalidação.

A origem tem [consistência eventual](https://docs.magalu.cloud/docs/storage/object-storage/additional-explanations/product-limits/). Aguarde e repita a validação após o upload; não considere um único 404 imediato como falha definitiva. A publicação do HTML por último reduz a janela em que ele referencia arquivos ainda indisponíveis.

Valide o acesso público sem enviar credenciais:

```bash
curl -I https://portfolio-sergio-prod.br-se1.magaluobjects.com/index.html
```

Use `curl.exe` no Windows se `curl` for um alias do PowerShell. Confirme HTTP 200 e `Content-Type: text/html`. Pegue um caminho real de JS/CSS em `dist/index.html` e valide também o objeto correspondente. A raiz do bucket não precisa mostrar o site ou listar arquivos: o Worker fará o mapeamento para `index.html`.

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

## 5. Mover a zona DNS entre contas Cloudflare

A migração entre contas consiste em preparar a zona na conta de destino e depois mudar a delegação na GoDaddy. Ela não transfere o registro do domínio. As duas zonas podem existir durante o preparo: a anterior continua sendo a zona delegada e a nova fica **Pending**, sem poder fazer proxy até a ativação. Siga o [procedimento oficial para mover um domínio entre contas](https://developers.cloudflare.com/fundamentals/manage-domains/move-domain/).

### Exportar a zona anterior e importar na nova

1. Entre na conta Cloudflare anterior e abra a zona `sergionascimentojr.com`.
2. Em **DNS → Records → Import and Export → Export**, baixe o arquivo da zona e guarde uma cópia fora do repositório. Registre também as configurações que não estão no export DNS.
3. Na conta de destino, abra a nova zona já preparada em **Pending**. Confira que ela pertence à conta pretendida; não crie novas cópias a cada tentativa.
4. Use **DNS → Records → Import and Export → Import** para importar o arquivo BIND da origem.
5. Compare nome, tipo, conteúdo, TTL, prioridade e estado de proxy dos registros nas duas contas. O export Cloudflare inclui atributos `cf-proxied:true/false`, que prevalecem sobre a opção geral de proxy da importação. Confira o resultado no painel.

Referência: [importação e exportação de registros](https://developers.cloudflare.com/dns/manage-dns-records/how-to/import-and-export/).

**Não use o scan automático nem consultas públicas como substituto do export autenticado.** O scan pode omitir subdomínios e seletores DKIM personalizados. Em uma mudança entre contas, também pode capturar IPs do proxy Cloudflare como se fossem a origem e causar erro 1000. Se o backup da conta anterior ainda não estiver disponível, mantenha a zona nova em Pending e não troque os nameservers. Consulte as [limitações do scan](https://developers.cloudflare.com/dns/zone-setups/reference/dns-quick-scan/).

Ao revisar os registros:

- Preserve MX e TXT de email, SPF/DKIM/DMARC, verificações de propriedade, CAA e os subdomínios existentes. Mantenha as configurações exigidas pelo serviço de email.
- Preserve os destinos reais de apex e `www` conforme o export, sem presumir que apontem para a AWS. Valide e registre separadamente o endpoint anterior disponível para rollback.
- Se precisar recuperar registros antigos do Route 53, lembre que **ALIAS não é um CNAME DNS comum**. Recrie a equivalência usando o destino real e [CNAME flattening da Cloudflare](https://developers.cloudflare.com/dns/cname-flattening/); não copie IPs observados do CloudFront nem IPs do proxy Cloudflare como origem.
- Revise as configurações SSL/TLS, redirects, regras de cache, Workers/rotas e eventuais serviços ou assinaturas da zona anterior. Não são migrados pelo export DNS.
- Preserve a intenção dos CAA e confira se permitem os novos certificados. Não remova todos os CAA para contornar um erro; consulte os [valores das autoridades certificadoras](https://developers.cloudflare.com/ssl/edge-certificates/caa-records/).

### Preparar certificados e DNSSEC antes da mudança de nameservers

Os certificados da conta anterior não são transferidos para a nova. Planeje sua reemissão e valide o certificado novo antes de usar o proxy ou o Worker em produção. Universal SSL depende da ativação da zona; quando a origem anterior suporta acesso direto com certificado válido, manter seus registros em **DNS only** durante a emissão pode ajudar a transição. Não aplique essa opção sem confirmar que a origem funciona assim. Consulte a [ativação de Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/enable-universal-ssl/).

Verifique se existe DS/DNSSEC na GoDaddy. No fluxo comum:

1. Remova o DS antigo no registrador.
2. Mantenha a assinatura da zona anterior enquanto aguarda expirar o TTL do DS na zona pai.
3. Só depois altere os nameservers para a zona nova.
4. Com a nova zona ativa e a delegação propagada, habilite DNSSEC nela e publique seu **novo DS** na GoDaddy.

Não basta desligar DNSSEC na conta antiga, nem reutilizar o DS anterior na zona nova. Um DS antigo em cache pode produzir SERVFAIL depois da troca de nameservers. Caso seja necessária continuidade de assinatura, use uma migração ativa suportada pelas contas e provedores. Referência: [migração e rollback DNSSEC](https://developers.cloudflare.com/dns/dnssec/).

### Ativar a conta de destino

Depois de conferir o export/import, as configurações e DNSSEC, altere **somente os nameservers** na GoDaddy para o par **atribuído à nova zona pelo painel Cloudflare**. Não use automaticamente o par antigo nem misture os pares das duas contas. O registro do domínio permanece na GoDaddy. Consulte as [instruções oficiais de atualização de nameservers](https://developers.cloudflare.com/dns/nameservers/update-nameservers/).

Na visão geral da zona nova, use a opção de reverificação dos nameservers quando necessário e aguarde **Active**. Valide registros, email, certificados e demais serviços. A mudança de conta deve preservar os destinos importados; o corte para o Worker acontece no próximo passo, depois de testá-lo.

**Não exclua a zona anterior antes do corte.** Depois da ativação da nova conta, a zona antiga pode passar para **Moved Away** e seguir para exclusão automática. Ela não é um backup duradouro: conserve o export e as configurações para reconstrução e rollback. Consulte os [estados de zona](https://developers.cloudflare.com/dns/zone-setups/reference/domain-status/).

### Validar o subdomínio de teste na zona ativa

Com a nova zona ativa, configure primeiro um Custom Domain de teste sem registros conflitantes, por exemplo `preview.sergionascimentojr.com`, para o Worker. Valide por HTTPS nesse endereço. Preserve os registros de apex e `www` até o corte planejado para o Worker.

## 6. Cortar apex e www para o Worker

Com bucket, Worker, subdomínio de teste e certificado validados, abra **Workers & Pages → seu Worker → Settings → Domains & Routes → Add → Custom Domain**.

1. Faça uma última cópia dos registros e valide o destino anterior previsto para rollback.
2. No momento do corte de cada hostname, remova o registro CNAME conflitante, caso exista. Não remova registros de email ou verificações de propriedade.
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

Os dois HTTPS devem apresentar certificado válido, entregar o portfólio e incluir `X-Portfolio-Origin: magalu-cloud`. O HTTP deve redirecionar para HTTPS. Confira também imagens, JS/CSS, atualização da página, console do navegador, contato e links externos. Teste novamente email e DNS de outros serviços.

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

- **403 na origem:** confira organização, bucket, policy pública `s3:GetObject` e grant autenticado do deploy. A raiz do bucket não precisa permitir listagem.
- **404 logo após upload:** confirme caminho e região, aguarde a consistência eventual e teste novamente. Verifique se o build realmente contém o arquivo.
- **Arquivo JS recebe HTML:** confira o caminho do asset e o fallback do Worker. Um arquivo ausente deve retornar erro; publicar `index.html` sem seus assets pode quebrar a aplicação.
- **Domínio não pode ser adicionado ao Worker:** confira se a zona está ativa na conta correta e se existe CNAME conflitante no hostname. Remova-o somente durante o corte planejado.
- **Falha TLS:** aguarde a emissão, confira CAA e estado do Custom Domain. Não ignore validação de certificado.
- **SERVFAIL depois da troca de nameservers:** confira o DS/DNSSEC e a delegação usando o backup e o guia do provedor.
- **Site antigo aparece:** confirme o destino DNS, a revisão publicada e os cabeçalhos de cache. Aguarde propagação ou revalidação; não aplique cache longo ao HTML para mascarar a falha.
