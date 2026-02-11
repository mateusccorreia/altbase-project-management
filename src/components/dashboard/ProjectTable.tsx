import React, { useState } from 'react';
import type { Project } from '../../types';
import { formatCurrency, formatDate, getStatusColor, getProgressColor, getDaysRemaining } from '../../utils/helpers';
import { ChevronDown, ChevronUp, MessageSquare, Calendar, Clock } from 'lucide-react';

interface ProjectTableProps {
    projects: Project[];
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects }) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof Project>('progress');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof Project) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sorted = [...projects].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDir === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    const SortIcon = ({ field }: { field: keyof Project }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const headerClass = "px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors select-none";

    return (
        <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Projetos em Acompanhamento</h3>
                <span className="text-xs text-text-muted bg-surface-elevated px-3 py-1 rounded-full">
                    {projects.length} projetos
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead>
                        <tr className="border-b border-border-subtle bg-surface-dark/50">
                            <th className={`${headerClass} text-left`} onClick={() => handleSort('title')}>
                                <span className="flex items-center gap-1">Projeto <SortIcon field="title" /></span>
                            </th>
                            <th className={`${headerClass} text-left`} onClick={() => handleSort('coordinator')}>
                                <span className="flex items-center gap-1">Coordenador <SortIcon field="coordinator" /></span>
                            </th>
                            <th className={`${headerClass} text-center`} onClick={() => handleSort('status')}>
                                <span className="flex items-center justify-center gap-1">Status <SortIcon field="status" /></span>
                            </th>
                            <th className={`${headerClass} text-center`} onClick={() => handleSort('startDate')}>
                                <span className="flex items-center justify-center gap-1">Início <SortIcon field="startDate" /></span>
                            </th>
                            <th className={`${headerClass} text-center`} onClick={() => handleSort('endDate')}>
                                <span className="flex items-center justify-center gap-1">Término <SortIcon field="endDate" /></span>
                            </th>
                            <th className={`${headerClass} text-center w-48`} onClick={() => handleSort('progress')}>
                                <span className="flex items-center justify-center gap-1">Progresso <SortIcon field="progress" /></span>
                            </th>
                            <th className={`${headerClass} text-right`} onClick={() => handleSort('budgetCost')}>
                                <span className="flex items-center justify-end gap-1">Orçado <SortIcon field="budgetCost" /></span>
                            </th>
                            <th className={`${headerClass} text-right`} onClick={() => handleSort('actualCost')}>
                                <span className="flex items-center justify-end gap-1">Realizado <SortIcon field="actualCost" /></span>
                            </th>
                            <th className={`${headerClass} text-center w-10`}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((project, idx) => {
                            const isExpanded = expandedId === project.id;
                            const daysRemaining = getDaysRemaining(project.endDate);
                            const costVariance = project.budgetCost > 0
                                ? ((project.actualCost / project.budgetCost) * 100)
                                : 0;
                            const isCostOver = costVariance > (project.progress + 10);

                            return (
                                <React.Fragment key={project.id}>
                                    <tr
                                        className={`project-row border-b border-border-subtle/50 animate-fade-in stagger-${Math.min(idx + 1, 10)}`}
                                        style={{ animationFillMode: 'both' }}
                                    >
                                        {/* Project Title */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm font-semibold text-text-primary leading-tight">{project.title}</p>
                                        </td>

                                        {/* Coordinator */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-secondary">
                                                    {project.coordinator.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <span className="text-sm text-text-secondary">{project.coordinator}</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(project.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                                                {project.status}
                                            </span>
                                        </td>

                                        {/* Start Date */}
                                        <td className="px-4 py-3.5 text-center text-sm text-text-secondary">
                                            {formatDate(project.startDate)}
                                        </td>

                                        {/* End Date */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="text-sm text-text-secondary">{formatDate(project.endDate)}</span>
                                            {project.status !== 'Concluído' && daysRemaining <= 30 && daysRemaining > 0 && (
                                                <p className="text-xs text-status-paused mt-0.5">{daysRemaining}d restantes</p>
                                            )}
                                            {project.status !== 'Concluído' && daysRemaining <= 0 && (
                                                <p className="text-xs text-status-delayed mt-0.5">Vencido</p>
                                            )}
                                        </td>

                                        {/* Progress */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full progress-bar-fill ${getProgressColor(project.progress)}`}
                                                        style={{ width: `${project.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-text-primary w-10 text-right">
                                                    {project.progress}%
                                                </span>
                                            </div>
                                        </td>

                                        {/* Budget Cost */}
                                        <td className="px-4 py-3.5 text-right text-sm text-text-secondary font-medium">
                                            {formatCurrency(project.budgetCost)}
                                        </td>

                                        {/* Actual Cost */}
                                        <td className="px-4 py-3.5 text-right">
                                            <span className={`text-sm font-medium ${isCostOver ? 'text-status-delayed' : 'text-text-secondary'}`}>
                                                {formatCurrency(project.actualCost)}
                                            </span>
                                        </td>

                                        {/* Expand */}
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                                                className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-secondary"
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded row */}
                                    {isExpanded && (
                                        <tr className="bg-surface-dark/30 animate-fade-in">
                                            <td colSpan={9} className="px-6 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Comments */}
                                                    <div className="md:col-span-2 flex gap-3">
                                                        <MessageSquare size={16} className="text-text-muted mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-semibold text-text-muted uppercase mb-1">Comentários</p>
                                                            <p className="text-sm text-text-secondary leading-relaxed">{project.comments || 'Sem comentários.'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Timeline info */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-text-muted" />
                                                            <span className="text-xs text-text-muted">Duração:</span>
                                                            <span className="text-xs text-text-secondary font-medium">
                                                                {formatDate(project.startDate)} → {formatDate(project.endDate)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-text-muted" />
                                                            <span className="text-xs text-text-muted">Variação Custo:</span>
                                                            <span className={`text-xs font-bold ${isCostOver ? 'text-status-delayed' : 'text-status-complete'}`}>
                                                                {costVariance.toFixed(0)}% do orçamento utilizado
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
