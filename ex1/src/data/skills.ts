import { Code2, Server, Database, Cloud, Terminal, Shield, Activity, Layers, Box } from "lucide-react";

export const skills = [
    {
        category: "Linguagens",
        icon: Code2,
        items: [
            { name: "Python", level: 95 },
            { name: "Java", level: 85 },
            { name: "JavaScript/TypeScript", level: 80 },
            { name: "Go", level: 70 }
        ]
    },
    {
        category: "Frameworks",
        icon: Layers,
        items: [
            { name: "FastAPI", level: 95 },
            { name: "Flask", level: 90 },
            { name: "Spring Boot", level: 85 },
            { name: "React", level: 75 }
        ]
    },
    {
        category: "Arquiteturas",
        icon: Box,
        items: [
            { name: "Microsserviços", level: 90 },
            { name: "Clean Architecture", level: 90 },
            { name: "SOLID", level: 95 },
            { name: "Event-Driven", level: 85 }
        ]
    },
    {
        category: "Cloud & Infra",
        icon: Cloud,
        items: [
            { name: "AWS", level: 85 },
            { name: "GCP", level: 80 },
            { name: "Terraform", level: 75 },
            { name: "Docker/K8s", level: 85 }
        ]
    },
    {
        category: "Observabilidade",
        icon: Activity,
        items: [
            { name: "Prometheus", level: 85 },
            { name: "Grafana", level: 85 },
            { name: "OpenTelemetry", level: 80 },
            { name: "ELK Stack", level: 75 }
        ]
    },
    {
        category: "Bancos de Dados",
        icon: Database,
        items: [
            { name: "PostgreSQL", level: 90 },
            { name: "MongoDB", level: 85 },
            { name: "Redis", level: 80 },
            { name: "DynamoDB", level: 75 }
        ]
    },
    {
        category: "Mensageria",
        icon: Server,
        items: [
            { name: "Kafka", level: 85 },
            { name: "RabbitMQ", level: 85 },
            { name: "SQS/SNS", level: 80 }
        ]
    },
    {
        category: "DevOps",
        icon: Terminal,
        items: [
            { name: "CI/CD (GitHub Actions)", level: 85 },
            { name: "Git", level: 95 },
            { name: "Linux", level: 85 }
        ]
    },
    {
        category: "Qualidade",
        icon: Shield,
        items: [
            { name: "TDD", level: 90 },
            { name: "Pytest", level: 90 },
            { name: "SonarQube", level: 80 }
        ]
    }
];
