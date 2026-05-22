import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user?.id;

    // Fetch student context to ground the AI response
    const [userResult, wamResult, performanceResult] = await Promise.all([
      query(`SELECT full_name FROM users WHERE id = ?`, [userId]),
      query(`SELECT AVG(score) as wam FROM student_results WHERE student_id = ?`, [userId]),
      query(`
        SELECT s.subject_code as subject, AVG(sr.score) as score
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        JOIN subjects s ON a.subject_id = s.id
        WHERE sr.student_id = ?
        GROUP BY s.subject_code
        ORDER BY score ASC
      `, [userId])
    ]);

    const wam = wamResult.rows[0]?.wam;
    const studentName = userResult.rows[0]?.full_name || 'Student';
    const performance = performanceResult.rows;

    // Build context block if data exists
    let studentContext = '';
    if (wam !== null && wam !== undefined && performance.length > 0) {
      const weak = performance.filter((p: any) => Number(p.score) < 70)
        .map((p: any) => `${p.subject} (${Number(p.score).toFixed(1)}%)`);
      const strong = performance.filter((p: any) => Number(p.score) >= 70)
        .map((p: any) => `${p.subject} (${Number(p.score).toFixed(1)}%)`);

      let status = 'On Track';
      if (wam < 50) status = 'At Risk';
      else if (wam < 65) status = 'Attention Needed';

      studentContext = `

=== Student Academic Profile ===
Name: ${studentName}
Current WAM: ${Number(wam).toFixed(1)}% | Status: ${status}
${weak.length > 0 ? `Areas needing attention: ${weak.join(', ')}` : ''}
${strong.length > 0 ? `Strong areas: ${strong.join(', ')}` : ''}
================================

When answering, reference the student's specific performance where relevant. If they ask about a subject they are struggling with, be targeted and practical. Be encouraging but honest.`;
    }

    const systemPrompt = `You are a supportive, knowledgeable AI tutor for a La Trobe University student. Your goal is to help them understand subject matter, identify knowledge gaps, and provide actionable study advice. Keep responses concise and encouraging.${studentContext}`;

    // Fallback when no real API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const contextNote = wam !== null && wam !== undefined
        ? ` I can see your current WAM is ${Number(wam).toFixed(1)}% — `
        : ' ';
      const weakSubject = performance.find((p: any) => Number(p.score) < 70);
      const tip = weakSubject
        ? `I recommend focusing on ${weakSubject.subject} where your score is ${Number(weakSubject.score).toFixed(1)}%.`
        : `Keep reviewing your course materials and checking your recent assessment feedback.`;

      setTimeout(() => {
        res.json({
          reply: `Hi ${studentName}!${contextNote}${tip} You asked: "${message}".`
        });
      }, 600);
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: message }
      ],
    });

    res.json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

export default router;
