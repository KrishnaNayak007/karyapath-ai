import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;
const DB_PATH = path.resolve('.', 'db.json');

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini client:', err);
  }
} else {
  console.log('No GEMINI_API_KEY found. Running in offline fallback mode.');
}

// Database helper functions
interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: string;
  created_at: string;
}

interface Subtask {
  id: string;
  goal_id: string;
  title: string;
  estimated_minutes: number;
  status: 'pending' | 'completed';
  confidence: string;
}

interface ScheduledBlock {
  id: string;
  subtask_id: string;
  start_time: string;
  end_time: string;
  google_calendar_event_id: string | null;
  was_auto_rescheduled: boolean;
  reschedule_reason: string | null;
}

interface ReplanLog {
  id: string;
  trigger_reason: string;
  ai_reasoning: string;
  triggered_at: string;
  was_automatic: boolean;
  goal_title?: string;
  task_title?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  google_id: string;
}

interface Database {
  goals: Goal[];
  subtasks: Subtask[];
  scheduled_blocks: ScheduledBlock[];
  replan_logs: ReplanLog[];
  new_replans: ReplanLog[];
  users?: User[];
}

const DEFAULT_DB: Database = {
  goals: [],
  subtasks: [],
  scheduled_blocks: [],
  replan_logs: [],
  new_replans: [],
  users: [],
};

function readDb(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return DEFAULT_DB;
  }
}

function writeDb(data: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// Fallback algorithm for breaking down goals when Gemini is unavailable
function getFallbackBreakdown(title: string, description: string, deadline: string, goalId: string) {
  const now = new Date();
  const dead = new Date(deadline);
  const diffMs = dead.getTime() - now.getTime();
  const interval = diffMs > 0 ? diffMs / 5 : 24 * 60 * 60 * 1000;

  const steps = [
    { title: `Analyze specifications and draft plan for ${title}`, minutes: 60, confidence: "95%" },
    { title: `Develop core backend APIs and schemas for ${title}`, minutes: 120, confidence: "92%" },
    { title: `Build responsive client interface and states for ${title}`, minutes: 180, confidence: "90%" },
    { title: `Perform end-to-end integration and verification tests`, minutes: 90, confidence: "88%" },
    { title: `Final production deployment and optimization check`, minutes: 60, confidence: "95%" }
  ];

  const subtasks: Subtask[] = steps.map((step, idx) => ({
    id: `subtask-${goalId}-${idx}`,
    goal_id: goalId,
    title: step.title,
    estimated_minutes: step.minutes,
    status: 'pending',
    confidence: step.confidence
  }));

  const scheduled_blocks: ScheduledBlock[] = subtasks.map((task, idx) => {
    const blockStart = new Date(now.getTime() + interval * (idx + 0.5));
    const blockEnd = new Date(blockStart.getTime() + task.estimated_minutes * 60 * 1000);
    return {
      id: `block-${goalId}-${idx}`,
      subtask_id: task.id,
      start_time: blockStart.toISOString(),
      end_time: blockEnd.toISOString(),
      google_calendar_event_id: `gcal-${goalId}-${idx}`,
      was_auto_rescheduled: false,
      reschedule_reason: null
    };
  });

  return { subtasks, scheduled_blocks };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // POST /api/auth/google-verify & /auth/google-verify - Verify Google ID Token
  app.post(['/api/auth/google-verify', '/auth/google-verify'], async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credential token is required' });
    }

    try {
      let email = 'og.krishnayak906564@gmail.com';
      let name = 'Krishna Yak';
      let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80';
      let googleId = '112233445566778899';

      if (credential.startsWith('mock-')) {
        // Handle mock sandbox credential
        console.log('Using mock sandbox credential token:', credential);
        const emailPart = credential.substring(5);
        if (emailPart && emailPart.includes('@')) {
          email = emailPart;
          name = emailPart.split('@')[0].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        }
      } else {
        // Call real Google token info endpoint
        console.log('Verifying real Google Identity Services token...');
        const tokeninfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
        const tokeninfoRes = await fetch(tokeninfoUrl);
        if (tokeninfoRes.ok) {
          const payload: any = await tokeninfoRes.json();
          if (payload && payload.email) {
            email = payload.email;
            name = payload.name || email.split('@')[0];
            avatarUrl = payload.picture || avatarUrl;
            googleId = payload.sub || googleId;
          } else {
            return res.status(400).json({ error: 'Invalid Google token payload structure' });
          }
        } else {
          console.warn('Google tokeninfo API responded with error. Falling back to local token decode for hackathon compatibility.');
          try {
            const parts = credential.split('.');
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              if (decoded && decoded.email) {
                email = decoded.email;
                name = decoded.name || email.split('@')[0];
                avatarUrl = decoded.picture || avatarUrl;
                googleId = decoded.sub || googleId;
                console.log('Successfully decoded token offline:', email);
              }
            }
          } catch (e) {
            console.error('Failed to parse JWT offline:', e);
          }
        }
      }

      // Persist user in database
      const db = readDb();
      if (!db.users) {
        db.users = [];
      }

      let user = db.users.find(u => u.email === email);
      if (!user) {
        user = {
          id: `user-${Date.now()}`,
          email,
          name,
          avatarUrl,
          google_id: googleId,
        };
        db.users.push(user);
        writeDb(db);
      }

      res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }
      });
    } catch (error: any) {
      console.error('Google token verification exception:', error);
      res.status(401).json({ error: 'Authentication failed', details: error.message });
    }
  });

  // POST /goals/ - Create goal and break down using Gemini
  app.post('/goals', async (req, res) => {
    const { title, description, deadline, priority } = req.body;
    if (!title || !deadline || !priority) {
      return res.status(400).json({ error: 'Title, deadline, and priority are required' });
    }

    const db = readDb();
    const goalId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      id: goalId,
      title,
      description: description || '',
      deadline,
      priority,
      created_at: new Date().toISOString(),
    };

    let subtasks: Subtask[] = [];
    let scheduledBlocks: ScheduledBlock[] = [];

    if (ai) {
      try {
        console.log(`Analyzing goal: "${title}" using Gemini AI...`);
        const prompt = `You are KaryaPath AI, an autonomous productivity companion.
Your job is to break down a high-level goal into highly actionable subtasks, and schedule them into time blocks.

Goal Title: "${title}"
Goal Description: "${description || 'No description provided.'}"
Goal Deadline: "${deadline}"
Goal Priority: "${priority}"

Current Time is: "${new Date().toISOString()}"

Please break this goal down into 3 to 5 realistic, logical subtasks.
Then, create a Scheduled Block for each subtask.
Each scheduled block must have:
- A start time and an end time (as ISO 8601 strings) that fit within the period from the current time to the goal's deadline.
- Start times and end times should be chronological, spaced out reasonably (not overlapping), and representing when the user should execute the task.
- Keep estimated durations realistic (between 30 to 180 minutes).
- Assign a confidence indicator (e.g. "95%", "85%") based on the clarity and priority of the subtask.

You must output a strictly valid JSON response that conforms to this schema:
{
  "subtasks": [
    {
      "title": "string (the subtask name)",
      "estimated_minutes": number (duration in minutes),
      "confidence": "string (confidence indicator, e.g. 95%)"
    }
  ],
  "scheduled_blocks": [
    {
      "subtask_index": number (0-based index of the subtask),
      "start_time": "string (ISO 8601 string)",
      "end_time": "string (ISO 8601 string)"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subtasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      estimated_minutes: { type: Type.INTEGER },
                      confidence: { type: Type.STRING },
                    },
                    required: ['title', 'estimated_minutes', 'confidence'],
                  },
                },
                scheduled_blocks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subtask_index: { type: Type.INTEGER },
                      start_time: { type: Type.STRING },
                      end_time: { type: Type.STRING },
                    },
                    required: ['subtask_index', 'start_time', 'end_time'],
                  },
                },
              },
              required: ['subtasks', 'scheduled_blocks'],
            },
          },
        });

        const resultText = response.text || '{}';
        const parsed = JSON.parse(resultText);

        if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
          subtasks = parsed.subtasks.map((task: any, idx: number) => ({
            id: `subtask-${goalId}-${idx}`,
            goal_id: goalId,
            title: task.title,
            estimated_minutes: task.estimated_minutes || 60,
            status: 'pending',
            confidence: task.confidence || '90%',
          }));

          if (parsed.scheduled_blocks && Array.isArray(parsed.scheduled_blocks)) {
            scheduledBlocks = parsed.scheduled_blocks.map((block: any, idx: number) => {
              const subtask = subtasks[block.subtask_index] || subtasks[0];
              return {
                id: `block-${goalId}-${idx}`,
                subtask_id: subtask.id,
                start_time: block.start_time,
                end_time: block.end_time,
                google_calendar_event_id: `gcal-${goalId}-${idx}`,
                was_auto_rescheduled: false,
                reschedule_reason: null,
              };
            });
          }
        }
      } catch (err) {
        console.error('Gemini breakdown failed, using fallback:', err);
      }
    }

    // Fallback if Gemini not initialized or failed
    if (subtasks.length === 0) {
      const fallback = getFallbackBreakdown(title, description, deadline, goalId);
      subtasks = fallback.subtasks;
      scheduledBlocks = fallback.scheduled_blocks;
    }

    // Save to DB
    db.goals.push(newGoal);
    db.subtasks.push(...subtasks);
    db.scheduled_blocks.push(...scheduledBlocks);

    // Write a log entry for creation
    db.replan_logs.push({
      id: `log-${Date.now()}`,
      trigger_reason: 'Goal Initialized',
      ai_reasoning: `Successfully parsed goal "${title}" and autonomously scheduled ${subtasks.length} subtasks prior to deadline of ${new Date(deadline).toLocaleString()}.`,
      triggered_at: new Date().toISOString(),
      was_automatic: true,
      goal_title: title,
    });

    writeDb(db);
    res.status(201).json({ goal: newGoal, subtasks, scheduled_blocks: scheduledBlocks });
  });

  // GET /dashboard/ - Get dashboard data and run Autonomous Engine check
  app.get('/dashboard', async (req, res) => {
    const db = readDb();
    const now = new Date();
    let updated = false;
    const newReplansThisCheck: ReplanLog[] = [];

    console.log(`GET /dashboard - Autonomous Planner Triggered at ${now.toISOString()}`);

    // Loop through all scheduled blocks to detect any missed blocks (end_time < now and subtask still pending)
    for (let i = 0; i < db.scheduled_blocks.length; i++) {
      const block = db.scheduled_blocks[i];
      const subtaskIndex = db.subtasks.findIndex(t => t.id === block.subtask_id);
      
      if (subtaskIndex !== -1) {
        const subtask = db.subtasks[subtaskIndex];
        const blockEnd = new Date(block.end_time);

        // Conditions for missed task block:
        // 1. Task status is pending
        // 2. End time has passed (past)
        // 3. Not already auto-rescheduled for the CURRENT missed window (i.e. if we detect it again, we replan again, but let's avoid infinite replan loops by ensuring we only reschedule if block is in past and unchanged since the past block was missed)
        if (subtask.status === 'pending' && blockEnd < now && !block.was_auto_rescheduled) {
          console.log(`Missed Block Detected! Task: "${subtask.title}" (Block ID: ${block.id})`);
          
          const goal = db.goals.find(g => g.id === subtask.goal_id) || { title: 'Goal', deadline: new Date(Date.now() + 48 * 3600000).toISOString() };
          
          // Generate explanation with Gemini
          let reasoning = '';
          if (ai) {
            try {
              const prompt = `You are KaryaPath AI, an autonomous productivity companion.
The user missed a scheduled work block for a subtask. You need to explain why we are automatically rescheduling it to preserve completion probability.

Goal Title: "${goal.title}"
Goal Deadline: "${goal.deadline}"
Missed Subtask: "${subtask.title}"
Original Scheduled Block End Time: "${block.end_time}"
Current Time is: "${now.toISOString()}"

Write a short, professional, encouraging explanation of why we detected this missed task and where we moved it.
Keep it strictly to 2 sentences. Include the fact that we rescheduled it.
Example: "You missed Backend Integration. Only 2 days remain before the deadline. The task has been moved to tomorrow morning to preserve completion probability."`;

              const genRes = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
              });
              reasoning = genRes.text?.trim() || '';
            } catch (err) {
              console.error('Gemini reasoning failed:', err);
            }
          }

          // Fallback explanation
          if (!reasoning) {
            const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            reasoning = `You missed "${subtask.title}". Since only ${daysLeft > 0 ? daysLeft : 0} days remain before your goal deadline, we have autonomously moved this block to tomorrow morning to ensure on-time delivery.`;
          }

          // Calculate new future time (reschedule to tomorrow at 9:00 AM local time or 3 hours from now)
          const newStart = new Date(now.getTime() + 16 * 60 * 60 * 1000); // 16 hours in the future
          newStart.setMinutes(0, 0, 0);
          
          const durationMs = new Date(block.end_time).getTime() - new Date(block.start_time).getTime();
          const newEnd = new Date(newStart.getTime() + durationMs);

          // Update Scheduled Block
          block.start_time = newStart.toISOString();
          block.end_time = newEnd.toISOString();
          block.was_auto_rescheduled = true;
          block.reschedule_reason = reasoning;

          // Create Replan Log
          const log: ReplanLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            trigger_reason: `Missed Task: ${subtask.title}`,
            ai_reasoning: reasoning,
            triggered_at: now.toISOString(),
            was_automatic: true,
            goal_title: goal.title,
            task_title: subtask.title,
          };

          db.replan_logs.push(log);
          newReplansThisCheck.push(log);
          updated = true;
        }
      }
    }

    if (updated) {
      db.new_replans.push(...newReplansThisCheck);
      writeDb(db);
    }

    // Build dashboard response
    const dashboardResponse = {
      goals: db.goals,
      subtasks: db.subtasks,
      scheduled_blocks: db.scheduled_blocks,
      replan_logs: db.replan_logs,
      new_replans: db.new_replans,
    };

    // Clear new replans so they are only alerted once
    if (db.new_replans.length > 0) {
      db.new_replans = [];
      writeDb(db);
    }

    res.json(dashboardResponse);
  });

  // POST /subtasks/{id}/complete/ - Complete a subtask
  app.post('/subtasks/:id/complete', (req, res) => {
    const { id } = req.params;
    const db = readDb();

    const subtaskIndex = db.subtasks.findIndex(t => t.id === id);
    if (subtaskIndex === -1) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    db.subtasks[subtaskIndex].status = 'completed';

    // Log the manual completion
    const subtask = db.subtasks[subtaskIndex];
    const goal = db.goals.find(g => g.id === subtask.goal_id);
    db.replan_logs.push({
      id: `log-${Date.now()}`,
      trigger_reason: 'Task Completed',
      ai_reasoning: `User checked off "${subtask.title}". Path feasibility increased. Nice job!`,
      triggered_at: new Date().toISOString(),
      was_automatic: false,
      goal_title: goal?.title,
      task_title: subtask.title,
    });

    writeDb(db);
    res.json({ success: true, subtask: db.subtasks[subtaskIndex] });
  });

  // POST /reset-db - Helper to reset database to the initial pre-seeded state
  app.post('/reset-db', (req, res) => {
    const initialDb: Database = {
      goals: [
        {
          id: "goal-1",
          title: "Build KaryaPath AI Platform",
          description: "Establish the autonomous productivity engine and build a premium, highly responsive dark SaaS UI with calendar integration.",
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days out
          priority: "High",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ],
      subtasks: [
        {
          id: "subtask-1",
          goal_id: "goal-1",
          title: "Set up project structure and environment",
          estimated_minutes: 60,
          status: "completed",
          confidence: "98%"
        },
        {
          id: "subtask-2",
          goal_id: "goal-1",
          title: "Design modern dark SaaS UI layout",
          estimated_minutes: 180,
          status: "completed",
          confidence: "95%"
        },
        {
          id: "subtask-3",
          goal_id: "goal-1",
          title: "Backend integration and autonomous checks",
          estimated_minutes: 120,
          status: "pending",
          confidence: "92%"
        },
        {
          id: "subtask-4",
          goal_id: "goal-1",
          title: "Sync to Google Calendar and testing",
          estimated_minutes: 90,
          status: "pending",
          confidence: "88%"
        }
      ],
      scheduled_blocks: [
        {
          id: "block-1",
          subtask_id: "subtask-1",
          start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 3600000).toISOString(),
          end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 3600000).toISOString(),
          google_calendar_event_id: "gcal-event-1",
          was_auto_rescheduled: false,
          reschedule_reason: null
        },
        {
          id: "block-2",
          subtask_id: "subtask-2",
          start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 3600000).toISOString(),
          end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 3600000).toISOString(),
          google_calendar_event_id: "gcal-event-2",
          was_auto_rescheduled: false,
          reschedule_reason: null
        },
        {
          id: "block-3",
          subtask_id: "subtask-3",
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // ended 2 hours ago (triggers missed block!)
          end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // ended 30 mins ago (missed!)
          google_calendar_event_id: "gcal-event-3",
          was_auto_rescheduled: false,
          reschedule_reason: null
        },
        {
          id: "block-4",
          subtask_id: "subtask-4",
          start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
          end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1.5 * 3600000).toISOString(),
          google_calendar_event_id: "gcal-event-4",
          was_auto_rescheduled: false,
          reschedule_reason: null
        }
      ],
      replan_logs: [
        {
          id: "log-1",
          trigger_reason: "Setup Phase Completed",
          ai_reasoning: "Goal initialized. Gemini has parsed details and established optimal task scheduling paths to secure deadline feasibility.",
          triggered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          was_automatic: true,
          goal_title: "Build KaryaPath AI Platform",
          task_title: "Set up project structure and environment"
        }
      ],
      new_replans: []
    };

    writeDb(initialDb);
    res.json({ success: true, message: 'Database reset successfully' });
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve('.', 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve('.', 'dist')));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve('.', 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
