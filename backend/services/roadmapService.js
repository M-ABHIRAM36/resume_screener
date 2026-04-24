const fs = require('fs');
const path = require('path');
const roadmapKnowledge = require('../data/roadmapKnowledge.json');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

/**
 * Scan public/roadmaps directory for available .png roadmap images.
 * Returns array of { slug, name, image, hasKnowledge }.
 */
function scanRoadmaps() {
  const frontendRoadmapDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'roadmaps');
  const legacyRoadmapDir = path.join(__dirname, '..', '..', 'public', 'roadmaps');
  const roadmapDir = fs.existsSync(frontendRoadmapDir) ? frontendRoadmapDir : legacyRoadmapDir;
  let files = [];
  try {
    files = fs.readdirSync(roadmapDir).filter(f => f.endsWith('.png'));
  } catch {
    return [];
  }

  return files.map(f => {
    const slug = f.replace('.png', '');
    const name = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      slug,
      name,
      image: `/roadmaps/${f}`,
      hasKnowledge: !!roadmapKnowledge[slug]
    };
  });
}

/**
 * Get roadmap knowledge text for a given role slug.
 */
function getRoadmapKnowledge(slug) {
  const data = roadmapKnowledge[slug];
  if (!data) return null;
  return {
    title: data.title,
    steps: data.steps
  };
}

/**
 * Build the system prompt for roadmap learning assistant.
 */
function buildRoadmapPrompt(roleSlug) {
  const knowledge = getRoadmapKnowledge(roleSlug);
  const roleName = knowledge
    ? knowledge.title
    : roleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  let stepsText = '';
  if (knowledge) {
    stepsText = knowledge.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  }

  return `You are a career learning mentor and expert educator.

User wants roadmap guidance for: ${roleName}

${stepsText ? `Roadmap steps:\n${stepsText}\n` : ''}
Answer the user's question clearly and give learning guidance. Be specific with resource suggestions, practical tips, and project ideas. Keep answers concise and well-structured using bullet points or numbered lists. If the user asks something unrelated to learning or career development, politely redirect them.`;
}

/**
 * Chat with Gemini for roadmap guidance.
 */
async function chat(messages, roleSlug) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to backend/.env');
  }

  const systemPrompt = buildRoadmapPrompt(roleSlug);

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: `I'm your learning mentor for the ${roleSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} path. Ask me anything about what to learn, resources, projects, or career advice!` }] }
  ];

  for (const msg of messages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('Empty response from Gemini');
  return reply;
}

module.exports = { scanRoadmaps, getRoadmapKnowledge, chat };
