import React from 'react';
import type { DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import {
    FolderKanban,
    CheckCircle2,
    Loader2,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    Wallet,
} from 'lucide-react';

interface StatsCardsProps {
    stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    const cards = [
        {
            label: 'Total Projetos',
            value: stats.totalProjects.toString(),
            icon: FolderKanban,
            color: 'from-blue-500 to-blue-700',
            iconBg: 'bg-blue-500/15',
            iconColor: 'text-blue-400',
        },
        {
            label: 'Concluídos',
            value: stats.completed.toString(),
            icon: CheckCircle2,
            color: 'from-emerald-500 to-emerald-700',
            iconBg: 'bg-emerald-500/15',
            iconColor: 'text-emerald-400',
        },
        {
            label: 'Em Andamento',
            value: stats.inProgress.toString(),
            icon: Loader2,
            color: 'from-sky-500 to-sky-700',
            iconBg: 'bg-sky-500/15',
            iconColor: 'text-sky-400',
        },
        {
            label: 'Atrasados',
            value: stats.delayed.toString(),
            icon: AlertTriangle,
            color: 'from-red-500 to-red-700',
            iconBg: 'bg-red-500/15',
            iconColor: 'text-red-400',
        },
        {
            label: 'Progresso Médio',
            value: `${stats.avgProgress}%`,
            icon: TrendingUp,
            color: 'from-violet-500 to-violet-700',
            iconBg: 'bg-violet-500/15',
            iconColor: 'text-violet-400',
        },
        {
            label: 'Orçamento Total',
            value: formatCurrency(stats.totalBudget),
            icon: DollarSign,
            color: 'from-amber-500 to-amber-700',
            iconBg: 'bg-amber-500/15',
            iconColor: 'text-amber-400',
            smallText: true,
        },
        {
            label: 'Custo Realizado',
            value: formatCurrency(stats.totalActualCost),
            icon: Wallet,
            color: 'from-primary to-primary-dark',
            iconBg: 'bg-primary/15',
            iconColor: 'text-primary-light',
            smallText: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className={`stat-card bg-surface-card rounded-2xl border border-border-subtle p-4 animate-slide-up stagger-${idx + 1}`}
                        style={{ animationFillMode: 'both' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                <Icon size={18} className={card.iconColor} />
                            </div>
                        </div>
                        <p className={`font-bold ${card.smallText ? 'text-lg' : 'text-2xl'} text-text-primary leading-tight`}>
                            {card.value}
                        </p>
                        <p className="text-xs text-text-muted mt-1 font-medium">{card.label}</p>
                    </div>
                );
            })}
        </div>
    );
};
