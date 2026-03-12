import { AppData, Subject, Stats, ScheduleItem } from '../types';

const STORAGE_KEY = 'study_planner_data';

const initialData = {
  subjects: [
    { id: 1, name: "Matemática", commented_questions: 61, exam_questions: 10, solved_questions: 0 },
    { id: 2, name: "Português", commented_questions: 42, exam_questions: 10, solved_questions: 0 },
    { id: 3, name: "Física", commented_questions: 36, exam_questions: 6, solved_questions: 0 },
    { id: 4, name: "Inglês", commented_questions: 32, exam_questions: 6, solved_questions: 0 },
    { id: 5, name: "Química", commented_questions: 44, exam_questions: 6, solved_questions: 0 },
    { id: 6, name: "Biologia", commented_questions: 44, exam_questions: 6, solved_questions: 0 },
    { id: 7, name: "Geografia", commented_questions: 52, exam_questions: 6, solved_questions: 0 },
    { id: 8, name: "História", commented_questions: 43, exam_questions: 6, solved_questions: 0 },
    { id: 9, name: "Redação", commented_questions: 7, exam_questions: 0, solved_questions: 0 },
  ],
  stats: {
    exam_date: '2026-04-27',
    daily_goal_questions: 9,
    weekly_goal_essays: 1,
    total_questions: 2000,
    vestibular_title: 'UNIVESP 2026'
  },
  schedule: [
    { id: 1, day_of_week: "Segunda", tasks: "Revisão Matemática, Português, Redação" },
    { id: 2, day_of_week: "Terça", tasks: "Revisão Português, História, Geografia" },
    { id: 3, day_of_week: "Quarta", tasks: "Revisão História e Geografia, Inglês, Português" },
    { id: 4, day_of_week: "Quinta", tasks: "Revisão Química e Biologia, Física, Matemática" },
    { id: 5, day_of_week: "Sexta", tasks: "Revisão Física, Química, Matemática" },
    { id: 6, day_of_week: "Sábado", tasks: "Biologia, Revisão Total Matérias" },
    { id: 7, day_of_week: "Domingo", tasks: "Simulado" },
  ],
  task_completions: [] as { date: string, task_index: number, completed: number }[]
};

function getTodayStr() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

export const storage = {
  getData: (): AppData => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    const now = new Date();
    const todayStr = getTodayStr();
    
    // Calculate days remaining
    const examDate = new Date(data.stats.exam_date);
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const stats = {
      ...data.stats,
      days_until_exam: Math.max(0, diffDays)
    };

    const completions = data.task_completions
      .filter((c: any) => c.date === todayStr)
      .map((c: any) => ({ task_index: c.task_index, completed: c.completed }));

    return { subjects: data.subjects, stats, schedule: data.schedule, completions };
  },

  saveData: (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  toggleTask: (task_index: number, completed: boolean) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    const todayStr = getTodayStr();

    const existingIndex = data.task_completions.findIndex((c: any) => c.date === todayStr && c.task_index === task_index);
    
    if (existingIndex > -1) {
      data.task_completions[existingIndex].completed = completed ? 1 : 0;
    } else {
      data.task_completions.push({ date: todayStr, task_index, completed: completed ? 1 : 0 });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  solveQuestions: (subjectId: number, count: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    const subject = data.subjects.find((s: any) => s.id === subjectId);
    if (subject) {
      subject.solved_questions += count;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  },

  updateSubjects: (updatedSubjects: { id: number, name?: string, commented_questions?: number }[]) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    updatedSubjects.forEach((updatedSub) => {
      const subject = data.subjects.find((s: any) => s.id === updatedSub.id);
      if (subject) {
        if (updatedSub.commented_questions !== undefined) {
          subject.commented_questions = updatedSub.commented_questions;
        }
        if (updatedSub.name !== undefined) {
          subject.name = updatedSub.name;
        }
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  addSubject: (name: string, commented_questions: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    const newId = data.subjects.length > 0 ? Math.max(...data.subjects.map((s: any) => s.id)) + 1 : 1;
    const newSubject = {
      id: newId,
      name: name || "Nova Matéria",
      commented_questions: commented_questions || 0,
      exam_questions: 0,
      solved_questions: 0
    };
    
    data.subjects.push(newSubject);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return newSubject;
  },

  deleteSubject: (id: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    data.subjects = data.subjects.filter((s: any) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  updateStats: (stats: { days_until_exam: number, daily_goal_questions: number, total_questions?: number, vestibular_title?: string }) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + stats.days_until_exam);
    const examDateStr = examDate.toISOString().split('T')[0];

    data.stats.exam_date = examDateStr;
    data.stats.daily_goal_questions = stats.daily_goal_questions;
    if (stats.total_questions !== undefined) {
      data.stats.total_questions = stats.total_questions;
    }
    if (stats.vestibular_title !== undefined) {
      data.stats.vestibular_title = stats.vestibular_title;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  updateSchedule: (day_id: number, tasks: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialData;
    
    const day = data.schedule.find((d: any) => d.id === day_id);
    if (day) {
      day.tasks = tasks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }
};
