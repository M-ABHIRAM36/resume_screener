const jwt = require('jsonwebtoken');
const RoadmapChatSession = require('../models/RoadmapChatSession');
const roadmapService = require('../services/roadmapService');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

function getUserIdFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    return decoded.id;
  } catch { return null; }
}

// GET /api/chat/roadmap/roles — list available roadmap roles
exports.getRoles = (req, res) => {
  const roles = roadmapService.scanRoadmaps();
  res.json({ success: true, roles });
};

// POST /api/chat/roadmap/start
exports.startChat = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { roadmapRole } = req.body;
    if (!roadmapRole?.trim()) return res.status(400).json({ error: 'roadmapRole is required' });

    const session = await RoadmapChatSession.create({
      userId,
      roadmapRole: roadmapRole.trim(),
      messages: []
    });

    // Generate a greeting from the AI
    const knowledge = roadmapService.getRoadmapKnowledge(roadmapRole.trim());
    const roleName = knowledge
      ? knowledge.title
      : roadmapRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let greeting;
    try {
      greeting = await roadmapService.chat(
        [{ role: 'user', text: `Give me a brief overview of the ${roleName} learning roadmap and what I should focus on first.` }],
        roadmapRole.trim()
      );
    } catch {
      const steps = knowledge ? knowledge.steps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n') : '';
      greeting = `Welcome! I'm your learning mentor for the ${roleName} path. ${steps ? `Here's where to start:\n${steps}\n\n` : ''}Ask me anything about what to learn, recommended resources, or project ideas!`;
    }

    session.messages.push({ role: 'assistant', text: greeting });
    await session.save();

    res.json({ success: true, session });
  } catch (e) {
    console.error('roadmap startChat error:', e);
    res.status(500).json({ error: e.message });
  }
};

// POST /api/chat/roadmap/message
exports.sendMessage = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { sessionId, text } = req.body;
    if (!sessionId || !text?.trim()) return res.status(400).json({ error: 'sessionId and text are required' });

    const session = await RoadmapChatSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    session.messages.push({ role: 'user', text: text.trim() });

    let reply;
    try {
      reply = await roadmapService.chat(session.messages, session.roadmapRole);
    } catch (e) {
      reply = 'Sorry, I encountered an issue generating a response. Please try again.';
      console.error('Gemini roadmap error:', e.message);
    }

    session.messages.push({ role: 'assistant', text: reply });
    await session.save();

    res.json({ success: true, message: { role: 'assistant', text: reply } });
  } catch (e) {
    console.error('roadmap sendMessage error:', e);
    res.status(500).json({ error: e.message });
  }
};

// GET /api/chat/roadmap/session/:id
exports.getSession = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const session = await RoadmapChatSession.findOne({ _id: req.params.id, userId });
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    res.json({ success: true, session });
  } catch (e) {
    console.error('roadmap getSession error:', e);
    res.status(500).json({ error: e.message });
  }
};

// GET /api/chat/roadmap/history
exports.getHistory = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await RoadmapChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .select('roadmapRole createdAt')
      .limit(20);

    res.json({ success: true, sessions });
  } catch (e) {
    console.error('roadmap getHistory error:', e);
    res.status(500).json({ error: e.message });
  }
};
