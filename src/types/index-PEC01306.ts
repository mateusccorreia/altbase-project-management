// Maps to SharePoint list "Base-Projetos-Grandes-Reparos"
export interface Project {
    id: number;
    title: string;            // Título
    coordinator: string;      // Coordenador do Projeto
    status: ProjectStatus;    // Status
    startDate: string;        // Dt. de Início (ISO)
    endDate: string;          // Dt. de Término (ISO)
    progress: number;         // Progresso (%) 0-100
    budgetCost: number;       // Custo Orçado
    actualCost: number;       // Custo Realizado
    comments: string;         // Comentários
}

export type ProjectStatus =
    | 'Não Iniciado'
    | 'Em Andamento'
    | 'Concluído'
    | 'Atrasado'
    | 'Pausado'
    | 'Verde'    // Mapped in UI
    | 'Vermelho' // Mapped in UI
    | 'Amarelo'; // Mapped in UI

export interface DashboardStats {
    totalProjects: number;
    completed: number;
    inProgress: number;
    delayed: number;
    avgProgress: number;
    totalBudget: number;
    totalActualCost: number;
}

// SharePoint field mappings (guesses based on standard encoding)
export const SP_FIELD_MAP = {
    title: 'Title',
    coordinator: 'Coordenador_x0020_do_x0020_Projeto',
    status: 'Status',
    startDate: 'Dt_x002e__x0020_de_x0020_In_x00ed_cio', // "Dt. de Início"
    endDate: 'Dt_x002e__x0020_de_x0020_T_x00e9_rmino',   // "Dt. de Término"
    progress: 'Progresso', // Often simplified, or 'Progresso_x0020__x0028__x0025__x0029_'
    budgetCost: 'Custo_x0020_Or_x00e7_ado',
    actualCost: 'Custo_x0020_Realizado',
    comments: 'Coment_x00e1_rios',
} as const;
