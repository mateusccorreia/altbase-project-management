import { useState, useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ProjectTable } from './components/dashboard/ProjectTable';
import { mockProjectData } from './services/mockData';
import type { Project } from './types';

function App() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to SharePoint/Database
    setTimeout(() => {
      // @ts-ignore - mockData might be groups, assuming we flatten or it is adjusted
      setData(mockProjectData);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex h-screen bg-monday-bg font-sans text-monday-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Project Roadmap 2026</h2>
                <p className="text-gray-500 text-sm">Strategic Overview & Execution</p>
              </div>
              <button className="bg-monday-blue text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-600 transition text-sm font-semibold flex items-center">
                New Item
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-monday-blue"></div>
              </div>
            ) : (
              <ProjectTable projects={data} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
