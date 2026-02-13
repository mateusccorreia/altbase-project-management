import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Project } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface BudgetChartProps {
    projects: Project[];
}

// BudgetChart.tsx
export const BudgetChart: React.FC<BudgetChartProps> = ({ projects }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Filter projects with any cost data and sort by largest cost (budget or actual)
    const withBudget = [...projects]
        .filter(p => p.budgetCost > 0 || p.actualCost > 0)
        .sort((a, b) => Math.max(b.budgetCost, b.actualCost) - Math.max(a.budgetCost, a.actualCost));



    return (
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-6 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Orçado vs Realizado</h3>
                    <p className="text-xs text-text-muted mt-0.5">Comparação detalhada de custos por projeto</p>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-primary"
                    title={isOpen ? 'Recolher' : 'Expandir'}
                >
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="space-y-6 overflow-y-auto pr-2 max-h-[500px] custom-scrollbar">
                    {withBudget.map(project => {
                        // Calculate max value specific to this project (either budget or actual, whichever is higher)
                        // This ensures the bars fill the available space for each project
                        const projectMax = Math.max(project.budgetCost, project.actualCost) || 1;

                        const budgetPct = (project.budgetCost / projectMax) * 100;
                        const actualPct = (project.actualCost / projectMax) * 100;
                        const isOverBudget = project.actualCost > project.budgetCost;

                        return (
                            <div key={project.id} className="pb-4 border-b border-border-subtle/30 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm text-text-primary truncate pr-4" title={project.title}>
                                        {project.title}
                                    </h4>
                                    {isOverBudget && (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-500/20">
                                            Extrapolado
                                        </span>
                                    )}
                                </div>

                                {/* Budget Row */}
                                <div className="flex items-center gap-3 mb-2 group">
                                    <div className="w-16 text-[11px] uppercase tracking-wide text-text-muted font-medium">Orçado</div>
                                    <div className="flex-1 h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500/40 rounded-full transition-all duration-500 group-hover:bg-blue-500/60"
                                            style={{ width: `${budgetPct}%` }}
                                        />
                                    </div>
                                    <div className="w-24 text-xs text-text-secondary text-right tabular-nums">
                                        {formatCurrency(project.budgetCost)}
                                    </div>
                                </div>

                                {/* Actual Row */}
                                <div className="flex items-center gap-3 group">
                                    <div className="w-16 text-[11px] uppercase tracking-wide text-text-muted font-medium">Realizado</div>
                                    <div className="flex-1 h-2.5 bg-surface-elevated rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500 group-hover:bg-emerald-400'}`}
                                            style={{ width: `${actualPct}%` }}
                                        />
                                    </div>
                                    <div className={`w-24 text-xs font-bold text-right tabular-nums ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {formatCurrency(project.actualCost)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 pt-4 border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500/40"></div>
                        <span className="text-xs text-text-secondary">Orçamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-text-secondary">Executado (No prazo)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-xs text-text-secondary">Executado (Extrapolado)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
