import React from 'react';
import { LayoutDashboard, Users, Calendar, Settings, Inbox, Menu } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const categories = [
        { label: 'Work Management', icon: <LayoutDashboard size={20} className="mr-3 text-monday-blue" />, active: true },
        { label: 'Project Calendar', icon: <Calendar size={20} className="mr-3 text-monday-green" /> },
        { label: 'Team', icon: <Users size={20} className="mr-3 text-monday-purple" /> },
        { label: 'Inbox', icon: <Inbox size={20} className="mr-3 text-monday-red" /> },
        { label: 'Settings', icon: <Settings size={20} className="mr-3 text-gray-500" /> },
    ];

    return (
        <aside className="w-64 border-r border-gray-200 bg-white h-full flex flex-col hidden md:flex shadow-xl z-20">
            <div className="p-4 h-16 flex items-center border-b border-gray-100">
                <div className="w-8 h-8 bg-monday-blue rounded text-white flex items-center justify-center font-bold mr-2">M</div>
                <span className="font-bold text-lg">Work OS</span>
            </div>
            <div className="p-4">
                <div className="mb-6 flex items-center text-gray-400 text-sm font-semibold uppercase tracking-wider">
                    <span className="flex-1">Main Workspace</span>
                    <button className="hover:text-gray-600"><Menu size={16} /></button>
                </div>

                <nav className="space-y-1">
                    {categories.map((cat, idx) => (
                        <button
                            key={idx}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors 
                                ${cat.active ? 'bg-blue-50 text-monday-blue' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100 mt-auto">
                <div className="bg-gradient-to-tr from-monday-blue to-purple-500 rounded-lg p-4 text-white text-center">
                    <h4 className="font-bold text-sm mb-2">Upgrade to Pro</h4>
                    <p className="text-xs opacity-80 mb-3">Unlock unlimited projects & Gantt charts</p>
                    <button className="bg-white text-monday-dark text-xs font-semibold py-2 px-4 rounded shadow-sm hover:shadow-md transition-shadow w-full">View Plans</button>
                </div>
            </div>
        </aside>
    );
};
