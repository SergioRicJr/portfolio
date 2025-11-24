import { Code2, Server, Database, Cloud, Terminal, Shield, Activity, Layers, Box } from "lucide-react";

export const skills = [
    {
        category: "Linguagens",
        icon: Code2,
        items: [
            { name: "Python", level: 100 },
            { name: "Java", level: 100 },
            { name: "JavaScript/TypeScript", level: 100 }
        ]
    },
    {
        category: "Frameworks",
        icon: Layers,
        items: [
            { name: "FastAPI", level: 100 },
            { name: "Flask", level: 100 },
            { name: "Spring Boot", level: 100 },
            { name: "React", level: 100 },
            { name: "Next.js", level: 100 },
            { name: "Nest.js", level: 100 },
            { name: "Django", level: 100 },
            { name: "Django Rest Framework", level: 100 }
        ]
    },
    {
        category: "Arquiteturas",
        icon: Box,
        items: [
            { name: "Microsserviços", level: 100 },
            { name: "Clean Architecture", level: 100 },
            { name: "SOLID", level: 100 },
            { name: "Event-Driven", level: 100 },
            { name: "Domain Driven Design", level: 100 },
            { name: "Hexagonal Architecture", level: 100 },
            { name: "Design Patterns", level: 100 },
        ]
    },
    {
        category: "Cloud & Infra",
        icon: Cloud,
        items: [
            { name: "AWS", level: 100 },
            { name: "GCP", level: 100 },
            { name: "Terraform", level: 100 },
            { name: "Docker", level: 100 },
            { name: "Docker Compose", level: 100 },
            { name: "Kubernetes", level: 100 }
        ]
    },
    {
        category: "Observabilidade",
        icon: Activity,
        items: [
            { name: "Prometheus", level: 100 },
            { name: "Grafana", level: 100 },
            { name: "OpenTelemetry", level: 100 },
            { name: "Datadog", level: 100 },
        ]
    },
    {
        category: "Bancos de Dados",
        icon: Database,
        items: [
            { name: "PostgreSQL", level: 100 },
            { name: "MongoDB", level: 100 },
            { name: "Redis", level: 100 }
        ]
    },
    {
        category: "Mensageria",
        icon: Server,
        items: [
            { name: "Kafka", level: 100 },
            { name: "RabbitMQ", level: 100 },
            { name: "SQS/SNS", level: 100 }
        ]
    },
    {
        category: "DevOps",
        icon: Terminal,
        items: [
            { name: "CI/CD (GitHub Actions)", level: 100 },
            { name: "Git", level: 100 },
            { name: "Linux", level: 100 }
        ]
    },
    {
        category: "Qualidade",
        icon: Shield,
        items: [
            { name: "TDD", level: 100 },
            { name: "Pytest", level: 100 },
            { name: "SonarQube", level: 100 },
            { name: "Postman", level: 100 },
            { name: "Scrum", level: 100 },
            { name: "Swagger", level: 100 }
        ]
    }
];
