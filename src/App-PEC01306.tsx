import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatsCards } from './components/dashboard/StatsCards';
import { ProjectTable } from './components/dashboard/ProjectTable';
import { StatusChart } from './components/dashboard/StatusChart';
import { BudgetChart } from './components/dashboard/BudgetChart';
import { fetchProjectsFromSP } from './services/sp';
import { mockProjects } from './services/mockData';
import { calculateStats } from './utils/helpers';
import type { Project } from './types';
import { RefreshCw, CloudOff, PlugZap } from 'lucide-react';

// ============================================
// CONFIGURE SEU SHAREPOINT AQUI
// ============================================
const SHAREPOINT_SITE_URL = "https://arcelormittal.sharepoint.com/sites/GernciadePlanejamentoeProgramao";
// ============================================

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tenta buscar do SharePoint real
      console.log(`Tentando conectar ao SharePoint: ${SHAREPOINT_SITE_URL}...`);
      const spData = await fetchProjectsFromSP(SHAREPOINT_SITE_URL);

      if (spData && spData.length > 0) {
        setProjects(spData);
        setUsingMockData(false);
        console.log("Sucesso: Dados carregados do SharePoint.");
      } else {
        throw new Error("Nenhum dado retornado ou lista vazia.");
      }
    } catch (error) {
      // Fallback para dados de teste (Mock) se falhar
      console.warn("Falha ao carregar do SharePoint, usando dados de exemplo.", error);
      setProjects(mockProjects);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects
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
    <div className="flex h-screen overflow-hidden bg-surface-dark">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-text-muted text-sm">Carregando dados do SharePoint...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Filters + refresh */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`
                          px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                          ${filterStatus === s
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface-card text-text-secondary border border-border-subtle hover:border-primary/30 hover:text-text-primary'
                          }
                        `}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar projeto ou coordenador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 sm:w-72 h-10 px-4 rounded-xl bg-surface-card border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      onClick={loadData}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-card border border-border-subtle hover:border-primary/30 text-text-muted hover:text-primary transition-all"
                      title="Atualizar dados"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                {/* Connection Status Banner (if using mock) */}
                {usingMockData && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                    <CloudOff size={18} className="text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-500">Modo de Demonstração (Dados Locais)</p>
                      <p className="text-xs text-text-muted">
                        Não foi possível conectar ao SharePoint em <code>{SHAREPOINT_SITE_URL}</code>.
                        Verifique a URL no código ou permissões.
                      </p>
                    </div>
                  </div>
                )}

                {/* Connection Success Banner (if real data) */}
                {!usingMockData && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                    <PlugZap size={18} className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-500">Conectado ao SharePoint</p>
                      <p className="text-xs text-text-muted">Dados sincronizados em tempo real.</p>
                    </div>
                  </div>
                )}


                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <StatusChart projects={projects} />
                  <div className="lg:col-span-2">
                    <BudgetChart projects={projects} />
                  </div>
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

export default App;
