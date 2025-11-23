import { SectionWrapper } from '../components/SectionWrapper';
import { skills } from '../data/skills';
import clsx from 'clsx';

interface MarqueeRowProps {
    items: string[];
    direction?: 'left' | 'right';
    speed?: number;
}

const MarqueeRow = ({ items, direction = 'left', speed = 25 }: MarqueeRowProps) => {
    // Duplicate items to ensure they cover the screen width
    // 4x duplication is usually safe for wide screens
    const content = [...items, ...items, ...items, ...items];

    return (
        <div className="relative overflow-hidden flex select-none">
            {/* Track 1 */}
            <div
                className={clsx(
                    "flex gap-4 md:gap-8 pr-4 md:pr-8 flex-shrink-0",
                    direction === 'left' ? "animate-scroll-left" : "animate-scroll-right"
                )}
                style={{
                    animationDuration: `${speed}s`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                }}
            >
                {content.map((skill, index) => (
                    <div
                        key={`${direction}-1-${index}`}
                        className="flex-shrink-0 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full bg-button-bg border border-button-border text-text-primary font-medium text-xs md:text-sm whitespace-nowrap hover:bg-button-hover-bg hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors duration-300"
                    >
                        {skill}
                    </div>
                ))}
            </div>
            {/* Track 2 */}
            <div
                className={clsx(
                    "flex gap-4 md:gap-8 pr-4 md:pr-8 flex-shrink-0",
                    direction === 'left' ? "animate-scroll-left" : "animate-scroll-right"
                )}
                style={{
                    animationDuration: `${speed}s`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                }}
            >
                {content.map((skill, index) => (
                    <div
                        key={`${direction}-2-${index}`}
                        className="flex-shrink-0 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full bg-button-bg border border-button-border text-text-primary font-medium text-xs md:text-sm whitespace-nowrap hover:bg-button-hover-bg hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors duration-300"
                    >
                        {skill}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Skills = () => {
    // Coleta todos os itens de skills em uma lista única
    const allSkills = skills.flatMap(skillGroup =>
        skillGroup.items.map(item => item.name)
    );

    // Divide as skills em 4 grupos diferentes para cada linha
    const chunkSize = Math.ceil(allSkills.length / 4);
    const line1Skills = allSkills.slice(0, chunkSize);
    const line2Skills = allSkills.slice(chunkSize, chunkSize * 2);
    const line3Skills = allSkills.slice(chunkSize * 2, chunkSize * 3);
    const line4Skills = allSkills.slice(chunkSize * 3);

    return (
        <SectionWrapper id="skills" className="overflow-hidden">
            <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center text-text-primary">
                    Habilidades & <span className="text-gradient">Stack</span>
                </h2>

                <div className="space-y-10 md:space-y-12">
                    <MarqueeRow items={line1Skills} direction="left" speed={80} />
                    <MarqueeRow items={line2Skills} direction="right" speed={90} />
                    <MarqueeRow items={line3Skills} direction="left" speed={95} />
                    <MarqueeRow items={line4Skills} direction="right" speed={60} />
                </div>
            </div>

            <style>{`
                @keyframes scroll-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes scroll-right {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(0); }
                }
                .animate-scroll-left {
                    animation-name: scroll-left;
                }
                .animate-scroll-right {
                    animation-name: scroll-right;
                }
            `}</style>
        </SectionWrapper>
    );
};
