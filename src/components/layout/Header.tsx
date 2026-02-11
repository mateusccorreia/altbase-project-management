import React from 'react';
import { Activity, Menu } from 'lucide-react';

interface HeaderProps {
    onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
    const dateStr = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(now);

    return (
        <header className="h-16 glass flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="md:hidden p-2 rounded-lg hover:bg-surface-elevated transition-colors text-text-secondary"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg">
                        <Activity size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-text-primary leading-tight">
                            Grandes Reparos
                        </h1>
                        <p className="text-xs text-text-muted hidden sm:block">Dashboard de Acompanhamento</p>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <p className="text-sm font-medium text-text-primary">{greeting}!</p>
                <p className="text-xs text-text-muted capitalize">{dateStr}</p>
            </div>
        </header>
    );
};
