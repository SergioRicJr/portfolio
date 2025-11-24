# Portfólio Web

Este projeto é um portfólio pessoal interativo e moderno, desenvolvido para apresentar habilidades, projetos e experiências profissionais. O site apresenta um design responsivo com tema escuro/neon, animações suaves e elementos 3D interativos.

**🌐 Site em produção:** [https://sergionascimentojr.com](https://sergionascimentojr.com)

## Tabela de Conteúdos

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Requisitos para Uso](#requisitos-para-uso)
- [Instalação em Ambiente Local](#instalação-em-ambiente-local)
- [Como Iniciar](#como-iniciar)
- [Como Usar](#como-usar)
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
-   **React Scroll**: Para navegação suave entre as seções da página..

### Infraestrutura e Deploy

-   **Amazon S3**: Armazenamento estático para hospedagem do site.
-   **Amazon CloudFront**: CDN para distribuição global de conteúdo com baixa latência.
-   **AWS Certificate Manager (ACM)**: Gerenciamento de certificados SSL/TLS.
-   **Amazon Route 53**: Serviço de DNS para gerenciamento de domínio.
-   **GoDaddy**: Registro e gerenciamento inicial do domínio.

## Requisitos para Uso

Para rodar este projeto localmente, você precisará ter instalado em sua máquina:

-   **Node.js**: Versão 18 ou superior recomendada.
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

## Deploy e Publicação na Nuvem

Este projeto está hospedado na AWS utilizando uma arquitetura de site estático com domínio personalizado. O processo completo envolve a configuração de **GoDaddy + Route 53 + S3 + SSL (ACM) + CloudFront**.

### Visão Geral da Arquitetura

```
GoDaddy (Domínio) → Route 53 (DNS) → CloudFront (CDN) → S3 (Bucket)
                                      ↓
                                   ACM (SSL)
```

### Guia Completo de Configuração

#### ✅ 1. Configurar o Domínio no Route 53

**1.1 Criar uma Zona Hospedada**

- Serviço: **Route 53**
- Ação:
  - Criar uma **Hosted Zone** do tipo **Pública**.
  - Nome da zona: **sergionascimentojr.com**.
- Resultado: A AWS gera automaticamente quatro **Name Servers (NS)**.

**1.2 Configurar os Name Servers na GoDaddy**

1. Acessar o painel da GoDaddy.
2. Ir em **DNS** → **Servidores de Nome** → **Alterar servidores de nome**.
3. Selecionar **Usar meus próprios servidores de nome**.
4. Copiar e colar **exatamente os quatro NS** gerados pelo Route 53.
5. Salvar.

> **Importante:** A propagação pode levar até alguns minutos, mas normalmente é rápida.

#### ✅ 2. Criar o Bucket S3 para o Site Estático

- Serviço: **Amazon S3**
- Configurações:
  - **Nome do bucket:** `sergionascimentojr.com` *(precisa ser idêntico ao domínio)*
  - **Tipo:** Propósito geral.
  - **ACLs:** Desabilitadas.
  - **Bloqueio de acesso público:** *Bloquear todo acesso público*.
  - **Versionamento:** Desativado.
  - **Criptografia:** SSE-S3.

> ⚠️ *O acesso ao bucket permanecerá privado, pois o CloudFront fará a entrega do conteúdo.*

**Para fazer upload dos arquivos:**

1. Execute o build do projeto:
   ```bash
   npm run build
   ```

2. Faça upload do conteúdo da pasta `dist/` para o bucket S3.

#### ✅ 3. Solicitar Certificado SSL no ACM

- Serviço: **AWS Certificate Manager (ACM)**
  *(importante: o certificado **deve ser solicitado na região us-east-1** para uso no CloudFront).*

**Configurações:**

- Tipo: **Certificado Público**
- Nome: **sergionascimentojr.com**
- Exportação: Desabilitada
- Método de validação: **DNS Validation**
- Algoritmo da chave: **RSA 2048**

Após solicitar, o ACM fornecerá **um registro CNAME** contendo:
- Nome
- Valor

Esse registro precisa ser criado no Route 53.

#### ✅ 4. Validar o Domínio no Route 53 (CNAME)

- Serviço: **Route 53**
- Ação:
  - Criar um registro do tipo **CNAME**.
  - Nome: fornecido pelo ACM.
  - Valor: fornecido pelo ACM.

> Assim que o registro for validado, o certificado será automaticamente emitido.

#### ✅ 5. Criar Distribuição no CloudFront

- Serviço: **Amazon CloudFront**

**Principais configurações:**

**5.1 Origem**
- Tipo: **S3 origin**
- Selecionar o bucket **sergionascimentojr.com**
- Usar o endpoint de **Website** se estiver servindo páginas estáticas com redirecionamento interno.

**5.2 Comportamento do Viewer**
- Viewer protocol policy: **Redirect HTTP to HTTPS**

**5.3 Certificado SSL**
- Em **TLS Certificate**:
  - Selecionar o certificado do domínio emitido pelo ACM.

**5.4 Domínio personalizado**
- Em **Alternate Domain Names (CNAMEs)**:
  - Adicionar: **sergionascimentojr.com**

**5.5 Nome da distribuição**
- Opcional, mas recomendado: usar o nome do domínio.

#### ✅ 6. Criar Registro Final no Route 53 (Alias para CloudFront)

- Serviço: **Route 53**
- Ação:
  - Criar um registro do tipo **A (Address record)**.
  - Nome: **sergionascimentojr.com**
  - Habilitar **Alias**.
  - Selecionar:
    - **Alias to CloudFront distribution**
    - A distribuição criada no passo 5.

> Isso garante que o domínio aponte para o CloudFront, que entrega o conteúdo do S3 com HTTPS ativado.

#### ✅ 7. Teste Final

Após a propagação:

1. Acesse: [https://sergionascimentojr.com](https://sergionascimentojr.com)
2. O site deve:
   - Carregar via HTTPS
   - Exibir conteúdo hospedado no bucket S3
   - Ser entregue pelo CloudFront

### Processo de Deploy

Após configurar a infraestrutura inicial, para fazer deploy de atualizações:

1. **Build do projeto:**
   ```bash
   npm run build
   ```

2. **Upload para S3:**
   - Fazer upload do conteúdo da pasta `dist/` para o bucket S3.
   - Ou usar AWS CLI:
     ```bash
     aws s3 sync dist/ s3://sergionascimentojr.com --delete
     ```

3. **Invalidar cache do CloudFront (opcional):**
   - No console do CloudFront, criar uma invalidação para `/*` para garantir que as mudanças sejam refletidas imediatamente.

## Informações Adicionais

-   **Design Responsivo**: O layout se adapta a diferentes tamanhos de tela, desde desktops até dispositivos móveis.
-   **Performance**: Otimizado para carregamento rápido e interações fluidas.
-   **Customização**: As cores e temas podem ser ajustados através das variáveis CSS e configuração do Tailwind.
