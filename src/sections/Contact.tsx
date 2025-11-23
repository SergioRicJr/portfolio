import { SectionWrapper } from '../components/SectionWrapper';
import { useForm } from 'react-hook-form';
import { Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { socials } from '../data/socials';

export const Contact = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const onSubmit = async (data: any) => {
        console.log(data);
        // Simulate API call
        setStatus('success');
        setTimeout(() => {
            setStatus('idle');
            reset();
        }, 3000);
    };

    return (
        <SectionWrapper id="contact" className="bg-section-bg">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                <div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-text-primary">
                        Vamos <span className="text-gradient">Conversar?</span>
                    </h2>
                    <p className="text-text-secondary mb-8 leading-relaxed">
                        Estou sempre aberto a novos desafios e parcerias. Se você tem um projeto
                        em mente ou quer apenas trocar uma ideia sobre tecnologia, entre em contato.
                    </p>

                    <div className="space-y-6">
                        {socials.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 rounded-xl glass-panel group"
                            >
                                <div className="p-3 rounded-lg bg-dark-bg text-text-secondary group-hover:text-neon-cyan transition-colors">
                                    <social.icon size={20} />
                                </div>
                                <div>
                                    <div className="text-sm text-text-secondary">{social.name}</div>
                                    <div className="font-medium text-text-primary group-hover:text-neon-cyan transition-colors">
                                        {social.label}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8 rounded-2xl glass-panel">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Nome</label>
                        <input
                            {...register("name", { required: true })}
                            className="w-full px-4 py-3 rounded-lg bg-input-bg border border-input-border focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition-all text-text-primary placeholder:text-text-secondary/50"
                            placeholder="Seu nome"
                        />
                        {errors.name && <span className="text-red-500 text-xs mt-1">Campo obrigatório</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                        <input
                            {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                            className="w-full px-4 py-3 rounded-lg bg-input-bg border border-input-border focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition-all text-text-primary placeholder:text-text-secondary/50"
                            placeholder="seu@email.com"
                        />
                        {errors.email && <span className="text-red-500 text-xs mt-1">Email inválido</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Mensagem</label>
                        <textarea
                            {...register("message", { required: true })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg bg-input-bg border border-input-border focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none transition-all resize-none text-text-primary placeholder:text-text-secondary/50"
                            placeholder="Como posso ajudar?"
                        />
                        {errors.message && <span className="text-red-500 text-xs mt-1">Campo obrigatório</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-violet text-dark-bg font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'success' ? (
                            <>Enviado <CheckCircle size={20} /></>
                        ) : (
                            <>Enviar Mensagem <Send size={20} /></>
                        )}
                    </button>
                </form>
            </div>
        </SectionWrapper>
    );
};
