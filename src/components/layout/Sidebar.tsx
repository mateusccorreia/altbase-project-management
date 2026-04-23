import React from 'react';
import {
    LayoutDashboard,
    FolderKanban,
    FileSpreadsheet,
    Settings,
    HelpCircle,
    Menu,
    CalendarDays,
    ClipboardList,
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activePage: string;
    onNavigate: (page: string) => void;
    user: { name: string; email: string; picture?: string };
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activePage, onNavigate, user, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projetos', icon: FolderKanban },
        { id: 'planning', label: 'Planejamento', icon: ClipboardList },
        { id: 'timeline', label: 'Criar timeline', icon: CalendarDays },
        { id: 'reports', label: 'Relatórios', icon: FileSpreadsheet },
    ];

    const bottomItems = [
        { label: 'Configurações', icon: Settings },
        { label: 'Ajuda', icon: HelpCircle },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed md:static inset-y-0 left-0 z-40
          bg-surface-card border-r border-border-subtle
          flex flex-col transform transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none w-64'}
        `}
            >
                {/* Logo area */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-border-subtle min-w-[16rem]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            <Settings size={20} />
                        </div>
                        <span className="font-bold text-lg text-text-primary tracking-tight">GR</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 px-3">
                        Menu
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    if (window.innerWidth < 768) onClose();
                                }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${activePage === item.id
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom items */}
                <div className="p-4 border-t border-border-subtle space-y-1">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-text-muted hover:bg-surface-elevated hover:text-text-secondary transition-all duration-200"
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-border-subtle mt-auto">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        {user.picture ? (
                            <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-border-subtle" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
                            <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                        <LogIn size={18} className="rotate-180" />
                        Sair da Conta
                    </button>
                </div>

                {/* MPP Info card */}
                <div className="p-4">
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary-dark/5 border border-primary/15 p-4">
                        <p className="text-xs font-semibold text-primary mb-1">Aviso de Privacidade</p>
                        <p className="text-xs text-text-muted leading-relaxed">
                            Em ambiente corporativo, lembre-se de não compartilhar dados sensíveis ou informações confidenciais para garantir a conformidade com as políticas da sua empresa.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
