import { SectionWrapper } from '../components/SectionWrapper';
import { experience } from '../data/experience';
import { Calendar, Briefcase } from 'lucide-react';

export const Experience = () => {
    return (
        <SectionWrapper id="experience" className="bg-black/20">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
                Experiência <span className="text-gradient">Profissional</span>
            </h2>

            <div className="relative max-w-3xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan via-neon-violet to-transparent md:-translate-x-1/2" />

                <div className="space-y-12">
                    {experience.map((job, index) => (
                        <div key={job.id} className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                            {/* Timeline Dot */}
                            <div className="absolute left-[-4px] md:left-1/2 top-0 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#00f3ff] md:-translate-x-1/2 translate-y-2" />

                            {/* Content */}
                            <div className="ml-6 md:ml-0 md:w-1/2">
                                <div className={`p-6 rounded-xl glass-panel group ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                    <div className={`flex items-center gap-2 text-neon-cyan text-sm mb-2 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                                        <Calendar size={14} />
                                        <span>{job.period}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-neon-cyan transition-colors">
                                        {job.role}
                                    </h3>

                                    <div className={`flex items-center gap-2 text-text-secondary text-sm mb-4 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                                        <Briefcase size={14} />
                                        <span>{job.company}</span>
                                    </div>

                                    <p className="text-text-secondary text-sm mb-4 leading-relaxed">
                                        {job.description}
                                    </p>

                                    <div className={`flex flex-wrap gap-2 ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                                        {job.metrics.map((metric, i) => (
                                            <span key={i} className="px-2 py-1 rounded text-xs bg-neon-violet/10 text-neon-violet border border-neon-violet/20">
                                                {metric}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};
