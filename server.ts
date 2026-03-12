import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data", "study_data.json");

// Initial data structure
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
  task_completions: [] // Array of { date: string, task_index: number, completed: number }
};

async function ensureDataFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function readData() {
  const content = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  await ensureDataFile();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await readData();
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];
      
      // Calculate days remaining
      const examDate = new Date(data.stats.exam_date);
      const diffTime = examDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const stats = {
        ...data.stats,
        days_until_exam: Math.max(0, diffDays)
      };

      const completions = data.task_completions.filter((c: any) => c.date === todayStr);
      res.json({ subjects: data.subjects, stats, schedule: data.schedule, completions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.post("/api/tasks/toggle", async (req, res) => {
    try {
      const { task_index, completed } = req.body;
      const data = await readData();
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - (offset * 60 * 1000));
      const todayStr = localDate.toISOString().split('T')[0];

      const existingIndex = data.task_completions.findIndex((c: any) => c.date === todayStr && c.task_index === task_index);
      
      if (existingIndex > -1) {
        data.task_completions[existingIndex].completed = completed ? 1 : 0;
      } else {
        data.task_completions.push({ date: todayStr, task_index, completed: completed ? 1 : 0 });
      }

      await writeData(data);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });

  app.post("/api/subjects/:id/solve", async (req, res) => {
    try {
      const { id } = req.params;
      const { count } = req.body;
      const data = await readData();
      
      const subject = data.subjects.find((s: any) => s.id === parseInt(id));
      if (subject) {
        subject.solved_questions += count;
        await writeData(data);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Subject not found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.post("/api/subjects/update", async (req, res) => {
    try {
      const { subjects } = req.body; // Array of { id, commented_questions, name }
      const data = await readData();
      
      subjects.forEach((updatedSub: any) => {
        const subject = data.subjects.find((s: any) => s.id === updatedSub.id);
        if (subject) {
          if (updatedSub.commented_questions !== undefined) {
            subject.commented_questions = parseInt(updatedSub.commented_questions);
          }
          if (updatedSub.name !== undefined) {
            subject.name = updatedSub.name;
          }
        }
      });
      
      await writeData(data);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update subjects" });
    }
  });

  app.post("/api/subjects/add", async (req, res) => {
    try {
      const { name, commented_questions } = req.body;
      const data = await readData();
      
      const newId = data.subjects.length > 0 ? Math.max(...data.subjects.map((s: any) => s.id)) + 1 : 1;
      const newSubject = {
        id: newId,
        name: name || "Nova Matéria",
        commented_questions: parseInt(commented_questions) || 0,
        exam_questions: 0,
        solved_questions: 0
      };
      
      data.subjects.push(newSubject);
      await writeData(data);
      res.json({ success: true, subject: newSubject });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add subject" });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await readData();
      
      data.subjects = data.subjects.filter((s: any) => s.id !== parseInt(id));
      await writeData(data);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  app.post("/api/stats/update", async (req, res) => {
    try {
      const { days_until_exam, daily_goal_questions, total_questions, vestibular_title } = req.body;
      const data = await readData();
      
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + parseInt(days_until_exam));
      const examDateStr = examDate.toISOString().split('T')[0];

      data.stats.exam_date = examDateStr;
      data.stats.daily_goal_questions = parseInt(daily_goal_questions);
      if (total_questions !== undefined) {
        data.stats.total_questions = parseInt(total_questions);
      }
      if (vestibular_title !== undefined) {
        data.stats.vestibular_title = vestibular_title;
      }
      
      await writeData(data);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update stats" });
    }
  });

  app.post("/api/schedule/update", async (req, res) => {
    try {
      const { day_id, tasks } = req.body;
      const data = await readData();
      
      const day = data.schedule.find((d: any) => d.id === parseInt(day_id));
      if (day) {
        day.tasks = tasks;
        await writeData(data);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Day not found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update schedule" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
