import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, differenceInHours, min, max, addHours, startOfDay, endOfDay, differenceInMinutes, getDate, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, ChevronRight, ChevronDown, Plus, Trash2, MoveHorizontal, CheckCircle2, Circle, GripVertical } from 'lucide-react';
import type { TimelineTask } from '../../types';

interface GanttChartProps {
    tasks: TimelineTask[];
    onEditTask: (task: TimelineTask) => void;
    onDeleteTask: (taskId: string) => void;
    onAddTaskToProject: (projectName: string, company: string) => void;
    onToggleTaskCompletion: (taskId: string) => void;
    markerOffset: number;
    onMarkerOffsetChange: (offset: number) => void;
    scrollLeft: number;
    scrollTop: number;
    onScrollChange: (scrollLeft: number, scrollTop: number) => void;
    onRenameProject: (oldName: string, newName: string) => void;
    onReorderTasks: (tasks: TimelineTask[]) => void;
    onLinkTasks: (predecessorId: string, successorId: string) => void;
    viewMode: 'hours' | 'days' | 'weeks' | 'months';
    leftColumnWidth: number;
    onLeftColumnWidthChange: (width: number) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ 
    tasks, 
    onEditTask, 
    onDeleteTask, 
    onAddTaskToProject, 
    onToggleTaskCompletion,
    onRenameProject,
    onReorderTasks,
    onLinkTasks,
    viewMode,
    markerOffset, 
    onMarkerOffsetChange,
    scrollLeft,
    scrollTop,
    onScrollChange,
    leftColumnWidth,
    onLeftColumnWidthChange
}) => {
    const CELL_WIDTH = viewMode === 'hours' ? 30 : viewMode === 'days' ? 6 : viewMode === 'weeks' ? 1.2 : 0.25;
    const isResizing = useRef(false);
    const isDraggingMarker = useRef(false);
    const isPanning = useRef(false);
    const panStartX = useRef(0);
    const panScrollLeft = useRef(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
    const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
    // Linking state
    const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
    const [linkMousePos, setLinkMousePos] = useState<{ x: number; y: number } | null>(null);
    const timelineBodyRef = useRef<HTMLDivElement>(null);
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleDragRowStart = (e: React.DragEvent, taskId: string) => {
        setDraggedRowId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragRowOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverRowId !== taskId) {
            setDragOverRowId(taskId);
        }
    };

    const handleDragRowLeave = () => {
        setDragOverRowId(null);
    };

    const handleDropRow = (e: React.DragEvent, targetTaskId: string) => {
        e.preventDefault();
        setDragOverRowId(null);
        if (!draggedRowId || draggedRowId === targetTaskId) {
            setDraggedRowId(null);
            return;
        }

        const oldIndex = tasks.findIndex(t => t.id === draggedRowId);
        const newIndex = tasks.findIndex(t => t.id === targetTaskId);

        if (oldIndex >= 0 && newIndex >= 0) {
            const newTasks = [...tasks];
            const [movedItem] = newTasks.splice(oldIndex, 1);
            movedItem.project = tasks[newIndex].project; // Suporta arrastar para outro projeto
            newTasks.splice(newIndex, 0, movedItem);
            onReorderTasks(newTasks);
        }
        setDraggedRowId(null);
    };

    const toggleProjectCollapse = (projectName: string) => {
        setCollapsedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectName)) next.delete(projectName);
            else next.add(projectName);
            return next;
        });
    };

    // Restaurar scroll on mount, salvar on unmount
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            setTimeout(() => {
                el.scrollLeft = scrollLeft;
                el.scrollTop = scrollTop;
            }, 10);
        }
        return () => {
            if (el) {
                onScrollChange(el.scrollLeft, el.scrollTop);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { hoursList, minDate } = useMemo(() => {
        if (!tasks.length) return { hoursList: [], minDate: new Date() };

        const allStarts = tasks.map(t => parseISO(t.startDate));
        const allEnds = tasks.map(t => parseISO(t.endDate));

        const earliest = startOfDay(min(allStarts));
        const latest = endOfDay(max(allEnds));

        const totalHours = differenceInHours(latest, earliest) + 1;
        const generatedHours = Array.from({ length: totalHours }, (_, i) => addHours(earliest, i));

        return { hoursList: generatedHours, minDate: earliest };
    }, [tasks]);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, TimelineTask[]> = {};
        tasks.forEach(task => {
            if (!groups[task.project]) groups[task.project] = [];
            groups[task.project].push(task);
        });
        return groups;
    }, [tasks]);

    // Calculate dependency arrows
    const dependencyArrows = useMemo(() => {
        const PROJECT_HEADER_HEIGHT = 40; // h-10
        const TASK_ROW_HEIGHT = 44; // h-11
        const arrows: Array<{
            fromX: number; fromY: number;
            toX: number; toY: number;
        }> = [];

        // Build a flat visible list with row indices
        const visibleRows: Array<{ task: TimelineTask; rowIndex: number }> = [];
        let rowIdx = 0;
        Object.entries(groupedTasks).forEach(([projectName, projectTasks]) => {
            rowIdx++; // project header row
            const isCollapsed = collapsedProjects.has(projectName);
            if (!isCollapsed) {
                projectTasks.forEach(task => {
                    visibleRows.push({ task, rowIndex: rowIdx });
                    rowIdx++;
                });
            }
        });

        // For each task with a predecessor, draw an arrow
        visibleRows.forEach(({ task: successorTask, rowIndex: successorRow }) => {
            if (!successorTask.predecessor) return;
            const predecessorEntry = visibleRows.find(r => r.task.id === successorTask.predecessor);
            if (!predecessorEntry) return;

            const predTask = predecessorEntry.task;
            const predRow = predecessorEntry.rowIndex;

            const predEnd = parseISO(predTask.endDate);
            const succStart = parseISO(successorTask.startDate);

            const predEndX = (differenceInMinutes(predEnd, minDate) / 60) * CELL_WIDTH;
            const succStartX = (differenceInMinutes(succStart, minDate) / 60) * CELL_WIDTH;

            // Y center of each row
            const getRowY = (row: number) => {
                let y = 0;
                let currentRow = 0;
                for (const [projectName, projectTasks] of Object.entries(groupedTasks)) {
                    if (currentRow === row) return y + PROJECT_HEADER_HEIGHT / 2;
                    y += PROJECT_HEADER_HEIGHT;
                    currentRow++;
                    const isCollapsed = collapsedProjects.has(projectName);
                    if (!isCollapsed) {
                        for (let index = 0; index < projectTasks.length; index++) {
                            if (currentRow === row) return y + TASK_ROW_HEIGHT / 2;
                            y += TASK_ROW_HEIGHT;
                            currentRow++;
                        }
                    }
                }
                return y;
            };

            const fromY = getRowY(predRow);
            const toY = getRowY(successorRow);

            arrows.push({
                fromX: predEndX,
                fromY,
                toX: succStartX,
                toY,
            });
        });

        return arrows;
    }, [groupedTasks, collapsedProjects, minDate, CELL_WIDTH]);

    const milestoneTask = useMemo(() => {
        return tasks.find(t => 
            t.activity.toLowerCase().includes('solicitação do desbloqueio') && 
            t.project.toLowerCase().includes('retorno da planta')
        );
    }, [tasks]);

    // Redimensionar coluna
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    // Arrastar Marcador
    const startDraggingMarker = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        isDraggingMarker.current = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopAllDragging = useCallback(() => {
        isResizing.current = false;
        isDraggingMarker.current = false;
        if (isPanning.current) {
            isPanning.current = false;
            if (scrollContainerRef.current) {
                scrollContainerRef.current.style.cursor = 'grab';
            }
        }
        // Cancel linking if mouse released on empty space
        if (linkingFrom) {
            setLinkingFrom(null);
            setLinkMousePos(null);
        }

        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, [linkingFrom]);

    // Iniciar pan (clicar e arrastar na timeline)
    const startPanning = useCallback((e: React.MouseEvent) => {
        // Só inicia o pan se clicar com botão esquerdo e não for em um botão/handle
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[onmousedown]') || target.classList.contains('cursor-col-resize') || target.classList.contains('cursor-ew-resize')) return;
        
        e.preventDefault(); // Previne seleção de texto acidental
        isPanning.current = true;
        panStartX.current = e.clientX;
        panScrollLeft.current = scrollContainerRef.current?.scrollLeft || 0;
        document.body.style.userSelect = 'none';
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grabbing';
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (e.buttons === 0) {
            stopAllDragging();
            return;
        }

        const container = document.getElementById('gantt-container');
        const timelineWrapper = document.getElementById('timeline-wrapper');
        if (!container || !timelineWrapper) return;

        const containerRect = container.getBoundingClientRect();

        if (isResizing.current) {
            const minWidth = 150;
            const maxWidth = 600;
            const newWidth = e.clientX - containerRect.left;
            onLeftColumnWidthChange(Math.max(minWidth, Math.min(maxWidth, newWidth)));
        }

        if (isDraggingMarker.current) {
            const timelineRect = timelineWrapper.getBoundingClientRect();
            const scrollLeftVal = timelineWrapper.parentElement?.scrollLeft || 0;
            const newOffset = e.clientX - timelineRect.left + scrollLeftVal;
            onMarkerOffsetChange(Math.max(0, newOffset));
        }

        if (isPanning.current && scrollContainerRef.current) {
            const dx = e.clientX - panStartX.current;
            const newScrollLeft = panScrollLeft.current - dx;
            scrollContainerRef.current.scrollLeft = newScrollLeft;
        }

        // Track mouse for linking
        if (linkingFrom && timelineBodyRef.current) {
            const bodyRect = timelineBodyRef.current.getBoundingClientRect();
            setLinkMousePos({
                x: e.clientX - bodyRect.left + (timelineBodyRef.current.parentElement?.scrollLeft || 0),
                y: e.clientY - bodyRect.top + (timelineBodyRef.current.parentElement?.scrollTop || 0),
            });
        }
    }, [onLeftColumnWidthChange, onMarkerOffsetChange, stopAllDragging, linkingFrom]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopAllDragging);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopAllDragging);
        };
    }, [handleMouseMove, stopAllDragging]);

    const markerTime = useMemo(() => {
        const totalMinutes = (markerOffset / CELL_WIDTH) * 60;
        return addMinutes(minDate, totalMinutes);
    }, [markerOffset, minDate, CELL_WIDTH]);

    if (!tasks.length) {
        return (
            <div className="flex items-center justify-center h-48 border border-dashed border-border-subtle rounded-2xl bg-surface-card/50">
                <p className="text-text-muted">Nenhuma atividade cadastrada. O cronograma aparecerá aqui.</p>
            </div>
        );
    }

    const labelInterval = 2;

    const colors = [
        'bg-amp-orange',
        'bg-amp-lilac',
        'bg-amp-red',
        'bg-amp-orange-2',
        'bg-blue-500',
        'bg-emerald-500'
    ];

    const handleDeleteClick = (taskId: string, activityName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a atividade "${activityName}"?`)) {
            onDeleteTask(taskId);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const sl = e.currentTarget.scrollLeft;
        const st = e.currentTarget.scrollTop;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            onScrollChange(sl, st);
        }, 150);
    };

    return (
        <div id="gantt-container" className="bg-surface-card rounded-2xl border border-border-subtle shadow-xl overflow-hidden mt-6 animate-fade-in relative">
            <div 
                ref={scrollContainerRef}
                className="overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing"
                onMouseDown={startPanning}
                onScroll={handleScroll}
            >
                <div className="min-w-fit flex">
                    {/* Lista de Tarefas (Left Column) */}
                    <div 
                        className="flex-shrink-0 border-r border-border-subtle bg-surface-card sticky left-0 z-20 shadow-sm relative"
                        style={{ width: `${leftColumnWidth}px` }}
                    >
                        <div 
                            onMouseDown={startResizing}
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 z-30 transition-colors"
                        />
                        <div className="h-14 flex items-center px-3 border-b border-border-subtle bg-surface-elevated font-bold text-xs text-text-primary overflow-hidden">
                            <div className="flex-1 truncate">Atividade / Projeto</div>
                            <div className="w-16 text-center flex-shrink-0">Resp.</div>
                        </div>
                        <div className="flex flex-col">
                            {Object.entries(groupedTasks).map(([projectName, projectTasks]) => {
                                const isCollapsed = collapsedProjects.has(projectName);
                                return (
                                <React.Fragment key={projectName}>
                                    <div 
                                        className="h-10 flex items-center px-3 bg-surface-elevated/40 border-b border-border-subtle/30 text-xs font-bold text-primary uppercase tracking-wider overflow-hidden group/row cursor-pointer hover:bg-surface-elevated/60 transition-colors"
                                        onClick={() => toggleProjectCollapse(projectName)}
                                    >
                                        <button className="mr-1.5 flex-shrink-0 text-primary focus:outline-none">
                                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <span 
                                            className="truncate flex-1 cursor-text hover:bg-surface-elevated/80 px-1 rounded transition-colors"
                                            title="Clique duplo para renomear o projeto"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                const newName = window.prompt(`Digite o novo nome para o projeto "${projectName}":`, projectName);
                                                if (newName && newName.trim() !== '' && newName.trim() !== projectName) {
                                                    onRenameProject(projectName, newName.trim());
                                                }
                                            }}
                                        >
                                            {projectName}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddTaskToProject(projectName, projectTasks[0]?.company || '');
                                            }}
                                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors opacity-0 group-hover/row:opacity-100"
                                            title="Adicionar nova atividade neste projeto"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    {!isCollapsed && projectTasks.map((task) => (
                                        <div 
                                            key={task.id} 
                                            draggable
                                            onDragStart={(e) => handleDragRowStart(e, task.id)}
                                            onDragOver={(e) => handleDragRowOver(e, task.id)}
                                            onDragLeave={handleDragRowLeave}
                                            onDrop={(e) => handleDropRow(e, task.id)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className={`h-11 flex items-center px-3 border-b border-border-subtle/50 text-sm transition-colors group ${draggedRowId === task.id ? 'opacity-50' : ''} ${dragOverRowId === task.id ? 'bg-primary/10 border-t-2 border-t-primary' : 'hover:bg-surface-elevated'}`}
                                        >
                                            <div className="mr-1.5 cursor-grab active:cursor-grabbing text-border-subtle/40 group-hover:text-border-subtle hover:text-primary transition-colors">
                                                <GripVertical size={14} />
                                            </div>
                                            <button 
                                                onClick={() => onToggleTaskCompletion(task.id)}
                                                className={`mr-2 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-text-muted hover:text-emerald-400'}`}
                                            >
                                                {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                            </button>
                                            <div className={`flex-1 font-medium pr-1 leading-tight truncate transition-all ${task.isCompleted ? 'text-text-muted line-through decoration-emerald-500/50' : 'text-text-primary'}`} title={task.activity}>
                                                {task.activity}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <div className="w-12 text-center truncate text-[9px] uppercase font-bold text-text-muted bg-surface-elevated px-1 py-0.5 rounded border border-border-subtle" title={task.company}>
                                                    {task.company}
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEditTask(task)} className="p-1 text-text-muted hover:text-primary rounded"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDeleteClick(task.id, task.activity)} className="p-1 text-text-muted hover:text-rose-500 rounded"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline (Right Column) */}
                    <div id="timeline-wrapper" className="flex-1 relative pb-4">
                        {/* Header Timeline */}
                        <div className="h-14 flex border-b border-border-subtle bg-surface-elevated relative">
                            {hoursList.map((date, idx) => {
                                const isMidnight = date.getHours() === 0;
                                const isLabelBound = date.getHours() % labelInterval === 0;
                                const isEvenDay = getDate(date) % 2 === 0;

                                if (viewMode === 'months') {
                                    if (!isMidnight || date.getDate() !== 1) { // Só mostra no início do mês
                                        if (idx !== 0) return null;
                                    }
                                    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                                    return (
                                        <div key={date.toISOString()} className={`flex-shrink-0 flex items-center justify-center border-l border-border-subtle/50 ${isEvenDay ? 'bg-surface-dark/5' : ''}`} style={{ width: `${CELL_WIDTH * 24 * daysInMonth}px` }}>
                                            <span className="text-[10px] uppercase font-bold text-text-primary px-2 bg-surface-elevated/80 rounded z-10 whitespace-nowrap">
                                                {format(date, 'MMMM yyyy', { locale: ptBR })}
                                            </span>
                                        </div>
                                    );
                                }

                                if (viewMode === 'weeks') {
                                    if (!isMidnight || date.getDay() !== 1) { // Só mostra no início da semana (Segunda)
                                        if (idx !== 0) return null;
                                    }
                                    return (
                                        <div key={date.toISOString()} className={`flex-shrink-0 flex items-center justify-center border-l border-border-subtle/50 ${isEvenDay ? 'bg-surface-dark/5' : ''}`} style={{ width: `${CELL_WIDTH * 168}px` }}>
                                            <span className="text-[10px] uppercase font-bold text-text-primary px-2 bg-surface-elevated/80 rounded z-10 whitespace-nowrap">
                                                {format(date, 'dd MMM', { locale: ptBR })} - {format(addHours(date, 167), 'dd MMM', { locale: ptBR })}
                                            </span>
                                        </div>
                                    );
                                }

                                if (viewMode === 'days') {
                                    if (!isMidnight && idx !== 0) return null;
                                    return (
                                        <div key={date.toISOString()} className={`flex-shrink-0 flex items-center justify-center border-l border-border-subtle/50 ${isEvenDay ? 'bg-surface-dark/5' : ''}`} style={{ width: `${CELL_WIDTH * 24}px` }}>
                                            <span className="text-[11px] uppercase font-bold text-text-primary px-2 bg-surface-elevated/80 rounded z-10 whitespace-nowrap">
                                                {format(date, 'dd MMM', { locale: ptBR })}
                                            </span>
                                        </div>
                                    );
                                }

                                if (!isLabelBound && !isMidnight && idx !== 0) {
                                    return (
                                        <div key={date.toISOString()} className={`flex-shrink-0 border-r border-border-subtle/10 ${isEvenDay ? 'bg-surface-dark/5' : ''}`} style={{ width: `${CELL_WIDTH}px` }} />
                                    );
                                }

                                return (
                                    <div key={date.toISOString()} className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-border-subtle/30 ${isMidnight ? 'border-l border-l-border-subtle/50' : ''} ${isEvenDay ? 'bg-surface-dark/5' : ''}`} style={{ width: `${CELL_WIDTH}px` }}>
                                        {(isMidnight || idx === 0) ? (
                                            <span className="text-[11px] uppercase font-bold text-text-primary absolute top-1 bg-surface-elevated px-1.5 py-0.5 rounded shadow-sm z-10 border border-border-subtle/30">
                                                {format(date, 'dd MMM', { locale: ptBR })}
                                            </span>
                                        ) : null}
                                        <span className={`text-[9px] font-bold mt-3 ${(date.getHours() < 8 || date.getHours() >= 18) ? 'text-text-muted' : 'text-text-primary'}`}>
                                            {format(date, 'HH')}h
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Corpo da Timeline */}
                        <div ref={timelineBodyRef} className="flex flex-col relative min-h-full">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex pointer-events-none z-0">
                                {hoursList.map((date, i) => {
                                    const isInterval = date.getHours() % labelInterval === 0;
                                    const isMidnight = date.getHours() === 0;
                                    const isEvenDay = getDate(date) % 2 === 0;

                                    if (viewMode === 'months') {
                                        if (!isMidnight || date.getDate() !== 1) {
                                            if (i !== 0) return null;
                                        }
                                        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                                        return (
                                            <div key={i} className={`flex-shrink-0 border-r ${isEvenDay ? 'bg-surface-dark/10' : ''} border-border-subtle/20 border-r-2`} style={{ width: `${CELL_WIDTH * 24 * daysInMonth}px` }} />
                                        );
                                    }

                                    if (viewMode === 'weeks') {
                                        if (!isMidnight || date.getDay() !== 1) {
                                            if (i !== 0) return null;
                                        }
                                        return (
                                            <div key={i} className={`flex-shrink-0 border-r ${isEvenDay ? 'bg-surface-dark/10' : ''} border-border-subtle/20 border-r-2`} style={{ width: `${CELL_WIDTH * 168}px` }} />
                                        );
                                    }

                                    if (viewMode === 'days') {
                                        if (!isMidnight && i !== 0) return null;
                                        return (
                                            <div key={i} className={`flex-shrink-0 border-r ${isEvenDay ? 'bg-surface-dark/10' : ''} border-border-subtle/20 border-r-2`} style={{ width: `${CELL_WIDTH * 24}px` }} />
                                        );
                                    }

                                    return (
                                        <div key={i} className={`flex-shrink-0 border-r ${isEvenDay ? 'bg-surface-dark/10' : ''} ${isInterval ? 'border-border-subtle/20' : 'border-transparent'} ${isMidnight ? 'border-r-2 border-r-border-subtle/20' : ''}`} style={{ width: `${CELL_WIDTH}px` }} />
                                    );
                                })}
                            </div>

                            {/* Milestone Fixo (Desbloqueio) */}
                            {milestoneTask && (() => {
                                const mEnd = parseISO(milestoneTask.endDate);
                                const offset = (differenceInMinutes(mEnd, minDate) / 60) * CELL_WIDTH;
                                return (
                                    <div className="absolute top-0 bottom-0 z-30 border-l-2 border-red-500/50 pointer-events-none" style={{ left: `${offset}px` }}>
                                        <div className="bg-red-500/80 text-white text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap -mt-2">DESBLOQUEIO</div>
                                    </div>
                                );
                            })()}

                            {/* Marcador Arrastável */}
                            <div 
                                className="absolute top-0 bottom-0 z-40 flex flex-col items-center group/marker pointer-events-none"
                                style={{ left: `${markerOffset}px`, width: '2px', marginLeft: '-1px' }}
                            >
                                <div 
                                    onMouseDown={startDraggingMarker}
                                    className="h-7 px-2 bg-red-600 text-white rounded-md flex items-center gap-1.5 cursor-ew-resize shadow-lg -mt-3 absolute z-50 hover:scale-110 hover:bg-red-500 transition-transform whitespace-nowrap pointer-events-auto"
                                >
                                    <MoveHorizontal size={14} />
                                    <span className="text-[10px] font-bold">
                                        {format(markerTime, "dd/MM HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                {/* A própria linha agora pode ser arrastada */}
                                <div 
                                    onMouseDown={startDraggingMarker}
                                    className="absolute top-0 bottom-0 w-[4px] -ml-[1px] bg-red-600/80 group-hover/marker:bg-red-500 transition-colors bg-gradient-to-b from-red-600 to-transparent cursor-ew-resize pointer-events-auto" 
                                />
                            </div>

                            <div className="pt-0">
                                {Object.entries(groupedTasks).map(([projectName, projectTasks]) => {
                                    const isCollapsed = collapsedProjects.has(projectName);
                                    return (
                                    <React.Fragment key={projectName}>
                                        <div className="h-10 border-b border-border-subtle/10" />
                                        {!isCollapsed && projectTasks.map((task, idx) => {
                                            const tStart = parseISO(task.startDate);
                                            const tEnd = parseISO(task.endDate);
                                            const startOffsetHours = differenceInMinutes(tStart, minDate) / 60;
                                            const durationHours = differenceInMinutes(tEnd, tStart) / 60;
                                            
                                            const left = startOffsetHours * CELL_WIDTH;
                                            const width = Math.max(durationHours * CELL_WIDTH, 4);

                                            const baseColorClass = task.color || colors[idx % colors.length];
                                            
                                            // Estilo para concluído
                                            const barClass = task.isCompleted 
                                                ? 'bg-slate-300 opacity-60 brightness-90 grayscale-[0.5] pattern-diagonal-lines shadow-none border-slate-400/30' 
                                                : `${baseColorClass} border-white/20 shadow-sm`;

                                            return (
                                                <div key={task.id} className="h-11 flex items-center relative z-10 w-full hover:bg-surface-elevated/5 transition-colors group">
                                                    <div
                                                        className={`absolute h-7 rounded-md border flex items-center px-1.5 transition-all hover:scale-y-[1.1] hover:brightness-110 ${barClass}`}
                                                        style={{ left: `${left}px`, width: `${width}px` }}
                                                        title={`${task.activity}${task.isCompleted ? ' (Concluída)' : ''}`}
                                                    >
                                                        {width > 30 && (
                                                            <div className="flex items-center gap-1 min-w-0 flex-1 pointer-events-none">
                                                                {task.isCompleted && <CheckCircle2 size={10} className="text-emerald-700 flex-shrink-0" />}
                                                                <span className={`text-[11px] font-bold truncate max-w-full ${task.isCompleted ? 'text-slate-700' : 'text-white'}`}>
                                                                    {task.activity}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Link connector handle (right side) */}
                                                    <div
                                                        className={`absolute w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-md cursor-crosshair z-30 transition-all hover:scale-150 ${linkingFrom === task.id ? 'scale-150 ring-2 ring-orange-400' : 'opacity-0 group-hover:opacity-100'}`}
                                                        style={{ left: `${left + width - 2}px`, top: '50%', transform: 'translateY(-50%)' }}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setLinkingFrom(task.id);
                                                            document.body.style.cursor = 'crosshair';
                                                            document.body.style.userSelect = 'none';
                                                        }}
                                                        title="Arraste para conectar com outra tarefa"
                                                    />
                                                    
                                                    {/* Link drop target (left side) - visible when linking */}
                                                    {linkingFrom && linkingFrom !== task.id && (
                                                        <div
                                                            className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg z-30 animate-pulse cursor-pointer"
                                                            style={{ left: `${left - 6}px`, top: '50%', transform: 'translateY(-50%)' }}
                                                            onMouseUp={(e) => {
                                                                e.stopPropagation();
                                                                if (linkingFrom) {
                                                                    onLinkTasks(linkingFrom, task.id);
                                                                    setLinkingFrom(null);
                                                                    setLinkMousePos(null);
                                                                    document.body.style.cursor = 'default';
                                                                }
                                                            }}
                                                            title={`Soltar aqui para definir como sucessora de ${tasks.find(t => t.id === linkingFrom)?.activity || ''}`}
                                                        />
                                                    )}
                                                    
                                                    {/* Horários na frente da barra */}
                                                    <div 
                                                        className={`absolute text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 pointer-events-none transition-all ${task.isCompleted ? 'opacity-40 line-through text-slate-400' : 'opacity-80 group-hover:opacity-100 group-hover:text-text-primary text-text-muted'}`}
                                                        style={{ left: `${left + width + 10}px` }}
                                                    >
                                                        <span className="bg-surface-elevated px-2 py-1 rounded-md border border-border-subtle/40 shadow-sm">{format(tStart, 'HH:mm')}</span>
                                                        <span className="text-[9px] uppercase">às</span>
                                                        <span className="bg-surface-elevated px-2 py-1 rounded-md border border-border-subtle/40 shadow-sm">{format(tEnd, 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Dependency Arrows SVG Overlay */}
                            {dependencyArrows.length > 0 && (
                                <svg className="absolute inset-0 pointer-events-none z-[1]" style={{ overflow: 'visible' }}>
                                    <defs>
                                        <marker
                                            id="arrowhead"
                                            markerWidth="8"
                                            markerHeight="6"
                                            refX="7"
                                            refY="3"
                                            orient="auto"
                                        >
                                            <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
                                        </marker>
                                    </defs>
                                    {dependencyArrows.map((arrow, i) => {
                                        const { fromX, fromY, toX, toY } = arrow;
                                        
                                        // Finish-to-Start: right from end, down, then right into start of successor
                                        const gapX = 10; // small gap going right from bar end
                                        const path = `M ${fromX} ${fromY} L ${fromX + gapX} ${fromY} L ${fromX + gapX} ${toY} L ${toX} ${toY}`;

                                        return (
                                            <path
                                                key={i}
                                                d={path}
                                                stroke="#f97316"
                                                strokeWidth="1.5"
                                                fill="none"
                                                strokeLinejoin="round"
                                                markerEnd="url(#arrowhead)"
                                                opacity="0.7"
                                            />
                                        );
                                    })}
                                </svg>
                            )}

                            {/* Temporary linking line */}
                            {linkingFrom && linkMousePos && (() => {
                                const fromTask = tasks.find(t => t.id === linkingFrom);
                                if (!fromTask) return null;
                                const fromEnd = parseISO(fromTask.endDate);
                                const fromX = (differenceInMinutes(fromEnd, minDate) / 60) * CELL_WIDTH;
                                
                                // Calculate fromY based on visible rows
                                let fromY = 0;
                                let found = false;
                                for (const [projectName, projectTasks] of Object.entries(groupedTasks)) {
                                    fromY += 40; // project header
                                    const isCollapsed = collapsedProjects.has(projectName);
                                    if (!isCollapsed) {
                                        for (const t of projectTasks) {
                                            if (t.id === linkingFrom) { fromY += 22; found = true; break; }
                                            fromY += 44;
                                        }
                                    }
                                    if (found) break;
                                }

                                return (
                                    <svg className="absolute inset-0 pointer-events-none z-[2]" style={{ overflow: 'visible' }}>
                                        <line
                                            x1={fromX}
                                            y1={fromY}
                                            x2={linkMousePos.x}
                                            y2={linkMousePos.y}
                                            stroke="#f97316"
                                            strokeWidth="2"
                                            strokeDasharray="6 3"
                                            opacity="0.8"
                                        />
                                        <circle cx={linkMousePos.x} cy={linkMousePos.y} r="4" fill="#f97316" opacity="0.8" />
                                    </svg>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
