# GitHub Actions Workflow

Este diretório contém os workflows de CI/CD do projeto.

## Workflow: deploy.yml

Este workflow automatiza o processo de deploy do portfólio para o Amazon S3 e invalida o cache do CloudFront.

### Triggers

- Push para a branch `master`
- Execução manual via GitHub Actions UI

### Secrets Necessários

Configure os seguintes secrets no repositório GitHub:

1. **AWS_ACCESS_KEY_ID**
   - Chave de acesso da AWS
   - Permissões necessárias: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`, `cloudfront:CreateInvalidation`

2. **AWS_SECRET_ACCESS_KEY**
   - Chave secreta da AWS
   - Deve corresponder ao `AWS_ACCESS_KEY_ID`

3. **CLOUDFRONT_DISTRIBUTION_ID** (opcional)
   - ID da distribuição do CloudFront
   - Se não configurado, a invalidação de cache será pulada

### Como obter o CloudFront Distribution ID

1. Acesse o console da AWS
2. Vá para o serviço CloudFront
3. Selecione sua distribuição
4. O Distribution ID estará visível no topo da página

### Como configurar os secrets

1. Acesse: `https://github.com/SEU_USUARIO/portfolio/settings/secrets/actions`
2. Clique em **New repository secret**
3. Adicione cada secret com o nome e valor correspondentes

### Permissões IAM necessárias

Crie uma política IAM com as seguintes permissões:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::sergionascimentojr.com",
        "arn:aws:s3:::sergionascimentojr.com/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

