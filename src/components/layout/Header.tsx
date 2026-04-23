import React from 'react';
import { Activity, Menu } from 'lucide-react';

interface HeaderProps {
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
    user: { name: string; email: string; picture?: string };
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen, user }) => {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(now);

    return (
        <header className="h-16 bg-primary flex items-center justify-between px-6 sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors text-white ${isSidebarOpen ? 'hidden' : ''}`}
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
                        <Activity size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">
                            Gestão de Projetos
                        </h1>
                        <p className="text-xs text-white/90 font-bold hidden sm:block">Dashboard de Acompanhamento</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-none mb-1">{greeting}, {user.name.split(' ')[0]}!</p>
                    <p className="text-[10px] text-white/80 font-bold capitalize">{dateStr}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white/10">
                    {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    )}
                </div>
            </div>
        </header>
    );
};
