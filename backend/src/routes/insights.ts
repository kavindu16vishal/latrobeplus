import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

// Get AI insights for the logged-in student (cached 24h)
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    // Check for a recent cached insight (within 24 hours)
    const cached = await query(
      `SELECT * FROM ai_insights WHERE student_id = ? AND generated_at > datetime('now', '-24 hours') ORDER BY generated_at DESC LIMIT 1`,
      [userId]
    );

    if (cached.rows.length > 0) {
      const insight = cached.rows[0];
      return res.json({
        gaps: JSON.parse(insight.gaps),
        studyPlan: JSON.parse(insight.study_plan),
        feedbackAnalysis: insight.feedback_analysis,
        recommendation: insight.recommendation,
        cached: true
      });
    }

    // Fetch student performance with feedback text
    const performanceResult = await query(`
      SELECT
        s.subject_code as subject,
        s.subject_name,
        AVG(sr.score) as score,
        GROUP_CONCAT(sr.feedback_comment, ' | ') as feedback_comments
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
      GROUP BY s.subject_code, s.id
      ORDER BY score ASC
    `, [userId]);

    const wamResult = await query(
      `SELECT AVG(score) as wam FROM student_results WHERE student_id = ?`,
      [userId]
    );

    const userResult = await query(
      `SELECT full_name FROM users WHERE id = ?`,
      [userId]
    );

    const wam = wamResult.rows[0]?.wam || 0;
    const studentName = userResult.rows[0]?.full_name || 'Student';
    const performance = performanceResult.rows;

    // No data yet — return empty state
    if (performance.length === 0) {
      return res.json({
        gaps: [],
        studyPlan: [],
        feedbackAnalysis: 'No assessment data available yet. Please wait for your results to be uploaded by your admin.',
        recommendation: 'Your academic results have not been loaded yet. Check back after your assessments have been graded.',
        cached: false
      });
    }

    let status = 'On Track';
    if (wam < 50) status = 'At Risk';
    else if (wam < 65) status = 'Attention Needed';

    // No real OpenAI key — derive insights directly from the data
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const weak = performance.filter((p: any) => Number(p.score) < 70).sort((a: any, b: any) => Number(a.score) - Number(b.score));
      const strong = performance.filter((p: any) => Number(p.score) >= 70);

      const gaps = weak.map((p: any) => ({
        topic: p.subject,
        score: Number(Number(p.score).toFixed(1)),
        impact: Number(p.score) < 50 ? 'High' : Number(p.score) < 60 ? 'Medium' : 'Low',
        description: `Your average score of ${Number(p.score).toFixed(1)}% in ${p.subject} is below the passing threshold. Review all assessment feedback and revisit foundational concepts.`
      }));

      const days = ['Monday', 'Wednesday', 'Friday'];
      const studyPlan = weak.slice(0, 3).map((p: any, i: number) => ({
        day: days[i],
        task: `Review core concepts and practice problems for ${p.subject}`,
        time: '1 hour',
        type: 'Revision'
      }));

      const strongList = strong.map((s: any) => s.subject).join(', ');
      const weakList = weak.map((s: any) => s.subject).join(' and ');
      const feedbackAnalysis = `${strongList ? `You are performing well in ${strongList}, showing solid conceptual understanding. ` : ''}${weak.length > 0 ? `However, ${weakList} require immediate attention based on your current scores.` : 'Keep maintaining your current performance levels.'}`;

      const recommendation = `With a WAM of ${Number(wam).toFixed(1)}%, you are currently ${status.toLowerCase()}. ${weak.length > 0 ? `Prioritise ${weak[0].subject} — it is your most critical gap and will have the highest impact on your overall WAM if improved.` : 'Continue your strong performance across all subjects.'}`;

      await query(
        `INSERT INTO ai_insights (student_id, gaps, study_plan, feedback_analysis, recommendation) VALUES (?, ?, ?, ?, ?)`,
        [userId, JSON.stringify(gaps), JSON.stringify(studyPlan), feedbackAnalysis, recommendation]
      );

      return res.json({ gaps, studyPlan, feedbackAnalysis, recommendation, cached: false });
    }

    // Full AI-powered analysis with OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const perfSummary = performance
      .map((p: any) => `- ${p.subject} (${p.subject_name}): ${Number(p.score).toFixed(1)}%${p.feedback_comments ? `. Feedback snippets: ${p.feedback_comments.substring(0, 300)}` : ''}`)
      .join('\n');

    const prompt = `You are an educational AI analyst for La Trobe University. Analyse this student's academic data and provide structured, grounded learning guidance.

Student: ${studentName}
Overall WAM: ${Number(wam).toFixed(1)}%
Academic Status: ${status}

Subject Performance:
${perfSummary}

Respond ONLY with this JSON structure (no extra text):
{
  "gaps": [
    {
      "topic": "subject code or specific concept",
      "score": <number>,
      "impact": "High" | "Medium" | "Low",
      "description": "specific description based on their score and feedback"
    }
  ],
  "studyPlan": [
    {
      "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday",
      "task": "specific actionable study task",
      "time": "e.g. 45 mins",
      "type": "Theory" | "Practice" | "Resource" | "Revision"
    }
  ],
  "feedbackAnalysis": "2-3 sentence pattern analysis based on their feedback and scores",
  "recommendation": "2-3 sentence personalised recommendation"
}

Rules:
- Only flag subjects with score below 70% as gaps
- Sort gaps by severity (lowest score first)
- Create a 3-5 day study plan targeting weakest subjects
- Base all output strictly on the provided data — no hallucination`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    await query(
      `INSERT INTO ai_insights (student_id, gaps, study_plan, feedback_analysis, recommendation) VALUES (?, ?, ?, ?, ?)`,
      [userId, JSON.stringify(parsed.gaps || []), JSON.stringify(parsed.studyPlan || []), parsed.feedbackAnalysis || '', parsed.recommendation || '']
    );

    res.json({
      gaps: parsed.gaps || [],
      studyPlan: parsed.studyPlan || [],
      feedbackAnalysis: parsed.feedbackAnalysis || '',
      recommendation: parsed.recommendation || '',
      cached: false
    });

  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Force-refresh insights by clearing the cache
router.post('/refresh', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM ai_insights WHERE student_id = ?`, [req.user?.id]);
    res.json({ message: 'Insights cache cleared. Fetch /me to regenerate.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh insights' });
  }
});

export default router;
