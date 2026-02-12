import type { Project } from '../types';

export const mockProjectData: Project[] = [
    {
        id: 'p1',
        title: 'Expansão Alto Forno 3',
        coordinator: 'Carlos Mendes',
        status: 'Em Andamento', // Status em PT
        priority: 'Alto',
        startDate: '2026-01-15',
        endDate: '2026-12-20',
        progress: 35,
        budgetCost: 15000000,
        actualCost: 5200000,
        description: 'Reforma estrutural e expansão da capacidade produtiva.'
    },
    {
        id: 'p2',
        title: 'Modernização Laminação',
        coordinator: 'Fernanda Lima',
        status: 'Atrasado',
        priority: 'Médio',
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        progress: 15,
        budgetCost: 8500000,
        actualCost: 2100000,
        description: 'Substituição de PLC e sensores da linha.'
    },
    {
        id: 'p3',
        title: 'Manutenção Preventiva Geral',
        coordinator: 'Roberto Silva',
        status: 'Não Iniciado',
        priority: 'Baixo',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        progress: 0,
        budgetCost: 500000,
        actualCost: 0,
        description: 'Parada anual para manutenção.'
    },
    {
        id: 'p4',
        title: 'Projeto Sustentabilidade - Água',
        coordinator: 'Ana Costa',
        status: 'Concluído',
        priority: 'Alto',
        startDate: '2025-08-01',
        endDate: '2026-01-30',
        progress: 100,
        budgetCost: 3200000,
        actualCost: 3150000,
        description: 'Sistema de reuso de água industrial.'
    }
];
