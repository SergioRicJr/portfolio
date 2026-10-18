# Portfólio Web

Este projeto é um portfólio pessoal interativo e moderno, desenvolvido para apresentar habilidades, projetos e experiências profissionais. O site apresenta um design responsivo com tema escuro/neon, animações suaves e elementos 3D interativos.

**🌐 Domínio do portfólio:** [https://sergionascimentojr.com](https://sergionascimentojr.com)

## Tabela de Conteúdos

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Requisitos para Uso](#requisitos-para-uso)
- [Instalação em Ambiente Local](#instalação-em-ambiente-local)
- [Como Iniciar](#como-iniciar)
- [Como Usar](#como-usar)
- [Build com Docker](#build-com-docker)
- [CI/CD com GitHub Actions](#cicd-com-github-actions)
- [Deploy e Publicação na Nuvem](#deploy-e-publicação-na-nuvem)
- [Informações Adicionais](#informações-adicionais)

## Tecnologias Utilizadas

### Frontend

O projeto foi construído utilizando uma stack moderna de desenvolvimento web:

-   **React**: Biblioteca JavaScript para construção de interfaces de usuário.
-   **TypeScript**: Superset tipado de JavaScript para maior segurança e escalabilidade.
-   **Vite**: Build tool rápida para desenvolvimento frontend moderno.
-   **Tailwind CSS**: Framework CSS utility-first para estilização rápida e responsiva.
-   **Framer Motion**: Biblioteca para animações declarativas e gestos.
-   **Three.js / @react-three/fiber**: Renderização de gráficos 3D e efeitos visuais (background de partículas).
-   **Lucide React**: Biblioteca de ícones leve e consistente.
-   **React Scroll**: Para navegação suave entre as seções da página.

### Infraestrutura e Deploy

-   **Magalu Cloud Object Storage**: Bucket privado com arquivos compilados de leitura pública por ACL, usando API compatível com S3.
-   **Cloudflare Workers**: Entrega o conteúdo do bucket por HTTPS nos domínios personalizados.
-   **Cloudflare DNS**: Gerencia os registros do domínio e seu apontamento para o Worker.
-   **GoDaddy**: Mantém o registro do domínio.
-   **Docker**: Containerização para builds consistentes.
-   **GitHub Actions**: CI/CD para deploy automático.

A migração está preparada no repositório e exige provisionamento e validação antes do corte do domínio. Preserve os recursos anteriores para rollback durante essa transição. O [guia de deploy na Magalu Cloud](docs/deploy-magalu.md) detalha a configuração, a validação e o rollback.

## Requisitos para Uso

Para rodar este projeto localmente, você precisará ter instalado em sua máquina:

-   **Node.js**: Versão 22 ou superior para os comandos de aplicação e Worker.
-   **Gerenciador de Pacotes**: npm (vem com o Node.js), yarn ou pnpm.

## Instalação em Ambiente Local

1.  Clone o repositório para sua máquina local:
    ```bash
    git clone https://github.com/SergioRicJr/portfolio.git
    ```

2.  Navegue até o diretório do projeto:
    ```bash
    cd portfolio
    ```

3.  Instale as dependências do projeto:
    ```bash
    npm install
    ```

## Como Iniciar

Para iniciar o servidor de desenvolvimento local:

```bash
npm run dev
```

O terminal exibirá o endereço local (geralmente `http://localhost:5173`) onde você pode acessar a aplicação.

## Como Usar

Após iniciar a aplicação, você pode navegar pelas diferentes seções do portfólio:

-   **Hero**: Apresentação inicial com efeito 3D interativo.
-   **Sobre**: Resumo profissional e valores.
-   **Projetos**: Galeria de projetos desenvolvidos, com links para código e PyPI (quando aplicável).
-   **Habilidades**: Carrossel infinito mostrando tecnologias e ferramentas.
-   **Artigos**: Links para publicações no Medium.
-   **Contato**: Links para redes sociais e email.

Utilize a barra de navegação no topo (ou menu hambúrguer em mobile) para pular diretamente para as seções de interesse. O botão de tema permite alternar entre diferentes paletas de cores (se implementado).

## Build com Docker

O `Dockerfile` foi pensado para **compilar o projeto** em um ambiente isolado e gerar a pasta `dist/`. Nenhum servidor é iniciado dentro do container.

### Construir a imagem

```bash
docker build -t portfolio-builder:latest .
```

### Exportar os artefatos de build

```bash
docker create --name portfolio-build-temp portfolio-builder:latest
docker cp portfolio-build-temp:/app/dist ./dist
docker rm portfolio-build-temp
```

> Dica: se quiser evitar criar/remover containers manualmente, use ferramentas como `dive` ou `ctr` para inspecionar camadas e extrair a pasta `dist/`.

## CI/CD com GitHub Actions

O workflow [ci.yml](.github/workflows/ci.yml) valida e compila o projeto em pushes e Pull Requests para `master`. O [deploy.yml](.github/workflows/deploy.yml) publica a branch `master` por push ou execução manual, somente quando `MGC_DEPLOY_ENABLED` tem o valor `true`.

Em **Settings → Secrets and variables → Actions** do repositório, configure:

- Variáveis: `MGC_S3_ENDPOINT`, `MGC_REGION`, `MGC_BUCKET` e, após validar o ambiente, `MGC_DEPLOY_ENABLED=true`.
- Secrets: `MGC_ACCESS_KEY_ID` e `MGC_SECRET_ACCESS_KEY`, com o par de credenciais de Object Storage emitido pela Magalu Cloud.

Os nomes de credenciais `AWS_*` usados internamente pelo cliente S3 são apenas compatibilidade de protocolo. As credenciais e o endpoint devem ser da Magalu Cloud. O workflow não precisa de credenciais AWS nem invalida o CloudFront.

A credencial escolhida para a conta pessoal é `portfolio-github-actions`, com acesso total ao Object Storage e sem expiração, aprovada pelo titular para uso dedicado no GitHub Actions. Ela não é limitada ao bucket. Guarde o par S3 apenas nos secrets indicados, sem incluí-lo no código ou em variáveis Vite.

Consulte os detalhes em [.github/workflows/README.md](.github/workflows/README.md) e no [guia completo de migração](docs/deploy-magalu.md).

## Deploy e Publicação na Nuvem

O destino preparado para o site estático é:

```text
GoDaddy (registro do domínio)
  → Cloudflare (DNS, Worker e certificado HTTPS)
    → Magalu Cloud Object Storage (arquivos de dist/)
```

Essa arquitetura usa a Cloudflare como dependência para entrega e HTTPS de `sergionascimentojr.com` e `www.sergionascimentojr.com`, seguindo o [guia oficial da Magalu](https://docs.magalu.cloud/docs/storage/object-storage/use-cases/static-website/). O domínio continua registrado na GoDaddy e a zona já está ativa na conta Cloudflare de destino. Preserve os recursos anteriores até a validação final e durante o período de rollback.

Cada upload usa `--acl public-read`, preservando o controle do proprietário sobre o objeto. O bucket continua privado, sem listagem anônima; não é necessário criar Bucket Policy para esta configuração. Consulte as [ACLs oficiais da Magalu](https://docs.magalu.cloud/docs/storage/object-storage/how-to/permissions/acls-ht).

### Verificação local

```bash
npm ci
npm run test:deploy
npm run worker:check
npm run build
```

### Publicação

1. Confira o bucket privado e configure os secrets da Magalu Cloud conforme o [guia](docs/deploy-magalu.md).
2. Configure as variáveis do destino e publique o build com `python scripts/deploy-magalu.py`.
3. Defina `MGC_BUCKET_HOST` em [infra/cloudflare/wrangler.jsonc](infra/cloudflare/wrangler.jsonc), autentique com `npx wrangler login` e execute `npm run worker:deploy`.
4. Valide o endereço `workers.dev` e um subdomínio de teste na zona ativa. Depois siga o procedimento de corte para os dois domínios.
5. Ative `MGC_DEPLOY_ENABLED=true` no GitHub quando o destino estiver validado.

O deploy do Worker é manual. Os Custom Domains são configurados pelo painel da Cloudflare no momento do corte. O procedimento completo, incluindo DNS, HTTPS e recuperação, está em [docs/deploy-magalu.md](docs/deploy-magalu.md).

## Informações Adicionais

-   **Design Responsivo**: O layout se adapta a diferentes tamanhos de tela, desde desktops até dispositivos móveis.
-   **Performance**: Otimizado para carregamento rápido e interações fluidas.
-   **Customização**: As cores e temas podem ser ajustados através das variáveis CSS e configuração do Tailwind.
