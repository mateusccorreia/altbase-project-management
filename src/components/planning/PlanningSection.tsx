import React, { useState, useEffect, useRef } from 'react';
import type { Project } from '../../types';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Circle,
  Trash2,
  GripVertical,
  Search,
  ClipboardList,
  CalendarCheck,
} from 'lucide-react';

// ─── Planning Phase Types ───────────────────────────────────────────

export interface PlanningPhase {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface ProjectPlanning {
  projectId: number;
  phases: PlanningPhase[];
}

// ─── Default Planning Phases ────────────────────────────────────────

const DEFAULT_PHASES: string[] = [
  'Definição de Escopo',
  'Elaboração de Projeto',
  'Aprovação de Budget',
  'Compra de Materiais',
  'Solicitação de Contratação',
  'Processo Licitatório',
  'Contratação',
  'Mobilização',
  'Inspeção de Segurança',
  'Liberação de Área',
  'Início de Obras',
];

// ─── Helpers ────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 10);

const STORAGE_KEY = 'altbase_project_planning';

const loadPlanning = (): ProjectPlanning[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const savePlanning = (data: ProjectPlanning[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getStatusIcon = (status: PlanningPhase['status']) => {
  switch (status) {
    case 'completed':
      return <Check size={14} />;
    case 'in_progress':
      return <Clock size={14} />;
    default:
      return <Circle size={14} />;
  }
};

const getStatusStyles = (status: PlanningPhase['status']) => {
  switch (status) {
    case 'completed':
      return {
        dot: 'bg-emerald-500',
        icon: 'text-emerald-500',
        line: 'bg-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/25',
        text: 'text-emerald-400',
        label: 'Concluído',
      };
    case 'in_progress':
      return {
        dot: 'bg-amber-500',
        icon: 'text-amber-500',
        line: 'bg-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/25',
        text: 'text-amber-400',
        label: 'Em Andamento',
      };
    default:
      return {
        dot: 'bg-slate-400',
        icon: 'text-slate-400',
        line: 'bg-slate-300',
        bg: 'bg-slate-100 border-slate-200',
        text: 'text-slate-400',
        label: 'Pendente',
      };
  }
};

const formatDateShort = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Phase Selector Dropdown ────────────────────────────────────────

interface PhaseSelectorProps {
  existingLabels: string[];
  onSelect: (label: string) => void;
  onClose: () => void;
}

const PhaseSelector: React.FC<PhaseSelectorProps> = ({ existingLabels, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const available = DEFAULT_PHASES.filter(
    (p) =>
      !existingLabels.includes(p) &&
      p.toLowerCase().includes(search.toLowerCase())
  );

  const canAddCustom =
    search.trim() !== '' &&
    !DEFAULT_PHASES.map((d) => d.toLowerCase()).includes(search.trim().toLowerCase()) &&
    !existingLabels.map((e) => e.toLowerCase()).includes(search.trim().toLowerCase());

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-80 bg-surface-card rounded-xl border border-border-subtle shadow-2xl shadow-black/10 z-50 overflow-hidden animate-scale-in"
      style={{ transformOrigin: 'bottom left' }}
    >
      {/* Search */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-2">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Buscar ou digitar nova fase..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAddCustom) {
                onSelect(search.trim());
              }
            }}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Options */}
      <div className="max-h-52 overflow-y-auto p-2">
        {available.length === 0 && !canAddCustom && (
          <p className="text-xs text-text-muted text-center py-4">
            Nenhuma fase disponível
          </p>
        )}
        {available.map((phase) => (
          <button
            key={phase}
            onClick={() => onSelect(phase)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated hover:text-text-primary rounded-lg transition-colors text-left"
          >
            <ClipboardList size={14} className="text-primary shrink-0" />
            {phase}
          </button>
        ))}

        {canAddCustom && (
          <>
            {available.length > 0 && (
              <div className="border-t border-border-subtle my-1" />
            )}
            <button
              onClick={() => onSelect(search.trim())}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors text-left font-medium"
            >
              <Plus size={14} className="shrink-0" />
              Criar fase: "{search.trim()}"
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Status Cycle Button ────────────────────────────────────────────

const nextStatus = (s: PlanningPhase['status']): PlanningPhase['status'] => {
  if (s === 'pending') return 'in_progress';
  if (s === 'in_progress') return 'completed';
  return 'pending';
};

// ─── Planning Timeline Row ──────────────────────────────────────────

interface PlanningTimelineProps {
  projectId: number;
  planning: ProjectPlanning | undefined;
  onUpdate: (p: ProjectPlanning) => void;
}

const PlanningTimeline: React.FC<PlanningTimelineProps> = ({
  projectId,
  planning,
  onUpdate,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const phases = planning?.phases || [];

  const addPhase = (label: string) => {
    const newPhase: PlanningPhase = {
      id: generateId(),
      label,
      status: 'pending',
    };
    const updated: ProjectPlanning = {
      projectId,
      phases: [...phases, newPhase],
    };
    onUpdate(updated);
    setShowSelector(false);
  };

  const updatePhase = (phaseId: string, changes: Partial<PlanningPhase>) => {
    const updated: ProjectPlanning = {
      projectId,
      phases: phases.map((ph) =>
        ph.id === phaseId ? { ...ph, ...changes } : ph
      ),
    };
    onUpdate(updated);
  };

  const removePhase = (phaseId: string) => {
    const updated: ProjectPlanning = {
      projectId,
      phases: phases.filter((ph) => ph.id !== phaseId),
    };
    onUpdate(updated);
  };

  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const progressPct = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;

  return (
    <div className="px-6 py-5 animate-fade-in">
      {/* Progress Overview */}
      {phases.length > 0 && (
        <div className="mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Progresso do Planejamento
              </span>
              <span className="text-sm font-bold text-text-primary">
                {completedCount}/{phases.length} fases
              </span>
            </div>
            <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background:
                    progressPct === 100
                      ? 'linear-gradient(90deg, #10B981, #34D399)'
                      : 'linear-gradient(90deg, #F58746, #FFBE6E)',
                }}
              />
            </div>
          </div>
          <div
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              progressPct === 100
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {progressPct}%
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {phases.map((phase, idx) => {
          const styles = getStatusStyles(phase.status);
          const isLast = idx === phases.length - 1;

          return (
            <div key={phase.id} className="flex gap-4 group" style={{ minHeight: '72px' }}>
              {/* Vertical Line + Dot */}
              <div className="flex flex-col items-center shrink-0 w-6">
                <button
                  onClick={() => updatePhase(phase.id, { status: nextStatus(phase.status) })}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:scale-110 z-10 ${
                    phase.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : phase.status === 'in_progress'
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                      : 'bg-surface-card border-slate-300 text-slate-400 hover:border-primary hover:text-primary'
                  }`}
                  title={`Clique para alterar: ${styles.label}`}
                >
                  {getStatusIcon(phase.status)}
                </button>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 transition-colors ${
                      phase.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              {/* Phase Content */}
              <div className={`flex-1 pb-4 ${isLast ? '' : 'mb-0'}`}>
                <div
                  className={`rounded-xl border p-3 transition-all duration-200 group-hover:shadow-md ${styles.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical size={14} className="text-text-muted/50 shrink-0 cursor-grab" />
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {phase.label}
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            phase.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : phase.status === 'in_progress'
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {styles.label}
                        </span>
                      </div>

                      {/* Date Inputs */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-text-muted font-medium uppercase">Início:</span>
                          <input
                            type="date"
                            value={phase.startDate || ''}
                            onChange={(e) =>
                              updatePhase(phase.id, { startDate: e.target.value })
                            }
                            className="text-xs bg-transparent border border-border-subtle rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <ChevronRight size={12} className="text-text-muted" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-text-muted font-medium uppercase">Fim:</span>
                          <input
                            type="date"
                            value={phase.endDate || ''}
                            onChange={(e) =>
                              updatePhase(phase.id, { endDate: e.target.value })
                            }
                            className="text-xs bg-transparent border border-border-subtle rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        {phase.startDate && phase.endDate && (
                          <span className="text-[10px] text-text-muted italic ml-1">
                            {formatDateShort(phase.startDate)} → {formatDateShort(phase.endDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removePhase(phase.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-all"
                      title="Remover fase"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Phase Button */}
      <div className="relative mt-2">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border-subtle hover:border-primary/40 text-text-muted hover:text-primary transition-all duration-200 text-sm font-medium group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
          Adicionar Fase de Planejamento
        </button>
        {showSelector && (
          <PhaseSelector
            existingLabels={phases.map((p) => p.label)}
            onSelect={addPhase}
            onClose={() => setShowSelector(false)}
          />
        )}
      </div>

      {phases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <CalendarCheck size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma fase definida</p>
          <p className="text-xs mt-1">Clique em "Adicionar Fase" para começar a montar a timeline</p>
        </div>
      )}
    </div>
  );
};

// ─── Main PlanningSection Component ─────────────────────────────────

interface PlanningSectionProps {
  projects: Project[];
}

export const PlanningSection: React.FC<PlanningSectionProps> = ({ projects }) => {
  const [plannings, setPlannings] = useState<ProjectPlanning[]>(loadPlanning());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    savePlanning(plannings);
  }, [plannings]);

  const handleUpdatePlanning = (updated: ProjectPlanning) => {
    setPlannings((prev) => {
      const exists = prev.find((p) => p.projectId === updated.projectId);
      if (exists) {
        return prev.map((p) =>
          p.projectId === updated.projectId ? updated : p
        );
      }
      return [...prev, updated];
    });
  };

  const getProjectPlanning = (projectId: number) =>
    plannings.find((p) => p.projectId === projectId);

  const getProjectProgress = (projectId: number) => {
    const planning = getProjectPlanning(projectId);
    if (!planning || planning.phases.length === 0) return -1;
    const completed = planning.phases.filter((p) => p.status === 'completed').length;
    return Math.round((completed / planning.phases.length) * 100);
  };

  const filteredProjects = projects.filter(
    (p) =>
      searchTerm === '' ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.coordinator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20">
              <ClipboardList size={20} className="text-white" />
            </div>
            Planejamento de Projetos
          </h2>
          <p className="text-sm text-text-muted mt-1.5 ml-[52px]">
            Gerencie as fases de planejamento de cada projeto — clique em um projeto para expandir a timeline
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-card rounded-xl border border-border-subtle px-3 py-2 w-full sm:w-72">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Projetos</h3>
          <span className="text-xs text-text-muted bg-surface-elevated px-3 py-1 rounded-full">
            {filteredProjects.length} projetos
          </span>
        </div>

        <div className="divide-y divide-border-subtle/50">
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <ClipboardList size={48} className="mb-4 opacity-30" />
              <p className="font-medium">Nenhum projeto encontrado</p>
              <p className="text-sm mt-1">
                Cadastre projetos na aba Dashboard primeiro
              </p>
            </div>
          )}

          {filteredProjects.map((project, idx) => {
            const isExpanded = expandedId === project.id;
            const planning = getProjectPlanning(project.id);
            const progress = getProjectProgress(project.id);
            const phaseCount = planning?.phases.length || 0;
            const completedCount =
              planning?.phases.filter((p) => p.status === 'completed').length || 0;
            const inProgressCount =
              planning?.phases.filter((p) => p.status === 'in_progress').length || 0;

            return (
              <div
                key={project.id}
                className={`animate-fade-in stagger-${Math.min(idx + 1, 10)}`}
                style={{ animationFillMode: 'both' }}
              >
                {/* Project Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  className={`w-full px-6 py-4 flex items-center gap-4 text-left transition-all duration-200 hover:bg-surface-card-hover ${
                    isExpanded ? 'bg-surface-dark/30' : ''
                  }`}
                >
                  {/* Expand Icon */}
                  <div
                    className={`p-1 rounded-lg transition-all duration-200 ${
                      isExpanded
                        ? 'bg-primary/10 text-primary rotate-90'
                        : 'text-text-muted'
                    }`}
                  >
                    <ChevronRight size={18} className="transition-transform duration-200" />
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary truncate">
                      {project.title}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      {project.coordinator}
                    </p>
                  </div>

                  {/* Phase Summary Chips */}
                  <div className="hidden md:flex items-center gap-2">
                    {phaseCount === 0 ? (
                      <span className="text-xs text-text-muted bg-surface-elevated px-3 py-1 rounded-full">
                        Sem fases definidas
                      </span>
                    ) : (
                      <>
                        {completedCount > 0 && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full flex items-center gap-1">
                            <Check size={10} />
                            {completedCount}
                          </span>
                        )}
                        {inProgressCount > 0 && (
                          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full flex items-center gap-1">
                            <Clock size={10} />
                            {inProgressCount}
                          </span>
                        )}
                        <span className="text-[10px] text-text-muted">
                          {phaseCount} fases
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress Mini Bar */}
                  <div className="w-24 hidden sm:block">
                    {progress >= 0 ? (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-text-muted">Planej.</span>
                          <span className="text-[10px] font-bold text-text-primary">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              background:
                                progress === 100
                                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                                  : 'linear-gradient(90deg, #F58746, #FFBE6E)',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted text-center block">—</span>
                    )}
                  </div>

                  {/* Expand chevron */}
                  <div className="text-text-muted">
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {/* Expanded Planning Timeline */}
                {isExpanded && (
                  <div className="border-t border-border-subtle/50 bg-surface-dark/20">
                    <PlanningTimeline
                      projectId={project.id}
                      planning={planning}
                      onUpdate={handleUpdatePlanning}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
