# Portfólio Web

Este projeto é um portfólio pessoal interativo e moderno, desenvolvido para apresentar habilidades, projetos e experiências profissionais. O site apresenta um design responsivo com tema escuro/neon, animações suaves e elementos 3D interativos.

## Tabela de Conteúdos

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Requisitos para Uso](#requisitos-para-uso)
- [Instalação em Ambiente Local](#instalação-em-ambiente-local)
- [Como Iniciar](#como-iniciar)
- [Como Usar](#como-usar)
- [Informações Adicionais](#informações-adicionais)

## Tecnologias Utilizadas

O projeto foi construído utilizando uma stack moderna de desenvolvimento web:

-   **React**: Biblioteca JavaScript para construção de interfaces de usuário.
-   **TypeScript**: Superset tipado de JavaScript para maior segurança e escalabilidade.
-   **Vite**: Build tool rápida para desenvolvimento frontend moderno.
-   **Tailwind CSS**: Framework CSS utility-first para estilização rápida e responsiva.
-   **Framer Motion**: Biblioteca para animações declarativas e gestos.
-   **Three.js / @react-three/fiber**: Renderização de gráficos 3D e efeitos visuais (background de partículas).
-   **Lucide React**: Biblioteca de ícones leve e consistente.
-   **React Scroll**: Para navegação suave entre as seções da página.

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

## Informações Adicionais

-   **Design Responsivo**: O layout se adapta a diferentes tamanhos de tela, desde desktops até dispositivos móveis.
-   **Performance**: Otimizado para carregamento rápido e interações fluidas.
-   **Customização**: As cores e temas podem ser ajustados através das variáveis CSS e configuração do Tailwind.
