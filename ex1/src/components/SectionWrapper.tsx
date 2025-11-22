import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import type { ReactNode } from 'react';
import clsx from 'clsx';

interface SectionWrapperProps {
    children: ReactNode;
    id: string;
    className?: string;
}

export const SectionWrapper = ({ children, id, className }: SectionWrapperProps) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <section id={id} className={clsx("py-20 md:py-32 relative", className)}>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="container mx-auto px-6"
            >
                {children}
            </motion.div>
        </section>
    );
};
