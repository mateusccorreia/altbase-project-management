import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import { IProject } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface IStatusChartProps {
    projects: IProject[];
}

interface IStatusChartState {
    isOpen: boolean;
}

export class StatusChart extends React.Component<IStatusChartProps, IStatusChartState> {
    constructor(props: IStatusChartProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public render(): React.ReactElement<IStatusChartProps> {
        const { projects } = this.props;
        const { isOpen } = this.state;

        const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        const total = projects.length;

        const statusInfo = [
            { label: 'Concluído', color: '#10B981' },
            { label: 'Em Andamento', color: '#3B82F6' },
            { label: 'Atrasado', color: '#EF4444' },
            { label: 'Pausado', color: '#F59E0B' },
            { label: 'Não Iniciado', color: '#6B7280' },
        ].filter(s => statusCounts[s.label]);

        const segments = statusInfo.map(s => ({
            ...s,
            count: statusCounts[s.label] || 0,
            percentage: ((statusCounts[s.label] || 0) / total) * 100,
        }));

        const radius = 60;
        const circumference = 2 * Math.PI * radius;
        let cumulative = 0;

        return (
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Distribuição por Status</h3>
                    <button
                        onClick={() => this.setState({ isOpen: !isOpen })}
                        className={styles.toggleBtn}
                        title={isOpen ? 'Recolher' : 'Expandir'}
                    >
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                <div className={`${styles.chartBody} ${isOpen ? styles.chartBodyOpen : styles.chartBodyClosed}`}>
                    <div className={styles.donutContainer}>
                        <div className={styles.donutWrapper}>
                            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                                {segments.map((seg) => {
                                    const segLength = (seg.percentage / 100) * circumference;
                                    const offset = circumference - (cumulative / 100) * circumference;
                                    cumulative += seg.percentage;

                                    return (
                                        <circle
                                            key={seg.label}
                                            cx="80"
                                            cy="80"
                                            r={radius}
                                            fill="none"
                                            stroke={seg.color}
                                            strokeWidth="20"
                                            strokeDasharray={`${segLength} ${circumference - segLength}`}
                                            strokeDashoffset={offset}
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
                            </svg>
                            <div className={styles.donutCenter}>
                                <span className={styles.donutValue}>{total}</span>
                                <span className={styles.donutLabel}>projetos</span>
                            </div>
                        </div>

                        <div className={styles.legendList}>
                            {segments.map(seg => (
                                <div key={seg.label} className={styles.legendItem}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div className={styles.legendDot} style={{ background: seg.color }} />
                                        <span className={styles.legendLabel}>{seg.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className={styles.legendValue}>{seg.count}</span>
                                        <span className={styles.legendPct}>({seg.percentage.toFixed(0)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
