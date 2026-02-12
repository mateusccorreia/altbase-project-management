export type Status =
    | 'Concluído' | 'Em Andamento' | 'Atrasado' | 'Pausado' | 'Não Iniciado' // Português
    | 'Done' | 'Working on it' | 'Stuck' | 'Not Started'; // Inglês (usado no mockData)

export interface Project {
    id: string;
    title: string;
    coordinator: string;
    status: Status;
    priority: 'High' | 'Medium' | 'Low' | 'Alto' | 'Médio' | 'Baixo'; // Mix de EN/PT para compatibilidade
    startDate: string;      // ISO Date string
    endDate: string;        // ISO Date string
    progress: number;       // 0-100
    budgetCost: number;     // Orçamento planejado
    actualCost: number;     // Custo real até agora
    description?: string;
}

export interface ProjectTask {
    id: string;
    title: string;
    owner: string;
    status: Status;
    priority: 'High' | 'Medium' | 'Low';
    timelineStart: string; // ISO Date
    timelineEnd: string;   // ISO Date
    progress: number;      // 0-100
}

export interface ProjectGroup {
    id: string;
    title: string;
    color: string;
    tasks: ProjectTask[];
}

export interface DashboardStats {
    totalProjects: number;
    completed: number;
    inProgress: number;
    delayed: number;
    avgProgress: number;
    totalBudget: number;
    totalActualCost: number;
}
