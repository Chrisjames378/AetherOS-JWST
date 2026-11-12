import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserObservations, addObservation } from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI on server with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Auth Sync Endpoint - Links Firebase Auth User to Cloud SQL PostgreSQL
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { uid, email, name, picture } = req.user;
    const dbUser = await getOrCreateUser(uid, email || '', name || '', picture || '');
    res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Failed to sync user with database:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// 2. Observations API Routes (Cloud SQL PostgreSQL + Firebase Auth)
app.get('/api/observations', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const dbUser = await getOrCreateUser(req.user.uid, req.user.email || '');
    const logs = await getUserObservations(dbUser.id);
    res.json({ observations: logs });
  } catch (error: any) {
    console.error('Failed to fetch observations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch observations' });
  }
});

app.post('/api/observations', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { targetName, targetId, category, notes, wavelengthBand, snrRatio } = req.body;

    if (!targetName || !notes) {
      return res.status(400).json({ error: 'Target name and notes are required' });
    }

    const dbUser = await getOrCreateUser(req.user.uid, req.user.email || '');
    const log = await addObservation(
      dbUser.id,
      targetName,
      targetId || 'jwst_target',
      category || 'astronomy',
      notes,
      wavelengthBand,
      snrRatio
    );
    res.json({ success: true, observation: log });
  } catch (error: any) {
    console.error('Failed to save observation:', error);
    res.status(500).json({ error: error.message || 'Failed to save observation' });
  }
});

// 3. Gemini Live API / Voice Assistant Endpoint
app.post('/api/gemini/voice-assistant', async (req, res) => {
  try {
    const { prompt, conversationHistory, systemPrompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Check Settings > Secrets.',
      });
    }

    const defaultSystem =
      'You are AetherOS Voice AI, an advanced real-time astrophysics assistant on the NASA James Webb Space Telescope (JWST) flight deck. ' +
      'Keep responses concise, informative, scientific yet engaging, and under 3 sentences for real-time speech output.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...(conversationHistory || []),
        { role: 'user', parts: [{ text: prompt || 'Identify current target telemetry.' }] },
      ],
      config: {
        systemInstruction: systemPrompt || defaultSystem,
      },
    });

    res.json({
      text: response.text || 'Telemetry acknowledged, Commander.',
    });
  } catch (error: any) {
    console.error('Gemini Voice API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process voice request' });
  }
});

// Mount Vite middleware in development or serve static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});
