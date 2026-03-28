const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

function buildSystemPrompt(context) {
  return `You are a friendly, expert career coach and resume advisor. The candidate just had their resume analyzed for the role "${context.jobRole}".

Resume Analysis Summary:
- Score: ${context.score}/100
- Job Match: ${context.matchPercentage}%
- Matched Skills: ${(context.skills || []).join(', ') || 'None detected'}
- Missing Skills: ${(context.missingSkills || []).join(', ') || 'None'}

Based on this analysis, help the candidate improve their resume, prepare for interviews, close skill gaps, and advance their career. Keep answers concise and actionable. Use bullet points when listing suggestions. If asked about something unrelated to career/resume, politely redirect.`;
}

async function chat(messages, context) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to backend/.env');
  }

  const systemPrompt = buildSystemPrompt(context);

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood! I have your resume analysis ready. How can I help you improve your resume and career prospects?' }] }
  ];

  for (const msg of messages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
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

module.exports = { chat };
