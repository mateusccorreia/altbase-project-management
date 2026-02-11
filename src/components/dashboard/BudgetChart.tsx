import React from 'react';
import type { Project } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BudgetChartProps {
    projects: Project[];
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ projects }) => {
    // Only show projects with budget > 0, sorted by budget
    const withBudget = [...projects]
        .filter(p => p.budgetCost > 0)
        .sort((a, b) => b.budgetCost - a.budgetCost);

    const maxValue = Math.max(...withBudget.map(p => Math.max(p.budgetCost, p.actualCost)));

    return (
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-6 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
            <h3 className="text-lg font-bold text-text-primary mb-2">Orçado vs Realizado</h3>
            <p className="text-xs text-text-muted mb-5">Comparação de custos por projeto</p>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {withBudget.map(project => {
                    const budgetWidth = (project.budgetCost / maxValue) * 100;
                    const actualWidth = (project.actualCost / maxValue) * 100;
                    const isOverBudget = project.actualCost > project.budgetCost;

                    return (
                        <div key={project.id} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-medium text-text-secondary truncate max-w-[60%]" title={project.title}>
                                    {project.title}
                                </p>
                                <div className="text-xs text-text-muted">
                                    {project.progress}%
                                </div>
                            </div>

                            {/* Budget bar (Planned) */}
                            <div className="relative h-3 bg-surface-elevated rounded-full overflow-hidden mb-1">
                                <div
                                    className="absolute h-full bg-blue-500/30 rounded-full progress-bar-fill"
                                    style={{ width: `${budgetWidth}%` }}
                                />
                                <div
                                    className={`absolute h-full rounded-full progress-bar-fill ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${actualWidth}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Realizado: {formatCurrency(project.actualCost)}</span>
                                <span>Orçado: {formatCurrency(project.budgetCost)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500/30"></div>
                    <span className="text-xs text-text-muted">Orçado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                    <span className="text-xs text-text-muted">Realizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                    <span className="text-xs text-text-muted">Acima do orçamento</span>
                </div>
            </div>
        </div>
    );
};
