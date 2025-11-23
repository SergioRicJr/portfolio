import { motion } from 'framer-motion';
import { ArrowRight, Download, ChevronDown } from 'lucide-react';
import { Link } from 'react-scroll';
import { ThreeBackground } from '../components/ThreeBackground';

export const Hero = () => {
    return (
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            <ThreeBackground />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight text-text-primary"
                    >
                        Sergio Nascimento <span className="text-gradient">Jr</span>
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto"
                    >
                        Desenvolvedor BackEnd focado em soluções <span className="text-text-primary font-semibold">escaláveis</span>, <span className="text-text-primary font-semibold">seguras</span> e <span className="text-text-primary font-semibold">observáveis</span>.
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                    >
                        <Link
                            to="contact"
                            smooth={true}
                            duration={500}
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet text-dark-bg font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all cursor-pointer flex items-center gap-2"
                        >
                            Vamos conversar <ArrowRight size={20} />
                        </Link>

                        <a
                            href="/cv.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 rounded-full bg-button-bg border border-button-border hover:bg-button-hover-bg hover:border-neon-cyan/50 transition-all font-medium flex items-center gap-2 text-text-primary"
                        >
                            Baixar CV <Download size={20} />
                        </a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="flex flex-wrap justify-center gap-4 text-sm text-text-secondary"
                    >
                        {['Python', 'Microsserviços', 'AWS/GCP', 'Observabilidade'].map((tech) => (
                            <span key={tech} className="px-4 py-2 rounded-lg bg-badge-bg border border-badge-border text-text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors">
                                {tech}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-text-secondary"
            >
                <ChevronDown size={24} />
            </motion.div>
        </section>
    );
};
