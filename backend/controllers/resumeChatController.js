const jwt = require('jsonwebtoken');
const ResumeChatSession = require('../models/ResumeChatSession');
const geminiService = require('../services/geminiService');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

function getUserIdFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    return decoded.id;
  } catch { return null; }
}

// POST /chat/resume/start
exports.startChat = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { jobRole, score, matchPercentage, skills, missingSkills } = req.body;

    const session = await ResumeChatSession.create({
      userId,
      jobRole: jobRole || '',
      score: score || 0,
      matchPercentage: matchPercentage || 0,
      skills: skills || [],
      missingSkills: missingSkills || [],
      messages: []
    });

    // Generate an opening message from the assistant
    const context = { jobRole, score, matchPercentage, skills, missingSkills };
    let greeting;
    try {
      greeting = await geminiService.chat(
        [{ role: 'user', text: 'Give me a brief overview of my resume analysis and what I should focus on improving.' }],
        context
      );
    } catch {
      greeting = `Hi! I've reviewed your resume analysis for ${jobRole || 'your target role'}. Your score is ${score || 0}/100 with a ${matchPercentage || 0}% job match. Ask me anything about improving your resume, closing skill gaps, or interview preparation!`;
    }

    session.messages.push({ role: 'assistant', text: greeting });
    await session.save();

    res.json({ success: true, session });
  } catch (e) {
    console.error('startChat error:', e);
    res.status(500).json({ error: e.message });
  }
};

// POST /chat/resume/message
exports.sendMessage = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { sessionId, text } = req.body;
    if (!sessionId || !text?.trim()) return res.status(400).json({ error: 'sessionId and text are required' });

    const session = await ResumeChatSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    session.messages.push({ role: 'user', text: text.trim() });

    const context = {
      jobRole: session.jobRole,
      score: session.score,
      matchPercentage: session.matchPercentage,
      skills: session.skills,
      missingSkills: session.missingSkills
    };

    let reply;
    try {
      reply = await geminiService.chat(session.messages, context);
    } catch (e) {
      reply = 'Sorry, I encountered an issue generating a response. Please try again.';
      console.error('Gemini error:', e.message);
    }

    session.messages.push({ role: 'assistant', text: reply });
    await session.save();

    res.json({ success: true, message: { role: 'assistant', text: reply } });
  } catch (e) {
    console.error('sendMessage error:', e);
    res.status(500).json({ error: e.message });
  }
};

// GET /chat/resume/session/:id
exports.getSession = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const session = await ResumeChatSession.findOne({ _id: req.params.id, userId });
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    res.json({ success: true, session });
  } catch (e) {
    console.error('getSession error:', e);
    res.status(500).json({ error: e.message });
  }
};

// GET /chat/resume/history
exports.getHistory = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await ResumeChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .select('jobRole score matchPercentage createdAt')
      .limit(20);

    res.json({ success: true, sessions });
  } catch (e) {
    console.error('getHistory error:', e);
    res.status(500).json({ error: e.message });
  }
};
