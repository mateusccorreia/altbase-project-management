import { IProject, IDashboardStats } from '../types';

export function calculateStats(projects: IProject[]): IDashboardStats {
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

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'Concluído': return '#10B981';
        case 'Em Andamento': return '#3B82F6';
        case 'Atrasado': return '#EF4444';
        case 'Pausado': return '#F59E0B';
        case 'Não Iniciado': return '#6B7280';
        default: return '#6B7280';
    }
}

export function getProgressColor(progress: number): string {
    if (progress >= 80) return '#10B981';
    if (progress >= 50) return '#3B82F6';
    if (progress >= 25) return '#F59E0B';
    return '#EF4444';
}

export function getDaysRemaining(endDate: string): number {
    const end = new Date(endDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
