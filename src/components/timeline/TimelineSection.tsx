import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Download, Maximize2, Minimize2 } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { GanttChart } from './GanttChart';
import type { TimelineTask } from '../../types';

interface TimelineSectionProps {
    projects: string[];
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ projects }) => {
    const [tasks, setTasks] = useState<TimelineTask[]>(() => {
        const saved = localStorage.getItem('altbase_tasks');
        const parsed = saved ? JSON.parse(saved) : [];
        // Garantir que isCompleted exista para tarefas antigas
        return parsed.map((t: any) => ({ ...t, isCompleted: !!t.isCompleted }));
    });
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<TimelineTask | undefined>(undefined);
    const [preFilled, setPreFilled] = useState<{ project: string, company: string } | undefined>(undefined);
    const [isExporting, setIsExporting] = useState(false);
    const [markerOffset, setMarkerOffset] = useState(100);
    const [savedScroll, setSavedScroll] = useState({ left: 0, top: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'hours' | 'days'>('hours');
    const [savedScrollY, setSavedScrollY] = useState<{ windowY: number, containerY: number } | null>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);

    const openForm = () => {
        setSavedScrollY({
            windowY: window.scrollY,
            containerY: fullscreenRef.current?.scrollTop || 0
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        if (savedScrollY) {
            const scrollPos = savedScrollY;
            // Wait for React to mount the GanttChart, then restore scroll
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.scrollTo({ top: scrollPos.windowY, behavior: 'instant' });
                    if (fullscreenRef.current) {
                        fullscreenRef.current.scrollTop = scrollPos.containerY;
                    }
                }, 50);
            });
        }
    };

    const handleEditTask = (task: TimelineTask) => {
        setEditingTask(task);
        setPreFilled(undefined);
        openForm();
    };

    const handleAddTaskToProject = (project: string, company: string) => {
        setPreFilled({ project, company });
        setEditingTask(undefined);
        openForm();
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => {
            const nextTasks = prev.filter(t => t.id !== taskId);
            localStorage.setItem('altbase_tasks', JSON.stringify(nextTasks));
            return nextTasks;
        });
    };

    const handleSaveTasks = (newTasks: TimelineTask[]) => {
        setTasks(prev => {
            const nextTasks = [...prev];
            newTasks.forEach(newTask => {
                const idx = nextTasks.findIndex(t => t.id === newTask.id);
                if (idx >= 0) {
                    nextTasks[idx] = newTask;
                } else {
                    nextTasks.push(newTask);
                }
            });
            localStorage.setItem('altbase_tasks', JSON.stringify(nextTasks));
            return nextTasks;
        });
        closeForm();
        setEditingTask(undefined);
        setPreFilled(undefined);
    };

    const handleCancelForm = () => {
        closeForm();
        setEditingTask(undefined);
        setPreFilled(undefined);
    };

    const handleToggleTaskCompletion = (taskId: string) => {
        setTasks(prev => {
            const nextTasks = prev.map(t => 
                t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
            );
            localStorage.setItem('altbase_tasks', JSON.stringify(nextTasks));
            return nextTasks;
        });
    };

    const handleReorderTasks = (newTasks: TimelineTask[]) => {
        setTasks(newTasks);
        localStorage.setItem('altbase_tasks', JSON.stringify(newTasks));
    };

    const handleLinkTasks = (predecessorId: string, successorId: string) => {
        setTasks(prev => {
            const predTask = prev.find(t => t.id === predecessorId);
            const succTask = prev.find(t => t.id === successorId);
            
            if (!predTask || !succTask) return prev;

            const predEnd = new Date(predTask.endDate);
            const succStart = new Date(succTask.startDate);
            const succEnd = new Date(succTask.endDate);
            const duration = succEnd.getTime() - succStart.getTime();

            // Successor starts right after predecessor ends
            const newStart = predEnd;
            const newEnd = new Date(newStart.getTime() + duration);

            // Format as ISO string for datetime-local inputs
            const formatDate = (d: Date) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            const nextTasks = prev.map(t =>
                t.id === successorId 
                    ? { ...t, predecessor: predecessorId, startDate: formatDate(newStart), endDate: formatDate(newEnd) } 
                    : t
            );
            localStorage.setItem('altbase_tasks', JSON.stringify(nextTasks));
            return nextTasks;
        });
    };

    const handleRenameProject = (oldName: string, newName: string) => {
        setTasks(prev => {
            const nextTasks = prev.map(t => 
                t.project === oldName ? { ...t, project: newName } : t
            );
            localStorage.setItem('altbase_tasks', JSON.stringify(nextTasks));
            return nextTasks;
        });
    };

    // Tela cheia
    const toggleFullscreen = useCallback(() => {
        if (!fullscreenRef.current) return;

        if (!document.fullscreenElement) {
            fullscreenRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(() => {});
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleExportPDF = () => {
        setIsExporting(true);

        const printStyle = document.createElement('style');
        printStyle.id = 'gantt-print-style';
        printStyle.textContent = `
            @media print {
                body > * { display: none !important; }
                #root { display: block !important; }
                #root > * { display: none !important; }

                #gantt-print-area {
                    display: block !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: auto !important;
                    max-width: none !important;
                    overflow: visible !important;
                    z-index: 99999 !important;
                    background: white !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    padding: 10px !important;
                }

                #gantt-print-area * {
                    overflow: visible !important;
                    position: relative !important;
                }

                #gantt-print-area .opacity-0 {
                    opacity: 0 !important;
                }

                #gantt-print-area button { display: none !important; }

                #gantt-print-area .pointer-events-none {
                    opacity: 1 !important;
                }

                @page {
                    size: landscape;
                    margin: 5mm;
                }
            }
        `;
        document.head.appendChild(printStyle);

        const ganttContainer = document.getElementById('gantt-container');
        if (!ganttContainer) {
            setIsExporting(false);
            return;
        }

        const printArea = ganttContainer.cloneNode(true) as HTMLElement;
        printArea.id = 'gantt-print-area';
        
        const scrollDiv = printArea.querySelector('.overflow-x-auto') as HTMLElement;
        if (scrollDiv) {
            scrollDiv.style.overflow = 'visible';
            scrollDiv.style.maxWidth = 'none';
        }

        const stickyEls = printArea.querySelectorAll('.sticky');
        stickyEls.forEach(el => {
            (el as HTMLElement).style.position = 'relative';
        });

        document.body.appendChild(printArea);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                printArea.remove();
                printStyle.remove();
                setIsExporting(false);
            }, 500);
        }, 300);
    };

    return (
        <div 
            ref={fullscreenRef} 
            className={`animate-fade-in space-y-6 ${isFullscreen ? 'bg-surface-dark p-6 overflow-auto' : ''}`}
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Crie sua linha do tempo</h2>
                </div>
                {!showForm && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center bg-surface-elevated rounded-xl border border-border-subtle p-1 mr-2">
                            <button
                                onClick={() => setViewMode('hours')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'hours' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Horas
                            </button>
                            <button
                                onClick={() => setViewMode('days')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'days' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Dias
                            </button>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary transition-all flex-shrink-0"
                            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || tasks.length === 0}
                            className="h-10 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">{isExporting ? 'Gerando...' : 'Exportar PDF'}</span>
                        </button>
                        <button
                            onClick={() => {
                                setEditingTask(undefined);
                                setPreFilled(undefined);
                                openForm();
                            }}
                            className="h-10 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Nova Atividade</span>
                        </button>
                    </div>
                )}
            </div>

            {showForm ? (
                <TaskForm
                    onSave={handleSaveTasks}
                    onCancel={handleCancelForm}
                    projects={projects}
                    existingTasks={tasks}
                    taskToEdit={editingTask}
                    initialProject={preFilled?.project}
                    initialCompany={preFilled?.company}
                />
            ) : (
                <GanttChart 
                    tasks={tasks} 
                    onEditTask={handleEditTask} 
                    onDeleteTask={handleDeleteTask}
                    onAddTaskToProject={handleAddTaskToProject}
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                    onRenameProject={handleRenameProject}
                    onReorderTasks={handleReorderTasks}
                    onLinkTasks={handleLinkTasks}
                    viewMode={viewMode}
                    markerOffset={markerOffset}
                    onMarkerOffsetChange={setMarkerOffset}
                    scrollLeft={savedScroll.left}
                    scrollTop={savedScroll.top}
                    onScrollChange={(left, top) => setSavedScroll({ left, top })}
                />
            )}
        </div>
    );
};
