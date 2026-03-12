export interface Subject {
  id: number;
  name: string;
  commented_questions: number;
  exam_questions: number;
  solved_questions: number;
}

export interface Stats {
  id: number;
  exam_date: string;
  days_until_exam: number;
  daily_goal_questions: number;
  weekly_goal_essays: number;
  total_questions: number;
}

export interface ScheduleItem {
  id: number;
  day_of_week: string;
  tasks: string;
}

export interface AppData {
  subjects: Subject[];
  stats: Stats;
  schedule: ScheduleItem[];
  completions: { task_index: number; completed: number }[];
}
