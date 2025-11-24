import { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ThemeSwitcher } from './ThemeSwitcher';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Sobre', to: 'about' },
        { name: 'Experiência', to: 'experience' },
        { name: 'Projetos', to: 'projects' },
        { name: 'Skills', to: 'skills' },
        { name: 'Artigos', to: 'articles' },
        { name: 'Contato', to: 'contact' },
    ];

    return (
        <nav className={clsx(
            "fixed top-0 w-full z-50 transition-all duration-300",
            scrolled ? "bg-dark-bg/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
        )}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="hero" smooth={true} duration={500} className="cursor-pointer flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-dark-bg font-bold text-xl group-hover:scale-110 transition-transform">
                        SN
                    </div>
                    {/* <span className="font-display font-bold text-xl tracking-wide hidden sm:block text-text-primary">
                        Sergio Nascimento<span className="text-neon-cyan">.</span>
                    </span> */}
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.to}
                            smooth={true}
                            duration={500}
                            offset={-100}
                            className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors text-sm font-medium uppercase tracking-wider hover:text-neon-cyan"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <ThemeSwitcher />
                    {/* <a
                        href="/cv.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 rounded-full bg-button-bg border border-button-border hover:bg-button-hover-bg hover:border-neon-cyan/50 transition-all text-sm font-medium text-text-primary"
                    >
                        CV
                    </a> */}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-text-primary"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 w-full bg-dark-bg/95 backdrop-blur-xl border-b border-white/10 py-8 md:hidden"
                    >
                        <div className="flex flex-col items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.to}
                                    smooth={true}
                                    duration={500}
                                    onClick={() => setIsOpen(false)}
                                    className="text-lg font-medium text-text-secondary hover:text-neon-cyan"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
