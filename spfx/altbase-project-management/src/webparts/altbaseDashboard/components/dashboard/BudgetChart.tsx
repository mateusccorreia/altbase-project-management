import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import { IProject } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface IBudgetChartProps {
    projects: IProject[];
}

interface IBudgetChartState {
    isOpen: boolean;
}

export class BudgetChart extends React.Component<IBudgetChartProps, IBudgetChartState> {
    constructor(props: IBudgetChartProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public render(): React.ReactElement<IBudgetChartProps> {
        const { projects } = this.props;
        const { isOpen } = this.state;

        const withBudget = [...projects]
            .filter(p => p.budgetCost > 0)
            .sort((a, b) => b.budgetCost - a.budgetCost);

        const maxValue = Math.max(...withBudget.map(p => Math.max(p.budgetCost, p.actualCost)));

        return (
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <div>
                        <h3 className={styles.chartTitle}>Orçado vs Realizado</h3>
                        <p className={styles.chartSub}>Comparação de custos por projeto</p>
                    </div>
                    <button
                        onClick={() => this.setState({ isOpen: !isOpen })}
                        className={styles.toggleBtn}
                        title={isOpen ? 'Recolher' : 'Expandir'}
                    >
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                <div className={`${styles.chartBody} ${isOpen ? styles.chartBodyOpen : styles.chartBodyClosed}`}>
                    <div className={styles.budgetList}>
                        {withBudget.map(project => {
                            const budgetWidth = (project.budgetCost / maxValue) * 100;
                            const actualWidth = (project.actualCost / maxValue) * 100;
                            const isOverBudget = project.actualCost > project.budgetCost;

                            return (
                                <div key={project.id} className={styles.budgetItem}>
                                    <div className={styles.budgetMeta}>
                                        <p className={styles.budgetTitle} title={project.title}>
                                            {project.title}
                                        </p>
                                        <div className={styles.budgetPct}>{project.progress}%</div>
                                    </div>

                                    <div className={styles.budgetBar}>
                                        <div
                                            className={styles.budgetBarPlanned}
                                            style={{ width: `${budgetWidth}%` }}
                                        />
                                        <div
                                            className={`${styles.budgetBarActual} ${isOverBudget ? styles.budgetBarOver : styles.budgetBarOk}`}
                                            style={{ width: `${actualWidth}%` }}
                                        />
                                    </div>

                                    <div className={styles.budgetHover}>
                                        <span>Realizado: {formatCurrency(project.actualCost)}</span>
                                        <span>Orçado: {formatCurrency(project.budgetCost)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.chartLegend}>
                        <div className={styles.chartLegendItem}>
                            <div className={styles.chartLegendDot} style={{ background: 'rgba(59,130,246,0.3)' }} />
                            <span>Orçado</span>
                        </div>
                        <div className={styles.chartLegendItem}>
                            <div className={styles.chartLegendDot} style={{ background: '#10B981' }} />
                            <span>Realizado</span>
                        </div>
                        <div className={styles.chartLegendItem}>
                            <div className={styles.chartLegendDot} style={{ background: '#EF4444' }} />
                            <span>Acima do orçamento</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
