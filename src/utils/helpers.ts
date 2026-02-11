import type { Project, DashboardStats } from '../types';

/**
 * Calculate dashboard statistics from project list.
 */
export function calculateStats(projects: Project[]): DashboardStats {
    const totalProjects = projects.length;
    const completed = projects.filter(p => p.status === 'Concluído').length;
    const inProgress = projects.filter(p => p.status === 'Em Andamento').length;
    const delayed = projects.filter(p => p.status === 'Atrasado').length;
    const avgProgress = totalProjects > 0
        ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects)
        : 0;
    const totalBudget = projects.reduce((acc, p) => acc + p.budgetCost, 0);
    const totalActualCost = projects.reduce((acc, p) => acc + p.actualCost, 0);

    return { totalProjects, completed, inProgress, delayed, avgProgress, totalBudget, totalActualCost };
}

/**
 * Format currency in BRL.
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format a date string to pt-BR format.
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

/**
 * Get the color class for a given status.
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'Concluído': return 'bg-status-complete';
        case 'Em Andamento': return 'bg-status-progress';
        case 'Atrasado': return 'bg-status-delayed';
        case 'Pausado': return 'bg-status-paused';
        case 'Não Iniciado': return 'bg-status-notstarted';
        default: return 'bg-gray-500';
    }
}

/**
 * Get the text color for a given status.
 */
export function getStatusTextColor(status: string): string {
    switch (status) {
        case 'Concluído': return 'text-status-complete';
        case 'Em Andamento': return 'text-status-progress';
        case 'Atrasado': return 'text-status-delayed';
        case 'Pausado': return 'text-status-paused';
        case 'Não Iniciado': return 'text-status-notstarted';
        default: return 'text-gray-500';
    }
}

/**
 * Get progress bar color based on value.
 */
export function getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-status-complete';
    if (progress >= 50) return 'bg-status-progress';
    if (progress >= 25) return 'bg-status-paused';
    return 'bg-status-delayed';
}

/**
 * Calculate days remaining until end date.
 */
export function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
