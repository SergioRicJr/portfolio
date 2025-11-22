import { SectionWrapper } from '../components/SectionWrapper';
import { Shield, Zap, Users } from 'lucide-react';

export const About = () => {
    const values = [
        {
            icon: Shield,
            title: "Qualidade",
            description: "Código limpo, testável e seguindo as melhores práticas (SOLID, Clean Arch)."
        },
        {
            icon: Zap,
            title: "Escalabilidade",
            description: "Sistemas projetados para crescer, com foco em performance e microsserviços."
        },
        {
            icon: Users,
            title: "Colaboração",
            description: "Comunicação clara, mentoria técnica e trabalho em equipe ágil."
        }
    ];

    return (
        <SectionWrapper id="about">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                        Sobre <span className="text-gradient">Mim</span>
                    </h2>
                    <div className="space-y-4 text-text-secondary leading-relaxed">
                        <p>
                            Sou um Desenvolvedor BackEnd apaixonado por criar arquiteturas robustas e eficientes.
                            Com experiência em Python, Microsserviços e Cloud, meu foco é entregar soluções que
                            não apenas funcionam, mas que são observáveis, seguras e fáceis de manter.
                        </p>
                        <p>
                            Tenho um perfil analítico forte e valorizo a qualidade de código acima de tudo.
                            Acredito que a tecnologia deve servir ao negócio de forma transparente e escalável.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {values.map((value, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-xl glass-panel group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-neon-cyan/10 text-neon-cyan group-hover:scale-110 transition-transform">
                                    <value.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1 text-text-primary">{value.title}</h3>
                                    <p className="text-sm text-text-secondary">{value.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};
