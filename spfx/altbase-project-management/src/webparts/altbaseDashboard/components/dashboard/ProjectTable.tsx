import * as React from 'react';
import styles from '../AltbaseDashboard.module.scss';
import { IProject } from '../../types';
import { formatCurrency, formatDate, getStatusColor, getProgressColor, getDaysRemaining } from '../../utils/helpers';
import { ChevronDown, ChevronUp, MessageSquare, Calendar, Clock } from 'lucide-react';

export interface IProjectTableProps {
    projects: IProject[];
}

interface IProjectTableState {
    expandedId: number | undefined;
    sortField: keyof IProject;
    sortDir: 'asc' | 'desc';
}

export class ProjectTable extends React.Component<IProjectTableProps, IProjectTableState> {
    constructor(props: IProjectTableProps) {
        super(props);
        this.state = {
            expandedId: undefined,
            sortField: 'progress',
            sortDir: 'desc',
        };
    }

    private _handleSort = (field: keyof IProject): void => {
        const { sortField, sortDir } = this.state;
        if (sortField === field) {
            this.setState({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' });
        } else {
            this.setState({ sortField: field, sortDir: 'desc' });
        }
    }

    private _getSorted(): IProject[] {
        const { sortField, sortDir } = this.state;
        return [...this.props.projects].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return sortDir === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }

    private _renderSortIcon(field: keyof IProject): React.ReactElement | null {
        if (this.state.sortField !== field) return null;
        return this.state.sortDir === 'asc'
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />;
    }

    public render(): React.ReactElement<IProjectTableProps> {
        const { expandedId } = this.state;
        const sorted = this._getSorted();

        return (
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Projetos em Acompanhamento</h3>
                    <p className={styles.tableCount}>{this.props.projects.length} projetos</p>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableTh} onClick={() => this._handleSort('title')} style={{ cursor: 'pointer' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        Projeto {this._renderSortIcon('title')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('coordinator')} style={{ cursor: 'pointer' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        Coordenador {this._renderSortIcon('coordinator')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('status')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        Status {this._renderSortIcon('status')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('startDate')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        Início {this._renderSortIcon('startDate')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('endDate')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        Término {this._renderSortIcon('endDate')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('progress')} style={{ cursor: 'pointer', textAlign: 'center', width: 180 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        Progresso {this._renderSortIcon('progress')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('budgetCost')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 4 }}>
                                        Orçado {this._renderSortIcon('budgetCost')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} onClick={() => this._handleSort('actualCost')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 4 }}>
                                        Realizado {this._renderSortIcon('actualCost')}
                                    </span>
                                </th>
                                <th className={styles.tableTh} style={{ width: 40 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((project) => {
                                const isExpanded = expandedId === project.id;
                                const daysRemaining = getDaysRemaining(project.endDate);
                                const costVariance = project.budgetCost > 0
                                    ? ((project.actualCost / project.budgetCost) * 100)
                                    : 0;
                                const isCostOver = costVariance > (project.progress + 10);
                                const statusColor = getStatusColor(project.status);
                                const progressColor = getProgressColor(project.progress);

                                return (
                                    <React.Fragment key={project.id}>
                                        <tr className={styles.tableRow}>
                                            <td className={styles.tableTd}>
                                                <span className={styles.projectTitle}>{project.title}</span>
                                            </td>
                                            <td className={styles.tableTd}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: '50%',
                                                        background: '#334155', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 700, color: '#94A3B8',
                                                    }}>
                                                        {project.coordinator.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{project.coordinator}</span>
                                                </div>
                                            </td>
                                            <td className={styles.tableTd} style={{ textAlign: 'center' }}>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{ background: statusColor, color: '#FFF' }}
                                                >
                                                    <span className={styles.statusDot} style={{ background: 'rgba(255,255,255,0.4)' }} />
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className={styles.tableTd} style={{ textAlign: 'center', fontSize: 13 }}>
                                                {formatDate(project.startDate)}
                                            </td>
                                            <td className={styles.tableTd} style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: 13 }}>{formatDate(project.endDate)}</span>
                                                {project.status !== 'Concluído' && daysRemaining <= 30 && daysRemaining > 0 && (
                                                    <p className={styles.daysRemaining} style={{ color: '#F59E0B', fontSize: 11 }}>
                                                        {daysRemaining}d restantes
                                                    </p>
                                                )}
                                                {project.status !== 'Concluído' && daysRemaining <= 0 && (
                                                    <p className={styles.daysRemaining} style={{ color: '#EF4444', fontSize: 11 }}>
                                                        Vencido
                                                    </p>
                                                )}
                                            </td>
                                            <td className={styles.tableTd}>
                                                <div className={styles.progressBarContainer}>
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressBarFill}
                                                            style={{ width: `${project.progress}%`, background: progressColor }}
                                                        />
                                                    </div>
                                                    <span className={styles.progressText} style={{ color: progressColor }}>
                                                        {project.progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.tableTd} style={{ textAlign: 'right', fontSize: 13, fontWeight: 500 }}>
                                                {formatCurrency(project.budgetCost)}
                                            </td>
                                            <td className={styles.tableTd} style={{
                                                textAlign: 'right', fontSize: 13, fontWeight: 500,
                                                color: isCostOver ? '#EF4444' : '#94A3B8',
                                            }}>
                                                {formatCurrency(project.actualCost)}
                                            </td>
                                            <td className={styles.tableTd} style={{ textAlign: 'center' }}>
                                                <button
                                                    onClick={() => this.setState({ expandedId: isExpanded ? undefined : project.id })}
                                                    className={styles.toggleBtn}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr style={{ background: 'rgba(15,23,42,0.3)' }}>
                                                <td colSpan={9} style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                            <MessageSquare size={16} style={{ color: '#64748B', marginTop: 2, flexShrink: 0 }} />
                                                            <div>
                                                                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                                                                    Comentários
                                                                </p>
                                                                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                                                                    {project.comments || 'Sem comentários.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Calendar size={14} style={{ color: '#64748B' }} />
                                                                <span style={{ fontSize: 12, color: '#64748B' }}>Duração:</span>
                                                                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                                                                    {formatDate(project.startDate)} → {formatDate(project.endDate)}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <Clock size={14} style={{ color: '#64748B' }} />
                                                                <span style={{ fontSize: 12, color: '#64748B' }}>Variação Custo:</span>
                                                                <span style={{
                                                                    fontSize: 12, fontWeight: 700,
                                                                    color: isCostOver ? '#EF4444' : '#10B981',
                                                                }}>
                                                                    {costVariance.toFixed(0)}% do orçamento utilizado
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
