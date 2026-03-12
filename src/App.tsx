import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  LayoutDashboard, 
  ListTodo, 
  PenTool, 
  Plus, 
  Target, 
  AlertCircle,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Subject } from './types';

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'schedule'>('dashboard');
  const [showSolveModal, setShowSolveModal] = useState<Subject | null>(null);
  const [solveCount, setSolveCount] = useState(1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Request Notification Permission
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification("UNIVESP: Lembretes Ativados!", {
        body: "Você será lembrado de suas metas ao abrir o app.",
      });
    }
  };

  // Notifications logic
  useEffect(() => {
    if (data && notificationsEnabled && !loading) {
      const totalSolved = data.subjects.reduce((acc, s) => acc + s.solved_questions, 0);
      const todayName = DAYS[new Date().getDay()];
      const todaySchedule = data.schedule.find(s => s.day_of_week === todayName);
      const todayTasks = todaySchedule?.tasks.split(',') || [];
      const allTasksDone = todayTasks.length > 0 && todayTasks.every((_, i) => 
        data.completions?.find(c => c.task_index === i)?.completed === 1
      );

      if (totalSolved < data.stats.daily_goal_questions || !allTasksDone) {
        new Notification("UNIVESP: Metas Pendentes", {
          body: "Você ainda tem questões ou tarefas para concluir hoje!",
        });
      }
    }
  }, [data, notificationsEnabled, loading]);

  const handleSolve = async () => {
    if (!showSolveModal) return;
    try {
      await fetch(`/api/subjects/${showSolveModal.id}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: solveCount })
      });
      setShowSolveModal(null);
      setSolveCount(1);
      fetchData();
    } catch (error) {
      console.error("Error solving questions:", error);
    }
  };

  const toggleTask = async (index: number, currentStatus: boolean) => {
    try {
      await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_index: index, completed: !currentStatus })
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const updateStats = async (days: string, goal: string) => {
    try {
      await fetch('/api/stats/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days_until_exam: days, daily_goal_questions: goal })
      });
      fetchData();
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const subjectsExceptEssay = data.subjects.filter(s => s.name !== 'Redação');
  const essaySubject = data.subjects.find(s => s.name === 'Redação');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sistema Online</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              UNIVESP <span className="text-indigo-600">Planner</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {!notificationsEnabled && (
              <button 
                onClick={requestNotificationPermission}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Ativar Notificações
              </button>
            )}
            <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-slate-50 group-hover:text-slate-100 transition-colors duration-500">
              <Calendar size={120} />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dias para o Exame</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-bold text-slate-900">{data.stats.days_until_exam}</h2>
              <span className="text-sm font-medium text-slate-400">dias</span>
            </div>
            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (data.stats.days_until_exam / 60) * 100)}%` }}
                className="h-full bg-indigo-600"
              />
            </div>
          </div>

          <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <Target size={120} />
            </div>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-2">Meta Diária</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-bold">
                {data.subjects.reduce((acc, s) => acc + s.solved_questions, 0)}
                <span className="text-2xl opacity-40 mx-1">/</span>
                {data.stats.daily_goal_questions}
              </h2>
            </div>
            <p className="text-xs mt-2 opacity-70">Questões resolvidas hoje</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-slate-50 group-hover:text-slate-100 transition-colors duration-500">
              <PenTool size={120} />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Redações Semanais</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-bold text-slate-900">
                {essaySubject?.solved_questions || 0}
                <span className="text-2xl opacity-20 mx-1">/</span>
                {data.stats.weekly_goal_essays}
              </h2>
            </div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: data.stats.weekly_goal_essays }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full ${i < (essaySubject?.solved_questions || 0) ? 'bg-indigo-600' : 'bg-slate-100'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'subjects', label: 'Matérias', icon: BookOpen },
            { id: 'schedule', label: 'Cronograma', icon: ListTodo },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Today's Tasks */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Tarefas de Hoje</h3>
                  <span className="text-xs font-medium text-slate-400">
                    {DAYS[new Date().getDay()]}
                  </span>
                </div>
                <div className="space-y-3">
                  {data.schedule.find(s => s.day_of_week === DAYS[new Date().getDay()])?.tasks.split(',').map((task, i) => {
                    const isCompleted = data.completions?.find(c => c.task_index === i)?.completed === 1;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleTask(i, isCompleted)}
                        className={`w-full p-5 rounded-xl border transition-all flex items-center justify-between group ${
                          isCompleted 
                            ? 'bg-slate-50 border-slate-200 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                          }`}>
                            {isCompleted && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <span className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {task.trim()}
                          </span>
                        </div>
                        <ChevronRight size={14} className={`text-slate-300 group-hover:text-indigo-400 transition-colors ${isCompleted ? 'hidden' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Quick Progress */}
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Progresso Rápido</h3>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="space-y-5">
                    {subjectsExceptEssay.slice(0, 4).map((subject) => (
                      <div key={subject.id}>
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-xs font-bold text-slate-700">{subject.name}</span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {subject.solved_questions} / {subject.commented_questions}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(subject.solved_questions / subject.commented_questions) * 100}%` }}
                            className="h-full bg-indigo-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('subjects')}
                    className="w-full mt-6 p-3 text-indigo-600 bg-indigo-50 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                  >
                    Ver Todas as Matérias
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {data.subjects.map((subject) => (
                <div 
                  key={subject.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900">{subject.name}</h4>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
                      {Math.round((subject.solved_questions / subject.commented_questions) * 100)}%
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questões Comentadas</p>
                      <p className="text-sm font-bold text-slate-700">{subject.solved_questions} / {subject.commented_questions}</p>
                    </div>
                    {subject.exam_questions > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questões de Prova</p>
                        <p className="text-sm font-bold text-slate-700">{subject.exam_questions}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(subject.solved_questions / subject.commented_questions) * 100}%` }}
                        className="h-full bg-indigo-600"
                      />
                    </div>
                    <button 
                      onClick={() => setShowSolveModal(subject)}
                      className="w-full p-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Adicionar Progresso
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {data.schedule.map((day) => (
                <div 
                  key={day.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    day.day_of_week === DAYS[new Date().getDay()]
                      ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{day.day_of_week}</h4>
                      {day.day_of_week === DAYS[new Date().getDay()] && (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-bold uppercase tracking-wider">Hoje</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.tasks.split(',').map((task, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold">
                          {task.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Solve Modal */}
      <AnimatePresence>
        {showSolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSolveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-1">Registrar Progresso</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-8">{showSolveModal.name}</p>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Quantidade de Questões</label>
                  <div className="flex items-center justify-between gap-4">
                    <button 
                      onClick={() => setSolveCount(Math.max(1, solveCount - 1))}
                      className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-5xl font-bold text-slate-900">{solveCount}</span>
                    <button 
                      onClick={() => setSolveCount(solveCount + 1)}
                      className="w-14 h-14 rounded-xl border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSolveModal(null)}
                    className="flex-1 p-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSolve}
                    className="flex-1 p-3.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Simplified) */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => {
            const days = prompt("Dias para o exame:", data.stats.days_until_exam.toString());
            const goal = prompt("Meta diária de questões:", data.stats.daily_goal_questions.toString());
            if (days && goal) updateStats(days, goal);
          }}
          className="w-14 h-14 bg-white border border-slate-200 rounded-2xl shadow-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
        >
          <Clock size={24} />
        </button>
      </div>

      {/* Footer Info */}
      <footer className="mt-10 px-6 md:px-10 pb-12 border-t border-slate-200 pt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-slate-400">
            <BookOpen size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Planner Independente v1.0</span>
          </div>
          <div className="flex gap-8">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">Status do Banco</p>
              <p className="text-xs font-bold text-slate-500">SQLite Local Ativo</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
