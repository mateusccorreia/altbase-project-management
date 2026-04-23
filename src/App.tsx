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
import { ProjectForm } from './components/dashboard/ProjectForm';
import { TimelineSection } from './components/timeline/TimelineSection';
import { PlanningSection } from './components/planning/PlanningSection';
import { Plus, FileSpreadsheet, RefreshCw, CloudOff, PlugZap, LogOut } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';

// ============================================
// CONFIGURE SEU SHAREPOINT AQUI
// ============================================
const SHAREPOINT_SITE_URL = "https://your-company.sharepoint.com/sites/YourProjectSite";
// ============================================

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState<{ name: string; email: string; picture?: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('altbase_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthChecking(false);
    loadData();
  }, []);

  const handleLogin = (userData: { name: string; email: string; picture?: string }) => {
    setUser(userData);
    localStorage.setItem('altbase_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('altbase_user');
  };

  const handleSaveProject = (projectData: Omit<Project, 'id'>) => {
    if (editingProject) {
      // === EDIT MODE ===
      setProjects(prev => {
        const next = prev.map(p =>
          p.id === editingProject.id ? { ...projectData, id: editingProject.id } : p
        );
        localStorage.setItem('altbase_projects', JSON.stringify(next));
        return next;
      });
    } else {
      // === CREATE MODE ===
      const newId = Math.max(...projects.map(p => p.id), 0) + 1;
      const newProject: Project = { ...projectData, id: newId };

      setProjects(prev => {
        const next = [newProject, ...prev];
        localStorage.setItem('altbase_projects', JSON.stringify(next));
        return next;
      });
    }

    setShowForm(false);
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDeleteProject = (projectId: number) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    
    setProjects(prev => {
      const next = prev.filter(p => p.id !== projectId);
      localStorage.setItem('altbase_projects', JSON.stringify(next));
      return next;
    });

    // Cleanup related tasks
    if (projectToDelete) {
      const savedTasks = localStorage.getItem('altbase_tasks');
      if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        const filteredTasks = tasks.filter((t: any) => t.project !== projectToDelete.title);
        localStorage.setItem('altbase_tasks', JSON.stringify(filteredTasks));
      }
    }

    // Cleanup planning data
    const savedPlanning = localStorage.getItem('altbase_project_planning');
    if (savedPlanning) {
      const planning = JSON.parse(savedPlanning);
      const filteredPlanning = planning.filter((p: any) => p.projectId !== projectId);
      localStorage.setItem('altbase_project_planning', JSON.stringify(filteredPlanning));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Tenta buscar do SharePoint real (comentado para forçar uso de mocks)
      /*
      console.log(`Tentando conectar ao SharePoint: ${SHAREPOINT_SITE_URL}...`);
      const spData = await fetchProjectsFromSP(SHAREPOINT_SITE_URL);

      if (spData && spData.length > 0) {
        setProjects(spData);
        setUsingMockData(false);
        console.log("Sucesso: Dados carregados do SharePoint.");
      } else {
        throw new Error("Nenhum dado retornado ou lista vazia.");
      }
      */

      // Tenta recuperar do localStorage (modo local)
      const cached = localStorage.getItem('altbase_projects');
      if (cached) {
        setProjects(JSON.parse(cached));
        console.log("Sucesso: Dados carregados do LocalStorage.");
      } else {
        // Primeira visita: popula com dados de exemplo
        setProjects(mockProjects);
        localStorage.setItem('altbase_projects', JSON.stringify(mockProjects));
        console.log("Primeira visita: dados de exemplo carregados.");
      }
      setUsingMockData(true);
    } catch (error) {
      console.warn("Falha ao carregar dados.", error);
      setUsingMockData(true);
      setProjects([]);
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

  if (authChecking) {
    return <div className="min-h-screen bg-surface-dark flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-dark">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isSidebarOpen={sidebarOpen}
          user={user}
        />

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
                {/* Connection Status Banners (Always visible if relevant) */}
                {/* Global Status Banner */}
                {usingMockData && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in mb-6 shadow-sm">
                    <CloudOff size={22} className="text-amber-600" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-700">Modo Local Ativo</p>
                      <p className="text-xs text-text-secondary font-medium">
                        Seus dados estão sendo salvos no LocalStorage deste navegador. 
                        <span className="text-amber-700 font-bold ml-1">Atenção: Limpar o cache ou dados do site apagará todos os seus projetos e timelines permanentemente.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ================= DASHBOARD VIEW ================= */}
                {activePage === 'dashboard' && (
                  <div className="animate-fade-in">
                    {showForm ? (
                      <ProjectForm
                        initialData={editingProject || undefined}
                        onSave={handleSaveProject}
                        onCancel={() => { setShowForm(false); setEditingProject(null); }}
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-text-primary">Dashboard</h2>
                          <button
                            onClick={() => { setEditingProject(null); setShowForm(true); }}
                            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 transition-all text-sm font-medium"
                          >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Adicionar Dados</span>
                          </button>
                        </div>

                        <StatsCards stats={stats} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <StatusChart projects={projects} />
                          <div className="lg:col-span-2">
                            <BudgetChart projects={projects} />
                          </div>
                        </div>

                        {/* Project List on Dashboard */}
                        <div className="pt-4 space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

                          <ProjectTable
                            projects={filteredProjects}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= PROJECTS VIEW ================= */}
                {activePage === 'projects' && (
                  <div className="animate-fade-in">
                    {showForm ? (
                      <ProjectForm
                        initialData={editingProject || undefined}
                        onSave={handleSaveProject}
                        onCancel={() => { setShowForm(false); setEditingProject(null); }}
                      />
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
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

                            <button
                              onClick={() => { setEditingProject(null); setShowForm(true); }}
                              className="h-10 px-4 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 transition-all text-sm font-medium"
                            >
                              <Plus size={16} />
                              <span className="hidden sm:inline">Novo</span>
                            </button>
                          </div>
                        </div>

                        <ProjectTable
                          projects={filteredProjects}
                          onEdit={handleEditProject}
                          onDelete={handleDeleteProject}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* ================= PLANNING VIEW ================= */}
                {activePage === 'planning' && (
                  <PlanningSection projects={projects} />
                )}

                {/* ================= TIMELINE VIEW ================= */}
                {activePage === 'timeline' && (
                  <TimelineSection projects={Array.from(new Set(projects.map(p => p.title)))} />
                )}

                {/* ================= REPORTS VIEW (Placeholder) ================= */}
                {activePage === 'reports' && (
                  <div className="flex flex-col items-center justify-center h-64 text-text-muted animate-fade-in border border-dashed border-border-subtle rounded-2xl bg-surface-card/50">
                    <FileSpreadsheet size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">Relatórios em desenvolvimento</p>
                    <p className="text-sm">Esta funcionalidade estará disponível em breve.</p>
                  </div>
                )}

              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
