import React from 'react';
import { Bell, Search, Settings, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm sticky top-0 z-50">
            {/* Left */}
            <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-monday-blue flex items-center justify-center text-white font-bold text-lg mr-3">
                    M
                </div>
                <h1 className="text-xl font-bold text-monday-dark">Project Strategic Dashboard</h1>
            </div>

            {/* Middle */}
            <div className="flex-1 max-w-xl mx-8 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Search items, projects, people..."
                    className="w-full h-10 pl-10 pr-4 rounded-full bg-monday-bg border border-transparent focus:bg-white focus:border-monday-blue focus:outline-none transition-colors text-sm"
                />
            </div>

            {/* Right */}
            <div className="flex items-center space-x-4 text-gray-500">
                <button className="hover:bg-gray-100 p-2 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-monday-red rounded-full border-2 border-white"></span>
                </button>
                <button className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <Settings size={20} />
                </button>
                <button className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                    <HelpCircle size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-monday-purple flex items-center justify-center text-white text-xs font-bold border-2 border-white cursor-pointer shadow-sm">
                    JS
                </div>
            </div>
        </header>
    );
};
