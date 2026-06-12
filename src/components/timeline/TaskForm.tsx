import React, { useState } from 'react';
import { Plus, X, Save, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { TimelineTask } from '../../types';

interface TaskFormProps {
    onSave: (tasks: TimelineTask[]) => void;
    onCancel: () => void;
    projects: string[];
    existingTasks: TimelineTask[];
    taskToEdit?: TimelineTask;
    initialProject?: string;
    initialCompany?: string;
}

interface ActivityEntry {
    tempId: string;
    activity: string;
    duration: number;
    predecessor: string;
    isCompleted: boolean;
    color?: string;
}

const DEFAULT_DURATION_HOURS = 8;
const HOUR_IN_MS = 60 * 60 * 1000;

const PREDEFINED_COLORS = [
    'bg-amp-orange', 'bg-amp-lilac', 'bg-amp-red', 'bg-amp-orange-2',
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-amber-500', 'bg-slate-500'
];

const formatLocalDateTime = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getRoundedCurrentHour = () => {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    return date;
};

const getDurationHours = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.round((end.getTime() - start.getTime()) / HOUR_IN_MS);
    return Number.isFinite(duration) ? Math.max(1, duration) : DEFAULT_DURATION_HOURS;
};

const sanitizeDuration = (value: number) => {
    if (!Number.isFinite(value) || value < 1) return DEFAULT_DURATION_HOURS;
    return Math.max(1, Math.round(value));
};

export const TaskForm: React.FC<TaskFormProps> = ({ onSave, onCancel, projects, existingTasks, taskToEdit, initialProject, initialCompany }) => {
    const [project, setProject] = useState(taskToEdit?.project || initialProject || '');
    const [company, setCompany] = useState(taskToEdit?.company || initialCompany || '');
    const isProjectLocked = Boolean(initialProject);

    const [activities, setActivities] = useState<ActivityEntry[]>(() => {
        if (taskToEdit) {
            const durationHours = taskToEdit.duration || getDurationHours(taskToEdit.startDate, taskToEdit.endDate);
            return [{
                tempId: taskToEdit.id,
                activity: taskToEdit.activity,
                duration: durationHours,
                predecessor: taskToEdit.predecessor || '',
                isCompleted: taskToEdit.isCompleted || false,
                color: taskToEdit.color
            }];
        }
        return [{ tempId: crypto.randomUUID(), activity: '', duration: DEFAULT_DURATION_HOURS, predecessor: '', isCompleted: false, color: undefined }];
    });

    const handleAddActivity = () => {
        setActivities([...activities, { tempId: crypto.randomUUID(), activity: '', duration: DEFAULT_DURATION_HOURS, predecessor: '', isCompleted: false, color: undefined }]);
    };

    const handleRemoveActivity = (id: string) => {
        if (activities.length > 1) {
            setActivities(activities.filter(a => a.tempId !== id));
        }
    };

    const handleChangeActivity = <K extends keyof ActivityEntry>(id: string, field: K, value: ActivityEntry[K]) => {
        setActivities(activities.map(a => a.tempId === id ? { ...a, [field]: value } : a));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const defaultStart = getRoundedCurrentHour();
        const scheduledNewTasks: TimelineTask[] = [];

        const tasksToSave: TimelineTask[] = activities.map(act => {
            const duration = sanitizeDuration(act.duration);

            if (taskToEdit) {
                const existingTask = existingTasks.find(t => t.id === act.tempId);
                if (existingTask) {
                    const start = new Date(existingTask.startDate);
                    const end = new Date(start.getTime() + duration * HOUR_IN_MS);
                    return {
                        id: act.tempId,
                        project,
                        company,
                        activity: act.activity,
                        startDate: existingTask.startDate,
                        endDate: formatLocalDateTime(end),
                        duration,
                        predecessor: act.predecessor || undefined,
                        isCompleted: act.isCompleted,
                        color: act.color
                    };
                }
            }

            const predecessorTask = act.predecessor
                ? existingTasks.find(t => t.id === act.predecessor) ?? scheduledNewTasks.find(t => t.id === act.predecessor)
                : undefined;

            const startCandidate = predecessorTask ? new Date(predecessorTask.endDate) : new Date(defaultStart);
            const startDate = Number.isNaN(startCandidate.getTime()) ? new Date(defaultStart) : startCandidate;
            const endDate = new Date(startDate.getTime() + duration * HOUR_IN_MS);

            const task = {
                id: act.tempId,
                project,
                company,
                activity: act.activity,
                startDate: formatLocalDateTime(startDate),
                endDate: formatLocalDateTime(endDate),
                duration,
                predecessor: act.predecessor || undefined,
                isCompleted: act.isCompleted,
                color: act.color
            };

            scheduledNewTasks.push(task);
            return task;
        });

        onSave(tasksToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface-card rounded-2xl p-6 border border-border-subtle shadow-xl animate-fade-in relative max-w-4xl mx-auto">
            <button
                type="button"
                onClick={onCancel}
                className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors shadow-sm"
                title="Fechar"
            >
                <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Plus size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-text-primary">
                        {taskToEdit ? "Editar Atividade" : "Cadastrar Atividades"}    
                    </h3>
                    <p className="text-sm text-text-muted">
                        {taskToEdit ? "Atualize os dados da atividade selecionada." : "Adicione uma ou mais atividades para um projeto."}
                    </p>
                </div>
            </div>

            {/* Cabeçalho Comum: Projeto e Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 p-4 bg-surface-dark/30 rounded-xl border border-border-subtle/50 shadow-inner">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary block">Projeto</label>
                    <input
                        type="text"
                        required
                        readOnly={isProjectLocked}
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        className={`w-full h-11 px-4 rounded-xl border text-text-primary placeholder:text-text-muted focus:outline-none transition-all shadow-sm ${isProjectLocked ? 'bg-surface-elevated cursor-not-allowed border-primary/20 font-bold text-primary' : 'bg-surface-dark border-border-subtle focus:border-primary/50'}`}
                        placeholder="Nome do Projeto"
                        list="project-list"
                    />
                    <datalist id="project-list">
                        {projects.map(p => <option key={p} value={p} />)}
                    </datalist>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary block">Empresa Responsável</label>
                    <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-dark border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                        placeholder="Ex: Construtora XYZ"
                    />
                </div>
            </div>

            {/* Lista de Atividades */}
            <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text-primary">Lista de Atividades</h4>
                    {!taskToEdit && (
                        <button
                            type="button"
                            onClick={handleAddActivity}
                            className="text-sm font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5"
                        >
                            <Plus size={16} /> Adicionar Linha
                        </button>
                    )}
                </div>

                {activities.map((act, index) => (
                    <div key={act.tempId} className="relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl border border-border-subtle bg-surface-elevated/30 transition-all hover:border-border-subtle shadow-sm group">
                        {activities.length > 1 && !taskToEdit && (
                            <button
                                type="button"
                                onClick={() => handleRemoveActivity(act.tempId)}
                                className="absolute -top-3 -right-3 w-7 h-7 bg-surface-card border border-border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors shadow-sm z-10"
                                title="Remover atividade"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        
                        {/* Atividade */}
                        <div className="space-y-1.5 md:col-span-4 flex items-end gap-2">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-semibold text-text-secondary block flex items-center justify-between">
                                    <span>Atividade {index + 1}</span>
                                    {taskToEdit && (
                                        <button 
                                            type="button"
                                            onClick={() => handleChangeActivity(act.tempId, 'isCompleted', !act.isCompleted)}
                                            className={`flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded transition-all ${act.isCompleted ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-surface-dark text-text-muted border border-border-subtle hover:text-text-secondary'}`}
                                        >
                                            {act.isCompleted ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                                            {act.isCompleted ? 'Concluída' : 'Marcar Concluída'}
                                        </button>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={act.activity}
                                    onChange={(e) => handleChangeActivity(act.tempId, 'activity', e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-surface-dark border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                                    placeholder="Nome da tarefa"
                                />
                            </div>
                        </div>

                        {/* Duração */}
                        <div className="space-y-1.5 md:col-span-4">
                            <label className="text-xs font-semibold text-text-secondary block">Duração (horas)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    step={1}
                                    value={act.duration}
                                    onChange={(e) => handleChangeActivity(act.tempId, 'duration', sanitizeDuration(Number(e.target.value)))}
                                    className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-surface-dark border border-border-subtle text-text-primary focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                                    placeholder="Ex: 8"
                                />
                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-text-muted mt-0.5">
                                As datas serão definidas ao arrastar e conectar as barras no gráfico.
                            </p>
                        </div>

                        {/* Predecessora (opcional - também pode ser definida via drag) */}
                        <div className="space-y-1.5 md:col-span-4">
                            <label className="text-xs font-semibold text-text-secondary block">Predecessora <span className="text-text-muted font-normal">(opcional)</span></label>
                            <select
                                value={act.predecessor}
                                onChange={(e) => handleChangeActivity(act.tempId, 'predecessor', e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-surface-dark border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                            >
                                <option value="">Nenhuma</option>
                                {/* Atividades já salvas */}
                                {existingTasks
                                    .filter(t => t.id !== taskToEdit?.id && t.project === project)
                                    .map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.activity}
                                        </option>
                                    ))}
                                {/* Outras atividades neste formulário que vieram antes */}
                                {activities.slice(0, index).map((otherAct) => (
                                    otherAct.activity && (
                                        <option key={otherAct.tempId} value={otherAct.tempId}>
                                            {otherAct.activity} (Nova)
                                        </option>
                                    )
                                ))}
                            </select>
                            <p className="text-[10px] text-text-muted mt-0.5">
                                Também pode ser definida arrastando uma barra sobre outra no gráfico.
                            </p>
                        </div>
                        
                        {/* Cor Opcional */}
                        <div className="space-y-1.5 md:col-span-12 mt-2 pt-2 border-t border-border-subtle/30">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-text-secondary block">Cor da Barra no Gráfico</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button 
                                    type="button" 
                                    onClick={() => handleChangeActivity(act.tempId, 'color', undefined)} 
                                    className={`w-6 h-6 rounded-full border ${!act.color ? 'border-primary ring-2 ring-primary/40' : 'border-border-subtle'} bg-surface-dark flex items-center justify-center text-[10px] transition-all hover:scale-110`} 
                                    title="Cor Automática"
                                >
                                    Auto
                                </button>
                                <div className="w-[1px] h-4 bg-border-subtle mx-1" />
                                {PREDEFINED_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => handleChangeActivity(act.tempId, 'color', c)}
                                        className={`w-6 h-6 rounded-full ${c} ${act.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-elevated scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'} transition-all shadow-sm`}
                                        title="Escolher cor"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border-subtle">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-10 px-5 rounded-xl font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-light text-white font-medium shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Save size={18} />
                    {taskToEdit ? "Atualizar Tarefa" : "Salvar Tudo"}
                </button>
            </div>
        </form>
    );
};
