import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import { IDashboardStats } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { FolderKanban, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export interface IStatsCardsProps {
    stats: IDashboardStats;
}

export class StatsCards extends React.Component<IStatsCardsProps, {}> {
    public render(): React.ReactElement<IStatsCardsProps> {
        const { stats } = this.props;

        const cards = [
            {
                label: 'Total de Projetos',
                value: stats.totalProjects,
                sub: `${stats.avgProgress}% progresso médio`,
                icon: FolderKanban,
                color: '#F58746',
                bg: 'rgba(245,135,70,0.1)',
            },
            {
                label: 'Concluídos',
                value: stats.completed,
                sub: `de ${stats.totalProjects} projetos`,
                icon: CheckCircle,
                color: '#10B981',
                bg: 'rgba(16,185,129,0.1)',
            },
            {
                label: 'Em Andamento',
                value: stats.inProgress,
                sub: 'projetos ativos',
                icon: Clock,
                color: '#3B82F6',
                bg: 'rgba(59,130,246,0.1)',
            },
            {
                label: 'Atrasados',
                value: stats.delayed,
                sub: `Orçamento total: ${formatCurrency(stats.totalBudget)}`,
                icon: AlertTriangle,
                color: '#EF4444',
                bg: 'rgba(239,68,68,0.1)',
            },
        ];

        return (
            <div className={styles.statsGrid}>
                {cards.map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <span className={styles.statLabel}>{card.label}</span>
                                <div
                                    className={styles.statIcon}
                                    style={{ background: card.bg, color: card.color }}
                                >
                                    <Icon size={18} />
                                </div>
                            </div>
                            <div className={styles.statValue} style={{ color: card.color }}>
                                {card.value}
                            </div>
                            <p className={styles.statSub}>{card.sub}</p>
                        </div>
                    );
                })}
            </div>
        );
    }
}
