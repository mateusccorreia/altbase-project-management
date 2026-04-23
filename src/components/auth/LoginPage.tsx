import React, { useState, useEffect } from 'react';
import { LogIn, User, Mail, ShieldCheck, Chrome } from 'lucide-react';

interface LoginPageProps {
    onLogin: (userData: { name: string; email: string; picture?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const handleAction = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Simulação de Banco de Dados Local
        const usersDb = JSON.parse(localStorage.getItem('altbase_user_db') || '[]');

        if (isRegistering) {
            // Lógica de Cadastro
            const userExists = usersDb.find((u: any) => u.email === email);
            if (userExists) {
                setError('Este e-mail já está cadastrado neste navegador.');
                return;
            }
            
            const newUser = { name, email, password };
            usersDb.push(newUser);
            localStorage.setItem('altbase_user_db', JSON.stringify(usersDb));
            
            // Loga automaticamente após cadastrar
            onLogin(newUser);
        } else {
            // Lógica de Login
            const user = usersDb.find((u: any) => u.email === email && u.password === password);
            if (user) {
                onLogin(user);
            } else {
                setError('E-mail ou senha incorretos. Verifique se você já criou sua conta neste navegador.');
            }
        }
    };

    // Estrutura para Google Login (GSI)
    useEffect(() => {
        /* 
           Nota: Para o Google Login real funcionar, você precisa:
           1. Criar um projeto no Google Cloud Console
           2. Adicionar o seu domínio (github.io) na lista de autorizados
           3. Colocar o seu CLIENT_ID abaixo
        */
        const clientId = "SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
        
        // Simulação de carregamento do script do Google
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amp-lilac/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md animate-scale-in">
                <div className="bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-primary p-8 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="grid grid-cols-6 gap-2 p-2">
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
                                ))}
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-xl">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Projetos</h1>
                        <p className="text-white/80 text-sm mt-1">Acesso Restrito - Corporativo</p>
                    </div>

                    <div className="p-8">
                        <div className="flex bg-surface-elevated p-1 rounded-xl mb-8">
                            <button 
                                onClick={() => { setIsRegistering(false); setError(''); }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => { setIsRegistering(true); setError(''); }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-surface-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                            >
                                Criar Conta
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <p className="text-xs font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleAction} className="space-y-4">
                            {isRegistering && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-xs font-bold text-text-muted uppercase px-1">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                        <input 
                                            type="text" 
                                            required={isRegistering}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-11 pl-10 pr-4 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase px-1">EMAIL</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="email@dominio.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase px-1">Senha</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 mt-6"
                            >
                                <LogIn size={20} />
                                {isRegistering ? 'Cadastrar e Entrar' : 'Acessar Plataforma'}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-surface-elevated/50 border-t border-border-subtle text-center">
                        <p className="text-[10px] text-text-muted leading-relaxed">
                            <span className="text-red-500 font-bold block mb-1 uppercase tracking-wider">Atenção: Sistema 100% Local</span>
                            Seus projetos e timelines são salvos apenas neste navegador.<br />
                            Limpar o cache ou os dados do site <span className="font-bold">excluirá permanentemente</span> todas as suas informações.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
