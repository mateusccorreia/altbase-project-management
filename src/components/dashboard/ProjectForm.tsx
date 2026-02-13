import React, { useState } from 'react';
import type { Project, ProjectStatus } from '../../types';
import { X, Save, Calendar, CheckSquare, DollarSign, User, MessageSquare } from 'lucide-react';

interface ProjectFormProps {
    initialData?: Partial<Project>;
    onSave: (project: Omit<Project, 'id'>) => void;
    onCancel: () => void;
}

const STATUS_OPTIONS: ProjectStatus[] = [
    'Não Iniciado',
    'Em Andamento',
    'Concluído',
    'Atrasado',
    'Pausado',
    'Verde',
    'Amarelo',
    'Vermelho'
];

export const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Project, 'id'>>({
        title: initialData?.title || '',
        coordinator: initialData?.coordinator || '',
        status: initialData?.status || 'Não Iniciado',
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
        endDate: initialData?.endDate || new Date().toISOString().split('T')[0],
        progress: initialData?.progress || 0,
        budgetCost: initialData?.budgetCost || 0,
        actualCost: initialData?.actualCost || 0,
        comments: initialData?.comments || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-elevated/50">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {initialData ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-surface-elevated rounded-full text-text-muted hover:text-text-primary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Title */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            Titulo do Projeto
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            placeholder="Digite o nome do projeto"
                        />
                    </div>

                    {/* Coordinator */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <User size={16} /> Coordenador
                        </label>
                        <select
                            name="coordinator"
                            required
                            value={formData.coordinator}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                        >
                            <option value="">Selecione um coordenador</option>
                            <option value="Darlan Castro">Darlan Castro</option>
                            <option value="João Edmilson">João Edmilson</option>
                            <option value="Larissa Ferreira">Larissa Ferreira</option>
                            <option value="Mateus Correia">Mateus Correia</option>
                            <option value="Patrícia Macedo">Patrícia Macedo</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <CheckSquare size={16} /> Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                        >
                            {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <Calendar size={16} /> Data Início
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            required
                            value={formData.startDate.split('T')[0]}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <Calendar size={16} /> Data Término
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            required
                            value={formData.endDate.split('T')[0]}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    {/* Budget Cost */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <DollarSign size={16} /> Custo Orçado
                        </label>
                        <input
                            type="number"
                            name="budgetCost"
                            min="0"
                            step="0.01"
                            required
                            value={formData.budgetCost}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    {/* Actual Cost */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <DollarSign size={16} /> Custo Realizado
                        </label>
                        <input
                            type="number"
                            name="actualCost"
                            min="0"
                            step="0.01"
                            required
                            value={formData.actualCost}
                            onChange={handleChange}
                            className="w-full h-10 px-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    {/* Progress */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex justify-between">
                            <span>Progresso (%)</span>
                            <span className="text-primary font-bold">{formData.progress}%</span>
                        </label>
                        <input
                            type="range"
                            name="progress"
                            min="0"
                            max="100"
                            value={formData.progress}
                            onChange={handleChange}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            style={{
                                background: `linear-gradient(to right, var(--color-primary, #F58746) 0%, var(--color-primary, #F58746) ${formData.progress}%, var(--color-surface-elevated, #334155) ${formData.progress}%, var(--color-surface-elevated, #334155) 100%)`
                            }}
                        />
                    </div>

                    {/* Comments */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <MessageSquare size={16} /> Comentários
                        </label>
                        <textarea
                            name="comments"
                            rows={4}
                            value={formData.comments}
                            onChange={handleChange}
                            className="w-full p-4 rounded-xl bg-surface-elevated border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                            placeholder="Adicione observações sobre o projeto..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl border border-border-subtle text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-all font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/25 transition-all font-medium flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Projeto
                    </button>
                </div>
            </form>
        </div>
    );
};
