import { SectionWrapper } from '../components/SectionWrapper';
import { articles } from '../data/articles';
import { ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Articles = () => {
    // const formatDate = (date?: string) => {
    //     if (!date) return '';
    //     return new Date(date).toLocaleDateString('pt-BR', {
    //         year: 'numeric',
    //         month: 'long'
    //     });
    // };

    return (
        <SectionWrapper id="articles" className="bg-section-bg">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center text-text-primary">
                Artigos & <span className="text-gradient">Publicações</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 
                {articles.map((article) => (
                    <div
                        key={article.id}
                        className="group relative rounded-xl glass-panel overflow-hidden hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] transition-all"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-icon-bg text-icon-color group-hover:scale-110 transition-transform">
                                    <BookOpen size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-neon-cyan transition-colors line-clamp-2">
                                        {article.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                                        <Calendar size={12} />
                                        {article.date && <span>{formatDate(article.date)}</span>}
                                        {article.date && <span className="text-metric-text">·</span>}
                                        <span className="text-metric-text">{article.platform}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                                {article.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {article.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-1 rounded text-xs bg-metric-bg text-metric-text border border-metric-border">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-bg border border-button-border hover:bg-button-hover-bg hover:border-neon-cyan/50 transition-all text-sm font-medium text-text-primary group/link"
                            >
                                <span>Ler Artigo</span>
                                <ExternalLink size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                ))} 
                */}

                {/* Card "Em Breve" */}
                <div className="group relative rounded-xl glass-panel overflow-hidden border border-white/5 hover:border-neon-cyan/30 transition-all">
                    <div className="p-6 space-y-4 flex flex-col items-center justify-center min-h-[300px] text-center">
                        <div className="p-4 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles size={32} className="text-text-secondary group-hover:text-neon-cyan transition-colors" />
                        </div>

                        <h3 className="text-xl font-bold text-text-primary mb-2">
                            Em breve mais artigos
                        </h3>

                        <p className="text-text-secondary text-sm leading-relaxed max-w-[250px]">
                            Estou preparando novos conteúdos sobre desenvolvimento, arquitetura e tecnologia.
                        </p>
                    </div>
                </div>

                {/* Card "Em Breve" - Criativo e Animado */}
                <motion.a
                    href="https://medium.com/@sergioricjr7"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: articles.length * 0.1 }}
                    className="group relative rounded-xl glass-panel overflow-hidden border-2 border-dashed border-neon-cyan/30 hover:border-neon-cyan/60 transition-all hover:shadow-[0_0_30px_rgba(0,243,255,0.2)] cursor-pointer block"
                >
                    <div className="p-6 space-y-4 flex flex-col items-center justify-center min-h-[100%] text-center relative">
                        {/* Efeito de brilho animado */}
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                            className="relative mb-4"
                        >
                            <div className="p-4 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-sm">
                                <Sparkles size={32} className="text-neon-cyan" />
                            </div>
                            {/* Partículas flutuantes ao redor do ícone */}
                            <motion.div
                                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-neon-cyan/60 blur-sm"
                            />
                            <motion.div
                                animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                                className="absolute -bottom-2 -left-2 w-2 h-2 rounded-full bg-neon-violet/60 blur-sm"
                            />
                            <motion.div
                                animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
                                className="absolute top-1/2 -left-3 w-1.5 h-1.5 rounded-full bg-neon-cyan/40 blur-sm"
                            />
                        </motion.div>

                        <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-neon-cyan transition-colors">
                            Mais Artigos
                        </h3>

                        <p className="text-text-secondary text-sm leading-relaxed max-w-[200px]">
                            Confira meus artigos no Medium!
                        </p>

                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-bg border border-button-border hover:bg-button-hover-bg hover:border-neon-cyan/50 transition-all text-sm font-medium text-text-primary mt-3 group/link">
                            <span>Ver no Medium</span>
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="group-hover/link:translate-x-1 transition-transform"
                            >
                                <ExternalLink size={14} />
                            </motion.div>
                        </div>

                        {/* Efeito de brilho pulsante */}
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
                        />
                    </div>
                </motion.a>
            </div>
        </SectionWrapper>
    );
};

