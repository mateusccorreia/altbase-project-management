import * as React from 'react';
import styles from './AltbaseDashboard.module.scss';
import type { IAltbaseDashboardProps } from './IAltbaseDashboardProps';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { StatsCards } from './dashboard/StatsCards';
import { StatusChart } from './dashboard/StatusChart';
import { BudgetChart } from './dashboard/BudgetChart';
import { ProjectTable } from './dashboard/ProjectTable';
import { fetchProjectsFromSP, initSP } from '../services/spService';
import { mockProjects } from '../services/mockData';
import { calculateStats } from '../utils/helpers';
import { IProject } from '../types';
import { RefreshCw, CloudOff, PlugZap } from 'lucide-react';

interface IDashboardState {
  projects: IProject[];
  loading: boolean;
  usingMockData: boolean;
  filterStatus: string;
  searchTerm: string;
}

export default class AltbaseDashboard extends React.Component<IAltbaseDashboardProps, IDashboardState> {

  constructor(props: IAltbaseDashboardProps) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
      usingMockData: false,
      filterStatus: 'Todos',
      searchTerm: '',
    };
  }

  public componentDidMount(): void {
    // Initialize PnPjs with the SPFx webpart context
    initSP(this.props.context);
    this._loadData().catch(() => { /* handled inside */ });
  }

  private _loadData = async (): Promise<void> => {
    this.setState({ loading: true });
    try {
      const spData = await fetchProjectsFromSP();
      if (spData && spData.length > 0) {
        this.setState({ projects: spData, usingMockData: false });
      } else {
        throw new Error("Nenhum dado retornado ou lista vazia.");
      }
    } catch (error) {
      console.warn("Falha ao carregar do SharePoint, usando dados de exemplo.", error);
      this.setState({ projects: mockProjects, usingMockData: true });
    } finally {
      this.setState({ loading: false });
    }
  }

  public render(): React.ReactElement<IAltbaseDashboardProps> {
    const { projects, loading, usingMockData, filterStatus, searchTerm } = this.state;
    const { userDisplayName } = this.props;

    const filteredProjects = projects.filter(p => {
      const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.coordinator.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    const stats = calculateStats(projects);
    const statuses = ['Todos', 'Em Andamento', 'Concluído', 'Atrasado', 'Não Iniciado', 'Pausado'];

    return (
      <div className={styles.altbaseDashboard}>
        <Sidebar />

        <div className={styles.mainContent}>
          <Header userDisplayName={userDisplayName} />

          <main className={styles.mainBody}>
            <div className={styles.mainInner}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <div>
                    <div className={styles.spinner} />
                    <p className={styles.loadingText}>Carregando dados do SharePoint...</p>
                  </div>
                </div>
              ) : (
                <>
                  <StatsCards stats={stats} />

                  {/* Filters */}
                  <div className={styles.filtersRow}>
                    <div className={styles.filterButtons}>
                      {statuses.map(s => (
                        <button
                          key={s}
                          onClick={() => this.setState({ filterStatus: s })}
                          className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className={styles.searchGroup}>
                      <input
                        type="text"
                        placeholder="Buscar projeto ou coordenador..."
                        value={searchTerm}
                        onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        className={styles.searchInput}
                      />
                      <button
                        onClick={this._loadData}
                        className={styles.refreshBtn}
                        title="Atualizar dados"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Connection Banner */}
                  {usingMockData && (
                    <div className={`${styles.banner} ${styles.bannerMock}`}>
                      <CloudOff size={18} className={styles.bannerIcon} />
                      <div>
                        <p className={styles.bannerTitle}>Modo de Demonstração (Dados Locais)</p>
                        <p className={styles.bannerDesc}>
                          Não foi possível conectar ao SharePoint. Verifique a lista ou permissões.
                        </p>
                      </div>
                    </div>
                  )}

                  {!usingMockData && (
                    <div className={`${styles.banner} ${styles.bannerLive}`}>
                      <PlugZap size={18} className={styles.bannerIcon} />
                      <div>
                        <p className={styles.bannerTitle}>Conectado ao SharePoint</p>
                        <p className={styles.bannerDesc}>Dados sincronizados em tempo real.</p>
                      </div>
                    </div>
                  )}

                  {/* Charts */}
                  <div className={styles.chartsRow}>
                    <StatusChart projects={projects} />
                    <BudgetChart projects={projects} />
                  </div>

                  {/* Project Table */}
                  <ProjectTable projects={filteredProjects} />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }
}
