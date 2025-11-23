export const projects = [
    {
        id: "observability-mtl",
        title: "Observability-mtl-instrument",
        description: "Biblioteca de instrumentação para observabilidade em microsserviços, facilitando a integração com OpenTelemetry, padronização (formatação) e envio de métricas, traces e logs, reduzindo boilerplate.",
        tags: ["Python", "OpenTelemetry", "Observability", "Grafana", "Prometheus"],
        metrics: ["-50% tempo de configuração", "Melhoria rastreabilidade"],
        image: "/assets/projects/observability.png",
        link: "https://github.com/SergioRicJr/observability-mtl-instrument",
        pypi: "https://pypi.org/project/observability-mtl-instrument/",
        featured: true
    },
    {
        id: "financialboost-api",
        title: "Financialboost API",
        description: "API financeira em Spring Boot responsável por autenticação JWT, categorias e transações com upload para S3. A infraestrutura roda em AWS (VPC, EC2, RDS, S3, IAM) com provisionamento automática via Terraform e deploy contínuo pelo GitHub Actions.",
        tags: ["Java", "Spring Boot", "AWS", "Terraform", "GitHub Actions"],
        metrics: ["Autenticação JWT", "Upload para S3", "Provisionamento automático", "Infraestrutura como Código (IaC)", "CI/CD Automatizado"],
        image: "/assets/projects/financialboost.png",
        link: "https://github.com/SergioRicJr/financial-boost",
        featured: true
    },
    {
        id: "sonar-and-github-bot",
        title: "Sonar e GitHub Bot",
        description: "Este bot foi desenvolvido para automatizar o processo de avaliação de repositórios. Ele utiliza a API do Github e o SonarQube para realizar análise aprofundada sobre diversos aspectos de qualidade do código.",
        tags: ["GitHub", "SonarQube", "Docker"],
        metrics: ["Automação de Code Review", "Análise de Qualidade Contínua", "Feedback Instantâneo"],
        image: "/assets/projects/sonar-and-github-bot.png",
        link: "https://github.com/SergioRicJr/sonar_and_github_bot",
        featured: true
    },
    {
        id: "visao_computacional",
        title: "Visão Computacional para plantas de engenharia",
        description: "O projeto foi feito com o intuíto de realizar a leitura de dados de vigas através de imagens, e gerar arquivos xslx para armazenar e organizar esses dados, automatizando um trabalho anteriormente manual.",
        tags: ["Python", "OpenCV", "Docker", "Tesseract", "Regex"],
        metrics: ["Automação de Processos Manuais", "Extração de Dados (OCR)", "Geração de Relatórios Excel"],
        image: "/assets/projects/visao_computacional.png",
        link: "https://github.com/SergioRicJr/visao_computacional",
        featured: true
    },


    {
        id: "placeholder-1",
        title: "Mais Projetos",
        description: "Explore todos os meus projetos, contribuições e estudos no meu perfil do GitHub.",
        tags: ["GitHub", "Open Source"],
        metrics: [],
        image: "",
        link: "https://github.com/SergioRicJr",
        featured: false
    }
];
