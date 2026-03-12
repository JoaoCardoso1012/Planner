import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("study_planner.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    commented_questions INTEGER DEFAULT 0,
    exam_questions INTEGER DEFAULT 0,
    solved_questions INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_date TEXT DEFAULT '2026-04-27',
    daily_goal_questions INTEGER DEFAULT 9,
    weekly_goal_essays INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week TEXT NOT NULL,
    tasks TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    task_index INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    UNIQUE(date, task_index)
  );
`);

// Seed initial data if empty
const subjectCount = db.prepare("SELECT COUNT(*) as count FROM subjects").get() as { count: number };
if (subjectCount.count === 0) {
  const initialSubjects = [
    { name: "Matemática", commented: 61, exam: 10, solved: 0 },
    { name: "Português", commented: 42, exam: 10, solved: 0 },
    { name: "Física", commented: 36, exam: 6, solved: 0 },
    { name: "Inglês", commented: 32, exam: 6, solved: 0 },
    { name: "Química", commented: 44, exam: 6, solved: 0 },
    { name: "Biologia", commented: 44, exam: 6, solved: 0 },
    { name: "Geografia", commented: 52, exam: 6, solved: 0 },
    { name: "História", commented: 43, exam: 6, solved: 0 },
    { name: "Redação", commented: 7, exam: 0, solved: 0 },
  ];

  const insertSubject = db.prepare("INSERT INTO subjects (name, commented_questions, exam_questions, solved_questions) VALUES (?, ?, ?, ?)");
  initialSubjects.forEach(s => insertSubject.run(s.name, s.commented, s.exam, s.solved));

  db.prepare("INSERT INTO stats (exam_date, daily_goal_questions, weekly_goal_essays) VALUES ('2026-04-27', 9, 1)").run();

  const initialSchedule = [
    { day: "Segunda", tasks: "Revisão Matemática, Português, Redação" },
    { day: "Terça", tasks: "Revisão Português, História, Geografia" },
    { day: "Quarta", tasks: "Revisão História e Geografia, Inglês, Português" },
    { day: "Quinta", tasks: "Revisão Química e Biologia, Física, Matemática" },
    { day: "Sexta", tasks: "Revisão Física, Química, Matemática" },
    { day: "Sábado", tasks: "Biologia, Revisão Total Matérias" },
    { day: "Domingo", tasks: "Simulado" },
  ];

  const insertSchedule = db.prepare("INSERT INTO schedule (day_of_week, tasks) VALUES (?, ?)");
  initialSchedule.forEach(s => insertSchedule.run(s.day, s.tasks));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    try {
      const subjects = db.prepare("SELECT * FROM subjects").all();
      const stats = db.prepare("SELECT * FROM stats LIMIT 1").get() as any;
      const schedule = db.prepare("SELECT * FROM schedule").all();
      
      // Use local date for timezone consistency
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];
      
      // Calculate days remaining
      const examDate = new Date(stats.exam_date);
      const diffTime = examDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      stats.days_until_exam = Math.max(0, diffDays);

      const completions = db.prepare("SELECT * FROM task_completions WHERE date = ?").all(todayStr);
      res.json({ subjects, stats, schedule, completions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.post("/api/tasks/toggle", (req, res) => {
    try {
      const { task_index, completed } = req.body;
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO task_completions (date, task_index, completed) 
        VALUES (?, ?, ?) 
        ON CONFLICT(date, task_index) DO UPDATE SET completed = excluded.completed
      `).run(todayStr, task_index, completed ? 1 : 0);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });

  app.post("/api/subjects/:id/solve", (req, res) => {
    try {
      const { id } = req.params;
      const { count } = req.body;
      db.prepare("UPDATE subjects SET solved_questions = solved_questions + ? WHERE id = ?").run(count, id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.post("/api/stats/update", (req, res) => {
    try {
      const { days_until_exam, daily_goal_questions } = req.body;
      
      // Calculate new exam date based on days remaining from today
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + parseInt(days_until_exam));
      const examDateStr = examDate.toISOString().split('T')[0];

      db.prepare("UPDATE stats SET exam_date = ?, daily_goal_questions = ?").run(examDateStr, daily_goal_questions);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
