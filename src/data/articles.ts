export interface Article {
    id: string;
    title: string;
    description: string;
    tags: string[];
    link: string;
    platform: string;
    date?: string;
}

export const articles: Article[] = [
    {
        id: "article-1",
        title: "Microserviços: Arquitetura e Melhores Práticas",
        description: "Explorando os conceitos fundamentais de arquitetura de microserviços, padrões de comunicação e estratégias para escalabilidade.",
        tags: ["Arquitetura", "Microserviços", "Backend"],
        link: "https://medium.com/@seu-usuario/artigo-exemplo",
        platform: "Medium",
        date: "2024-01-15"
    },
    {
        id: "article-2",
        title: "Observabilidade em Sistemas Distribuídos",
        description: "Como implementar observabilidade eficaz usando OpenTelemetry, métricas, logs e traces para sistemas distribuídos.",
        tags: ["Observabilidade", "OpenTelemetry", "DevOps"],
        link: "https://dev.to/seu-usuario/artigo-exemplo",
        platform: "Dev.to",
        date: "2024-02-20"
    }
];

