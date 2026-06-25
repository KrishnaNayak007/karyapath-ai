import React from 'react';
import { LayoutDashboard, Calendar, PlusCircle, RotateCcw, Sparkles, LogOut } from 'lucide-react';
import { resetDb } from '../services/api';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onReset: () => void;
  currentUser: { email: string; name: string; avatarUrl: string } | null;
  onLogout: () => void;
}

export default function Navbar({ currentPage, setCurrentPage, onReset, currentUser, onLogout }: NavbarProps) {
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the database to the initial seeded state?')) {
      setResetting(true);
      try {
        await resetDb();
        onReset();
      } catch (err) {
        console.error('Reset failed:', err);
      } finally {
        setResetting(false);
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'create-goal', label: 'New Goal', icon: PlusCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('landing')} 
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-2 rounded-lg text-white font-bold shadow-md shadow-[#7C3AED]/20 group-hover:scale-105 transition-all duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#06B6D4] bg-clip-text text-transparent">
            KaryaPath <span className="text-[#7C3AED]">AI</span>
          </span>
        </div>

        {/* Global Navigation links controlled by auth status */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {currentUser ? (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                      isActive 
                        ? 'bg-[#111827] text-[#06B6D4] border border-slate-800' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : ''}`} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}

              {/* Reset button */}
              <button
                onClick={handleReset}
                disabled={resetting}
                title="Reset DB to initial demo state"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 border border-transparent hover:border-rose-500/20 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{resetting ? 'Resetting...' : 'Reset DB'}</span>
              </button>

              {/* User profile & Logout */}
              <div className="flex items-center space-x-3 border-l border-slate-800/80 pl-4 ml-2">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono">{currentUser.email}</span>
                </div>
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-[#06B6D4]/30 object-cover shrink-0" 
                />
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setCurrentPage('login')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED]/25 to-[#06B6D4]/25 border border-[#7C3AED]/35 text-xs font-extrabold text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
              <span>Continue to Workspace</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
