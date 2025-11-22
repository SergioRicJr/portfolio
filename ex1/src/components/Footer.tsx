import { socials } from '../data/socials';

export const Footer = () => {
    return (
        <footer className="bg-dark-bg border-t border-white/10 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-neon-violet/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-display font-bold text-xl mb-2">Sergio Nascimento Jr</h3>
                        <p className="text-text-secondary text-sm">Desenvolvedor BackEnd · Soluções Escaláveis</p>
                    </div>

                    <div className="flex gap-6">
                        {socials.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-secondary hover:text-neon-cyan transition-colors transform hover:scale-110"
                                aria-label={social.name}
                            >
                                <social.icon size={24} />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 text-center text-text-secondary text-sm">
                    <p>© {new Date().getFullYear()} Sergio Nascimento Jr. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};
