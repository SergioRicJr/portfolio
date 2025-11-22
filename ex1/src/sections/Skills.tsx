import { SectionWrapper } from '../components/SectionWrapper';
import { skills } from '../data/skills';
import { motion } from 'framer-motion';

export const Skills = () => {
    return (
        <SectionWrapper id="skills">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
                Habilidades & <span className="text-gradient">Stack</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.map((skillGroup, index) => (
                    <motion.div
                        key={skillGroup.category}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="p-6 rounded-xl glass-panel group"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-neon-magenta/10 text-neon-magenta">
                                <skillGroup.icon size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-text-primary">{skillGroup.category}</h3>
                        </div>

                        <div className="space-y-4">
                            {skillGroup.items.map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-secondary">{item.name}</span>
                                        <span className="text-text-secondary">{item.level}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${item.level}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </SectionWrapper>
    );
};
