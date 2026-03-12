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

  useEffect(() => {
    fetchData();
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

  useEffect(() => {
    if (data && notificationsEnabled && !loading) {
      const totalSolved = data.subjects.reduce((acc, s) => acc + s.solved_questions, 0);
      const todayName = DAYS[new Date().getDay()];
      const todaySchedule = data.schedule.find(s => s.day_of_week === todayName);
      const todayTasks = todaySchedule?.tasks.split(',') || [];
      const allTasksDone = todayTasks.length > 0 && todayTasks.every((_, i) => 
        data.completions.find(c => c.task_index === i)?.completed === 1
      );

      if (totalSolved < data.stats.daily_goal_questions || !allTasksDone) {
        new Notification("UNIVESP: Metas Pendentes", {
          body: "Você ainda tem questões ou tarefas para concluir hoje!",
        });
      }
    }
  }, [data, notificationsEnabled, loading]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = async () => {
    if (!showSolveModal) return;
    try {
      await fetch(`/api/subjects/${showSolveModal.id}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: solveCount }),
      });
      setShowSolveModal(null);
      setSolveCount(1);
      fetchData();
    } catch (err) {
      console.error('Error updating solve count:', err);
    }
  };

  const toggleTask = async (index: number, currentStatus: boolean) => {
    try {
      await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_index: index, completed: !currentStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E4E3E0]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#141414] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const subjectsExceptEssay = data.subjects.filter(s => s.name !== 'Redação');
  const essaySubject = data.subjects.find(s => s.name === 'Redação');
  
  const questionsSolved = subjectsExceptEssay.reduce((acc, s) => acc + s.solved_questions, 0);
  const questionsTotal = subjectsExceptEssay.reduce((acc, s) => acc + s.commented_questions, 0);
  
  const essaysSolved = essaySubject?.solved_questions || 0;
  const essaysTotal = essaySubject?.commented_questions || 0;
  
  const todayName = DAYS[new Date().getDay()];
  const todaySchedule = data.schedule.find(s => s.day_of_week === todayName);
  const todayTasks = todaySchedule?.tasks.split(',') || [];

  const allTasksDone = todayTasks.length > 0 && todayTasks.every((_, i) => 
    data.completions.find(c => c.task_index === i)?.completed === 1
  );
  
  const isGoalMet = questionsSolved >= data.stats.daily_goal_questions && allTasksDone;

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans pb-24">
      {/* Header */}
      <header className="p-6 border-b border-[#141414] bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UNIVESP</h1>
            <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Planejamento de Estudos</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold font-mono">{data.stats.days_until_exam}</span>
            <p className="text-[10px] font-mono opacity-50 uppercase">Dias Restantes</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Goal Banner */}
              <div className={`p-4 rounded-xl border-2 ${isGoalMet ? 'bg-emerald-50 border-emerald-500' : 'bg-orange-50 border-orange-500'} flex items-center gap-4`}>
                {isGoalMet ? (
                  <CheckCircle2 className="text-emerald-500 w-8 h-8 shrink-0" />
                ) : (
                  <AlertCircle className="text-orange-500 w-8 h-8 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold">{isGoalMet ? 'Tudo em dia!' : 'Sistema de Cobrança'}</h3>
                  <p className="text-sm opacity-70">
                    {isGoalMet 
                      ? 'Você completou todas as tarefas e bateu a meta de questões!' 
                      : !allTasksDone 
                        ? 'Você ainda tem tarefas pendentes para hoje no cronograma.'
                        : `Faltam questões para atingir sua meta diária de ${data.stats.daily_goal_questions}.`}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
                  <div className="flex items-center gap-2 mb-2 opacity-50">
                    <Target size={16} />
                    <span className="text-[10px] font-mono uppercase">Questões Resolvidas</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">{questionsSolved}</div>
                  <div className="text-[10px] opacity-50 mt-1">Total de {questionsTotal}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#141414] shadow-[4px_4px_0px_0px_#141414]">
                  <div className="flex items-center gap-2 mb-2 opacity-50">
                    <PenTool size={16} />
                    <span className="text-[10px] font-mono uppercase">Redações Concluídas</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">{essaysSolved}</div>
                  <div className="text-[10px] opacity-50 mt-1">Total de {essaysTotal}</div>
                </div>
              </div>

              {/* Notification Toggle */}
              {!notificationsEnabled && (
                <button 
                  onClick={requestNotificationPermission}
                  className="w-full bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                      <Clock size={20} />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-blue-900 block text-sm">Ativar Lembretes</span>
                      <span className="text-xs text-blue-700 opacity-70">Receba avisos sobre suas metas no navegador</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-blue-400" />
                </button>
              )}

              {/* Today's Schedule Card */}
              <div className="bg-[#141414] text-white p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-400" />
                    <h2 className="font-bold text-lg">Hoje ({todayName})</h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 bg-white/10 rounded uppercase tracking-wider">Cronograma</span>
                </div>
                <div className="space-y-3">
                  {todayTasks.map((task, i) => {
                    const isDone = data.completions.find(c => c.task_index === i)?.completed === 1;
                    return (
                      <button 
                        key={i} 
                        onClick={() => toggleTask(i, isDone)}
                        className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${isDone ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                          <span className={`text-sm ${isDone ? 'line-through opacity-50' : ''}`}>{task.trim()}</span>
                        </div>
                        {isDone && <CheckCircle2 size={16} className="text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold px-2">Matérias</h2>
              <div className="space-y-3">
                {data.subjects.map((subject) => (
                  <div 
                    key={subject.id}
                    className="bg-white p-4 rounded-xl border border-[#141414] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold">{subject.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-[10px] font-mono opacity-50">
                          RESOLVIDAS: <span className="text-[#141414] font-bold">{subject.solved_questions}</span>
                        </div>
                        <div className="text-[10px] font-mono opacity-50">
                          COMENTADAS: <span className="text-[#141414] font-bold">{subject.commented_questions}</span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(subject.solved_questions / subject.commented_questions) * 100}%` }}
                          className="h-full bg-[#141414]"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSolveModal(subject)}
                      className="ml-4 p-2 bg-[#141414] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold px-2">Cronograma Semanal</h2>
              <div className="space-y-3">
                {data.schedule.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border ${item.day_of_week === todayName ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{item.day_of_week}</span>
                      {item.day_of_week === todayName && (
                        <span className="text-[8px] font-mono bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">Hoje</span>
                      )}
                    </div>
                    <p className={`text-sm ${item.day_of_week === todayName ? 'opacity-80' : 'opacity-60'}`}>
                      {item.tasks}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#141414] p-2 pb-6 flex justify-around items-center z-20">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-[#141414] bg-gray-100' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-mono mt-1 uppercase">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'subjects' ? 'text-[#141414] bg-gray-100' : 'text-gray-400'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-mono mt-1 uppercase">Matérias</span>
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === 'schedule' ? 'text-[#141414] bg-gray-100' : 'text-gray-400'}`}
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-mono mt-1 uppercase">Plano</span>
        </button>
      </nav>

      {/* Solve Modal */}
      <AnimatePresence>
        {showSolveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 border-t-4 border-[#141414]"
            >
              <h3 className="text-xl font-bold mb-2">Registrar Questões</h3>
              <p className="text-sm opacity-60 mb-6">Quantas questões de <span className="font-bold text-[#141414]">{showSolveModal.name}</span> você resolveu agora?</p>
              
              <div className="flex items-center justify-center gap-8 mb-8">
                <button 
                  onClick={() => setSolveCount(Math.max(1, solveCount - 1))}
                  className="w-12 h-12 rounded-full border-2 border-[#141414] flex items-center justify-center text-2xl font-bold"
                >
                  -
                </button>
                <span className="text-4xl font-bold font-mono">{solveCount}</span>
                <button 
                  onClick={() => setSolveCount(solveCount + 1)}
                  className="w-12 h-12 rounded-full border-2 border-[#141414] flex items-center justify-center text-2xl font-bold"
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSolveModal(null)}
                  className="flex-1 p-4 rounded-xl border border-[#141414] font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSolve}
                  className="flex-1 p-4 rounded-xl bg-[#141414] text-white font-bold"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
