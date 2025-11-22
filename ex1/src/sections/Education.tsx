import { SectionWrapper } from '../components/SectionWrapper';
import { education, certifications } from '../data/education';
import { GraduationCap, Award } from 'lucide-react';

export const Education = () => {
    return (
        <SectionWrapper id="education">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
                Educação & <span className="text-gradient">Certificações</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Education Column */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                        <GraduationCap className="text-neon-cyan" size={28} />
                        <h3 className="text-2xl font-bold text-text-primary">Formação</h3>
                    </div>

                    <div className="relative border-l border-white/10 ml-3 space-y-8 pl-8">
                        {education.map((edu) => (
                            <div key={edu.id} className="relative">
                                <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-dark-bg border-2 border-neon-cyan" />

                                <div className="mb-1 text-sm text-neon-cyan font-medium">{edu.period}</div>
                                <h4 className="text-lg font-bold text-text-primary">{edu.degree}</h4>
                                <div className="text-text-secondary text-sm mb-2">{edu.institution}</div>
                                <span className={`text-xs px-2 py-0.5 rounded border ${edu.status === 'Concluído'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {edu.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Certifications Column */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Award className="text-neon-magenta" size={28} />
                        <h3 className="text-2xl font-bold text-text-primary">Certificações</h3>
                    </div>

                    <div className="grid gap-4">
                        {certifications.map((cert) => (
                            <div
                                key={cert.id}
                                className="flex items-center gap-4 p-4 rounded-xl glass-panel"
                            >
                                <div className="p-3 rounded-lg bg-neon-magenta/10 text-neon-magenta">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary">{cert.name}</h4>
                                    <div className="text-sm text-text-secondary">
                                        {cert.issuer} · {cert.year}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
