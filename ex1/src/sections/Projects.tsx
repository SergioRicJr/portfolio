import { SectionWrapper } from '../components/SectionWrapper';
import { projects } from '../data/projects';
import { Github, Activity } from 'lucide-react';

export const Projects = () => {
    return (
        <SectionWrapper id="projects" className="bg-black/20">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
                Projetos & <span className="text-gradient">Destaques</span>
            </h2>

            <div className="grid gap-12">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="group relative rounded-2xl glass-panel overflow-hidden"
                    >
                        <div className="grid md:grid-cols-2 gap-8 p-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-neon-violet/10 text-neon-violet">
                                        <Activity size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-text-primary">{project.title}</h3>
                                </div>

                                <p className="text-text-secondary leading-relaxed">
                                    {project.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag) => (
                                        <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-text-secondary border border-white/10">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {project.metrics.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                        {project.metrics.map((metric, i) => (
                                            <div key={i} className="text-sm font-medium text-neon-cyan">
                                                {metric}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-2">
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                                    >
                                        <Github size={18} />
                                        Ver Código
                                    </a>
                                </div>
                            </div>

                            <div className="relative h-64 md:h-auto rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/5 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(189,0,255,0.1)] transition-all">
                                {/* Placeholder for 3D Mockup or Image */}
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                                        <Activity className="text-gray-600" size={32} />
                                    </div>
                                    <p className="text-text-secondary text-sm">Visualização do Projeto</p>
                                </div>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
};
