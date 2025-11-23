import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'blue', icon: Palette, label: 'Blue' },
    ] as const;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-button-bg border border-button-border hover:bg-button-hover-bg hover:border-neon-cyan/50 transition-all text-text-secondary hover:text-neon-cyan"
                aria-label="Toggle theme"
            >
                {theme === 'dark' && <Moon size={20} />}
                {theme === 'light' && <Sun size={20} />}
                {theme === 'blue' && <Palette size={20} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-32 py-2 rounded-xl bg-card-bg border border-border-color shadow-xl backdrop-blur-xl z-50"
                    >
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-button-bg transition-colors ${theme === t.id ? 'text-neon-cyan' : 'text-text-secondary'
                                    }`}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
