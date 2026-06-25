import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateGoal from './pages/CreateGoal';
import AIBreakdown from './pages/AIBreakdown';
import ReviewSchedule from './pages/ReviewSchedule';
import Calendar from './pages/Calendar';
import GoalDetails from './pages/GoalDetails';
import { Goal, Subtask, ScheduledBlock } from './services/api';

interface User {
  email: string;
  name: string;
  avatarUrl: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('karyapath_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Intercept routing to verify authentication state
  const handleNavigate = (page: string) => {
    if (!currentUser && page !== 'landing' && page !== 'login') {
      setCurrentPage('login');
    } else if (currentUser && page === 'login') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage(page);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('karyapath_user');
    setCurrentUser(null);
    setCurrentPage('landing');
  };
  
  // Shared state for the newly generated goal
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [currentSubtasks, setCurrentSubtasks] = useState<Subtask[]>([]);
  const [currentBlocks, setCurrentBlocks] = useState<ScheduledBlock[]>([]);
  
  // State for Goal details view
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Key to force refresh/re-render child components if the DB resets
  const [dbResetKey, setDbResetKey] = useState<number>(0);

  const handleGoalCreated = (goal: Goal, subtasks: Subtask[], blocks: ScheduledBlock[]) => {
    setCurrentGoal(goal);
    setCurrentSubtasks(subtasks);
    setCurrentBlocks(blocks);
  };

  const handleDbReset = () => {
    setDbResetKey(prev => prev + 1);
    handleNavigate('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing setCurrentPage={handleNavigate} />;
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} setCurrentPage={handleNavigate} />;
      case 'dashboard':
        return (
          <Dashboard 
            key={`dashboard-${dbResetKey}`}
            setCurrentPage={handleNavigate} 
            setSelectedGoalId={setSelectedGoalId} 
          />
        );
      case 'create-goal':
        return (
          <CreateGoal 
            setCurrentPage={handleNavigate} 
            onGoalCreated={handleGoalCreated} 
          />
        );
      case 'ai-breakdown':
        return (
          <AIBreakdown 
            goal={currentGoal} 
            subtasks={currentSubtasks} 
            setCurrentPage={handleNavigate} 
          />
        );
      case 'review-schedule':
        return (
          <ReviewSchedule 
            goal={currentGoal} 
            subtasks={currentSubtasks} 
            blocks={currentBlocks} 
            setCurrentPage={handleNavigate} 
            currentUser={currentUser}
          />
        );
      case 'calendar':
        return <Calendar key={`calendar-${dbResetKey}`} />;
      case 'goal-details':
        return (
          <GoalDetails 
            key={`goal-details-${selectedGoalId}-${dbResetKey}`}
            goalId={selectedGoalId || ''} 
            setCurrentPage={handleNavigate} 
          />
        );
      default:
        return <Landing setCurrentPage={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-[#7C3AED]/30 selection:text-[#06B6D4]">
      {/* Global SaaS Header Navbar */}
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={handleNavigate} 
        onReset={handleDbReset}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Main View Router Content */}
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  );
}
