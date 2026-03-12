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
  Clock,
  Settings,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Subject } from './types';
import { storage } from './lib/storage';

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'schedule'>('dashboard');
  const [showSolveModal, setShowSolveModal] = useState<Subject | null>(null);
  const [solveCount, setSolveCount] = useState(1);

  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [showSubjectsSettings, setShowSubjectsSettings] = useState(false);
  const [showScheduleSettings, setShowScheduleSettings] = useState<number | null>(null);
  const [tempDays, setTempDays] = useState('');
  const [tempGoal, setTempGoal] = useState('');
  const [tempVestibularTitle, setTempVestibularTitle] = useState('');
  const [tempSubjects, setTempSubjects] = useState<{[key: number]: { name: string, questions: string }}>({});
  const [tempTasks, setTempTasks] = useState<string[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGoal, setNewSubjectGoal] = useState('');

  const fetchData = async () => {
    try {
      const result = storage.getData();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSolve = async () => {
    if (!showSolveModal) return;
    try {
      storage.solveQuestions(showSolveModal.id, solveCount);
      setShowSolveModal(null);
      setSolveCount(1);
      fetchData();
    } catch (error) {
      console.error("Error solving questions:", error);
    }
  };

  const toggleTask = async (index: number, currentStatus: boolean) => {
    try {
      storage.toggleTask(index, !currentStatus);
      fetchData();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      storage.addSubject(newSubjectName, parseInt(newSubjectGoal) || 0);
      setNewSubjectName('');
      setNewSubjectGoal('');
      fetchData();
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleRemoveSubject = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover esta matéria? Todo o progresso nela será perdido.")) return;
    try {
      storage.deleteSubject(id);
      fetchData();
    } catch (error) {
      console.error("Error removing subject:", error);
    }
  };

  const updateStats = async (days: string, goal: string, subjectUpdates: {[key: number]: { name: string, questions: string }}, vestibularTitle?: string) => {
    try {
      // Update general stats
      storage.updateStats({
        days_until_exam: parseInt(days),
        daily_goal_questions: parseInt(goal),
        vestibular_title: vestibularTitle
      });

      // Update subjects
      const subjectsPayload = Object.entries(subjectUpdates).map(([id, data]) => ({
        id: parseInt(id),
        commented_questions: parseInt(data.questions),
        name: data.name
      }));

      if (subjectsPayload.length > 0) {
        storage.updateSubjects(subjectsPayload);
      }

      fetchData();
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  const updateSchedule = async (dayId: number, tasks: string[]) => {
    try {
      storage.updateSchedule(dayId, tasks.join(', '));
      fetchData();
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg"
        />
      </div>
    );
  }

  const subjectsExceptEssay = data.subjects.filter(s => s.name !== 'Redação');
  const essaySubject = data.subjects.find(s => s.name === 'Redação');
  const totalSolvedOverall = data.subjects.reduce((acc, s) => acc + s.solved_questions, 0);
  const totalQuestionsGoal = data.subjects.reduce((acc, s) => acc + s.commented_questions, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Stylish Header */}
      <header className="px-6 pt-10 pb-6 bg-white/80 backdrop-blur-xl sticky top-0 z-30 rounded-b-[40px] border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Target className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Study<span className="text-indigo-600">Flow</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.stats.vestibular_title || 'UNIVESP 2026'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 mt-8 space-y-8 max-w-md mx-auto">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Dashboard Header with Settings */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-slate-800">Visão Geral</h3>
                <button 
                  onClick={() => {
                    setTempDays(data.stats.days_until_exam.toString());
                    setTempGoal(data.stats.daily_goal_questions.toString());
                    setTempVestibularTitle(data.stats.vestibular_title || 'UNIVESP 2026');
                    setShowDashboardSettings(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  <Settings size={14} />
                  Configurar
                </button>
              </div>

              {/* Modern Stats Cards */}
              <section className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <p className="text-xs font-medium text-indigo-100 uppercase tracking-widest mb-2">Contagem Regressiva</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-black tracking-tighter">{data.stats.days_until_exam}</h2>
                    <span className="text-sm font-semibold text-indigo-200 uppercase">dias restantes</span>
                  </div>
                  <div className="mt-6 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (data.stats.days_until_exam / 60) * 100)}%` }}
                      className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-md border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Meta Diária</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">{data.stats.daily_goal_questions}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase">Questões por dia</span>
                  </div>
                  <p className="text-[10px] mt-2 text-indigo-500 font-bold tracking-wider uppercase">Foco e Consistência</p>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-md border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progresso Geral</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">{totalSolvedOverall}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase">de {totalQuestionsGoal} questões</span>
                  </div>
                  <div className="mt-4 h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalSolvedOverall / (totalQuestionsGoal || 1)) * 100)}%` }}
                      className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <h3 className="text-xl font-bold text-slate-800">Tarefas de Hoje</h3>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {DAYS[new Date().getDay()]}
                  </div>
                </div>
                <div className="space-y-4">
                  {data.schedule.find(s => s.day_of_week === DAYS[new Date().getDay()])?.tasks.split(',').map((task, i) => {
                    const isCompleted = data.completions?.find(c => c.task_index === i)?.completed === 1;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleTask(i, isCompleted)}
                        className={`w-full p-5 rounded-[24px] transition-all flex items-center justify-between group active:scale-98 ${
                          isCompleted 
                            ? 'bg-slate-50 border-transparent' 
                            : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-200'
                          }`}>
                            {isCompleted && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className={`font-semibold text-sm text-left ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {task.trim()}
                          </span>
                        </div>
                        {!isCompleted && <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-5 px-2">
                  <h3 className="text-xl font-bold text-slate-800">Seu Progresso</h3>
                  <button onClick={() => setActiveTab('subjects')} className="text-indigo-600 text-xs font-bold flex items-center gap-1">
                    Ver tudo <ArrowRight size={14} />
                  </button>
                </div>
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-6">
                  {subjectsExceptEssay.slice(0, 3).map((subject) => (
                    <div key={subject.id}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{subject.name}</span>
                        <span className="text-[10px] font-bold text-indigo-500">
                          {Math.round((subject.solved_questions / subject.commented_questions) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(subject.solved_questions / subject.commented_questions) * 100}%` }}
                          className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Subjects Header with Settings */}
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xl font-bold text-slate-800">Suas Matérias</h3>
                <button 
                  onClick={() => {
                    const subMap: {[key: number]: { name: string, questions: string }} = {};
                    data.subjects.forEach(s => {
                      subMap[s.id] = { name: s.name, questions: s.commented_questions.toString() };
                    });
                    setTempSubjects(subMap);
                    setShowSubjectsSettings(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  <Settings size={14} />
                  Metas
                </button>
              </div>

              {data.subjects.map((subject) => (
                <div 
                  key={subject.id}
                  className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{subject.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Questões Comentadas</p>
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                      {Math.round((subject.solved_questions / subject.commented_questions) * 100)}%
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-2xl font-black text-slate-900">
                        {subject.solved_questions} 
                        <span className="text-slate-200 mx-1">/</span> 
                        <span className="text-slate-400 text-lg">{subject.commented_questions}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowSolveModal(subject)}
                      className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(subject.solved_questions / subject.commented_questions) * 100}%` }}
                      className="h-full bg-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xl font-bold text-slate-800">Sua Agenda</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toque para editar</p>
              </div>
              {data.schedule.map((day) => {
                const isToday = day.day_of_week === DAYS[new Date().getDay()];
                return (
                  <div 
                    key={day.id}
                    onClick={() => {
                      setTempTasks(day.tasks.split(',').map(t => t.trim()).filter(t => t));
                      setShowScheduleSettings(day.id);
                    }}
                    className={`p-6 rounded-[32px] transition-all border cursor-pointer group ${
                      isToday
                        ? 'bg-white shadow-md border-indigo-100'
                        : 'bg-white/40 border-slate-100 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{day.day_of_week}</h4>
                        <Settings size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      {isToday && (
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100">Hoje</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.tasks.split(',').map((task, i) => (
                        task.trim() && (
                          <span key={i} className={`px-4 py-2 rounded-2xl text-[11px] font-bold ${
                            isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {task.trim()}
                          </span>
                        )
                      ))}
                      {day.tasks.trim() === '' && (
                        <span className="text-[11px] font-bold text-slate-300 italic">Nenhuma atividade</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-md rounded-[32px] px-8 py-5 flex justify-between items-center z-40 shadow-2xl shadow-slate-400">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
          { id: 'subjects', icon: BookOpen, label: 'Matérias' },
          { id: 'schedule', icon: ListTodo, label: 'Agenda' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all relative ${
              activeTab === tab.id ? 'text-white scale-110' : 'text-slate-500'
            }`}
          >
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-glow"
                className="absolute -top-2 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"
              />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-0 h-0'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Stylish Solve Modal */}
      <AnimatePresence>
        {showSolveModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSolveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-white w-full max-w-md p-8 rounded-t-[48px] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <PenTool className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{showSolveModal.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registrar Progresso</p>
              </div>
              
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-[32px] flex items-center justify-between">
                  <button 
                    onClick={() => setSolveCount(Math.max(1, solveCount - 1))}
                    className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center text-2xl font-black active:scale-90 transition-all shadow-sm border border-slate-100"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black tracking-tighter text-slate-900">{solveCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questões</span>
                  </div>
                  <button 
                    onClick={() => setSolveCount(solveCount + 1)}
                    className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black active:scale-90 transition-all shadow-lg shadow-indigo-100"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSolveModal(null)}
                    className="flex-1 p-5 rounded-3xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleSolve}
                    className="flex-1 p-5 rounded-3xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dashboard Settings Modal */}
      <AnimatePresence>
        {showDashboardSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDashboardSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">Configurar Início</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Título do Vestibular</label>
                  <input 
                    type="text"
                    value={tempVestibularTitle}
                    onChange={(e) => setTempVestibularTitle(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ex: UNIVESP 2026"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Dias até a Prova</label>
                  <input 
                    type="number"
                    value={tempDays}
                    onChange={(e) => setTempDays(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Meta Diária (Questões)</label>
                  <input 
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-8">
                <button 
                  onClick={() => setShowDashboardSettings(false)}
                  className="flex-1 p-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    updateStats(tempDays, tempGoal, {}, tempVestibularTitle);
                    setShowDashboardSettings(false);
                  }}
                  className="flex-1 p-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subjects Settings Modal */}
      <AnimatePresence>
        {showSubjectsSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubjectsSettings(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">Metas por Matéria</h3>
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {data.subjects.map(subject => (
                  <div key={subject.id} className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                    <button 
                      onClick={() => handleRemoveSubject(subject.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nome da Matéria</label>
                      <input 
                        type="text"
                        value={tempSubjects[subject.id]?.name || ''}
                        onChange={(e) => setTempSubjects({ 
                          ...tempSubjects, 
                          [subject.id]: { ...tempSubjects[subject.id], name: e.target.value } 
                        })}
                        className="w-full p-2 bg-white border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Meta de Questões</label>
                      <input 
                        type="number"
                        value={tempSubjects[subject.id]?.questions || ''}
                        onChange={(e) => setTempSubjects({ 
                          ...tempSubjects, 
                          [subject.id]: { ...tempSubjects[subject.id], questions: e.target.value } 
                        })}
                        className="w-full p-2 bg-white border border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                ))}

                {/* Add New Subject Section */}
                <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 border-dashed mt-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Adicionar Nova Matéria</p>
                  <div>
                    <input 
                      type="text"
                      placeholder="Nome da nova matéria"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full p-2 bg-white border border-indigo-100 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Meta de questões"
                      value={newSubjectGoal}
                      onChange={(e) => setNewSubjectGoal(e.target.value)}
                      className="flex-1 p-2 bg-white border border-indigo-100 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button 
                      onClick={handleAddSubject}
                      className="px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest active:scale-90 transition-all shadow-md shadow-indigo-100"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-8">
                <button 
                  onClick={() => setShowSubjectsSettings(false)}
                  className="flex-1 p-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    updateStats(data.stats.days_until_exam.toString(), data.stats.daily_goal_questions.toString(), tempSubjects, data.stats.vestibular_title);
                    setShowSubjectsSettings(false);
                  }}
                  className="flex-1 p-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Schedule Settings Modal */}
      <AnimatePresence>
        {showScheduleSettings !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleSettings(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm p-8 rounded-[40px] shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-2">Editar Agenda</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">
                {data.schedule.find(d => d.id === showScheduleSettings)?.day_of_week}
              </p>
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {tempTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <input 
                      type="text"
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...tempTasks];
                        newTasks[index] = e.target.value;
                        setTempTasks(newTasks);
                      }}
                      className="flex-1 bg-transparent font-bold text-slate-700 text-sm focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        const newTasks = tempTasks.filter((_, i) => i !== index);
                        setTempTasks(newTasks);
                      }}
                      className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                  </div>
                ))}

                {/* Add New Task Section */}
                <div className="flex gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 border-dashed">
                  <input 
                    type="text"
                    placeholder="Nova atividade..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskName.trim()) {
                        setTempTasks([...tempTasks, newTaskName.trim()]);
                        setNewTaskName('');
                      }
                    }}
                    className="flex-1 bg-transparent font-bold text-slate-700 text-sm focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      if (newTaskName.trim()) {
                        setTempTasks([...tempTasks, newTaskName.trim()]);
                        setNewTaskName('');
                      }
                    }}
                    className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md shadow-indigo-100"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-8">
                <button 
                  onClick={() => setShowScheduleSettings(null)}
                  className="flex-1 p-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (showScheduleSettings !== null) {
                      updateSchedule(showScheduleSettings, tempTasks);
                    }
                    setShowScheduleSettings(null);
                  }}
                  className="flex-1 p-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
