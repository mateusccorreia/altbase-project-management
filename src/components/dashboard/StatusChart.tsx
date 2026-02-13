import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Project } from '../../types';

interface StatusChartProps {
    projects: Project[];
}

export const StatusChart: React.FC<StatusChartProps> = ({ projects }) => {
    const [isOpen, setIsOpen] = useState(true);

    const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});

    const total = projects.length;

    const statusInfo = [
        { label: 'Concluído', color: 'bg-status-complete', ring: 'ring-status-complete' },
        { label: 'Em Andamento', color: 'bg-status-progress', ring: 'ring-status-progress' },
        { label: 'Atrasado', color: 'bg-status-delayed', ring: 'ring-status-delayed' },
        { label: 'Pausado', color: 'bg-status-paused', ring: 'ring-status-paused' },
        { label: 'Não Iniciado', color: 'bg-status-notstarted', ring: 'ring-status-notstarted' },
    ].filter(s => statusCounts[s.label]);

    // Build segments for ring chart
    const segments = statusInfo.map(s => ({
        ...s,
        count: statusCounts[s.label] || 0,
        percentage: ((statusCounts[s.label] || 0) / total) * 100,
    }));

    // Calculate SVG circle segments
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return (
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-6 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Distribuição por Status</h3>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-text-muted hover:text-text-primary"
                    title={isOpen ? 'Recolher' : 'Expandir'}
                >
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}
            >
                <div className="flex flex-col items-center gap-6">
                    {/* Donut chart */}
                    <div className="relative">
                        <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                            {segments.map((seg) => {
                                const segLength = (seg.percentage / 100) * circumference;
                                const offset = circumference - (cumulative / 100) * circumference;
                                cumulative += seg.percentage;

                                const colorMap: Record<string, string> = {
                                    'bg-status-complete': '#10B981', // Green
                                    'bg-status-progress': '#3B82F6', // Blue
                                    'bg-status-delayed': '#EF4444',  // Red
                                    'bg-status-paused': '#F59E0B',   // Amber
                                    'bg-status-notstarted': '#6B7280', // Slate
                                };

                                return (
                                    <circle
                                        key={seg.label}
                                        cx="80"
                                        cy="80"
                                        r={radius}
                                        fill="none"
                                        stroke={colorMap[seg.color] || '#6B7280'}
                                        strokeWidth="20"
                                        strokeDasharray={`${segLength} ${circumference - segLength}`}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-text-primary">{total}</span>
                            <span className="text-xs text-text-muted">projetos</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="w-full space-y-2.5">
                        {segments.map(seg => (
                            <div key={seg.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${seg.color}`}></div>
                                    <span className="text-sm text-text-secondary">{seg.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-text-primary">{seg.count}</span>
                                    <span className="text-xs text-text-muted">({seg.percentage.toFixed(0)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
