import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = express.Router();

const getOpenAI = () =>
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// ═══════════════════════════════════════════════════════════════
// STUDY STREAK — ping on every meaningful interaction
// ═══════════════════════════════════════════════════════════════

router.post('/streak/ping', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = await query(`SELECT * FROM study_streaks WHERE student_id = ?`, [userId]);

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO study_streaks (student_id, last_activity_date, current_streak, longest_streak) VALUES (?, ?, 1, 1)`,
        [userId, today]
      );
    } else {
      const row = existing.rows[0];
      if (row.last_activity_date === today) return res.json({ streak: row.current_streak });
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = row.last_activity_date === yesterday ? row.current_streak + 1 : 1;
      const longest = Math.max(row.longest_streak, newStreak);
      await query(
        `UPDATE study_streaks SET last_activity_date = ?, current_streak = ?, longest_streak = ? WHERE student_id = ?`,
        [today, newStreak, longest, userId]
      );
    }
    const updated = await query(`SELECT * FROM study_streaks WHERE student_id = ?`, [userId]);
    res.json({ streak: updated.rows[0].current_streak, longest: updated.rows[0].longest_streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

router.get('/streak', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(`SELECT * FROM study_streaks WHERE student_id = ?`, [req.user!.id]);
    if (result.rows.length === 0) return res.json({ streak: 0, longest: 0 });
    const row = result.rows[0];
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const active = row.last_activity_date === today || row.last_activity_date === yesterday;
    res.json({ streak: active ? row.current_streak : 0, longest: row.longest_streak, last: row.last_activity_date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PEER BENCHMARKS — anonymous percentile vs cohort
// ═══════════════════════════════════════════════════════════════

router.get('/benchmarks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const subjects = await query(`
      SELECT s.id, s.subject_code,
             AVG(sr.score) as my_score
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
      GROUP BY s.id, s.subject_code
    `, [userId]);

    const result = await Promise.all(subjects.rows.map(async (subj: any) => {
      const cohort = await query(`
        SELECT AVG(sr.score) as avg_score
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE a.subject_id = ?
      `, [subj.id]);
      const below = await query(`
        SELECT COUNT(DISTINCT sr.student_id) as cnt
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE a.subject_id = ?
        GROUP BY sr.student_id
        HAVING AVG(sr.score) < ?
      `, [subj.id, subj.my_score]);
      const total = await query(`
        SELECT COUNT(DISTINCT sr.student_id) as cnt
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE a.subject_id = ?
      `, [subj.id]);
      const totalCount = total.rows[0]?.cnt ?? 1;
      const belowCount = below.rows.length;
      const percentile = Math.round((belowCount / totalCount) * 100);
      return {
        subject: subj.subject_code,
        my_score: Number(Number(subj.my_score).toFixed(1)),
        cohort_avg: Number(Number(cohort.rows[0]?.avg_score ?? 0).toFixed(1)),
        percentile,
      };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GRADE CALCULATOR — what-if WAM predictor
// ═══════════════════════════════════════════════════════════════

router.get('/grade-calculator', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const subjects = await query(`
      SELECT DISTINCT s.id, s.subject_code, s.subject_name
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
    `, [userId]);

    const result = await Promise.all(subjects.rows.map(async (subj: any) => {
      const assessments = await query(`
        SELECT a.id, a.assessment_name, a.assessment_type, a.weight,
               sr.score as current_score
        FROM assessments a
        LEFT JOIN student_results sr ON sr.assessment_id = a.id AND sr.student_id = ?
        WHERE a.subject_id = ?
        ORDER BY a.assessment_name
      `, [userId, subj.id]);
      return { ...subj, assessments: assessments.rows };
    }));

    const wamResult = await query(`SELECT AVG(score) as wam FROM student_results WHERE student_id = ?`, [userId]);
    res.json({ subjects: result, current_wam: Number(wamResult.rows[0]?.wam ?? 0).toFixed(1) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load grade calculator' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SILO / COMPETENCY MAP
// ═══════════════════════════════════════════════════════════════

router.get('/silos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const subjects = await query(`
      SELECT DISTINCT s.id, s.subject_code, s.subject_name
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ?
    `, [userId]);

    const result = await Promise.all(subjects.rows.map(async (subj: any) => {
      const silos = await query(`SELECT id, silo_code, silo_description FROM silos WHERE subject_id = ?`, [subj.id]);
      const subjectScore = await query(`
        SELECT AVG(sr.score) as avg_score
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE a.subject_id = ? AND sr.student_id = ?
      `, [subj.id, userId]);
      const avg = Number(subjectScore.rows[0]?.avg_score ?? 0);

      const siloData = silos.rows.map((silo: any) => ({
        id: silo.id,
        code: silo.silo_code,
        description: silo.silo_description,
        mastery: avg,
        level: avg >= 80 ? 'Advanced' : avg >= 65 ? 'Proficient' : avg >= 50 ? 'Developing' : 'Beginning',
      }));

      return { subject_code: subj.subject_code, subject_name: subj.subject_name, avg_score: avg, silos: siloData };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load competency map' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT CALENDAR — upcoming deadlines
// ═══════════════════════════════════════════════════════════════

router.get('/calendar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const assessments = await query(`
      SELECT a.id, a.assessment_name, a.assessment_type, a.weight, a.due_date,
             s.subject_code, s.subject_name,
             sr.score as submitted_score
      FROM assessments a
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN student_results sr ON sr.assessment_id = a.id AND sr.student_id = ?
      WHERE a.subject_id IN (
        SELECT DISTINCT a2.subject_id FROM student_results sr2
        JOIN assessments a2 ON sr2.assessment_id = a2.id WHERE sr2.student_id = ?
      )
      ORDER BY a.due_date ASC NULLS LAST, s.subject_code ASC
    `, [userId, userId]);
    res.json(assessments.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load calendar' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FLASHCARD GENERATOR
// ═══════════════════════════════════════════════════════════════

router.post('/flashcards/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject_code, topic } = req.body;
    if (!subject_code) return res.status(400).json({ error: 'subject_code is required' });

    const perfData = await query(`
      SELECT AVG(sr.score) as avg_score, GROUP_CONCAT(sr.feedback_comment, ' | ') as feedback
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE s.subject_code = ? AND sr.student_id = ?
    `, [subject_code, userId]);

    const avg = Number(perfData.rows[0]?.avg_score ?? 60).toFixed(1);
    const feedback = perfData.rows[0]?.feedback ?? '';
    const cardTopic = topic || subject_code;

    const openai = getOpenAI();
    let cards: { question: string; answer: string }[] = [];

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Generate 10 concise flashcards for a university student studying "${cardTopic}" in ${subject_code}. Their current average is ${avg}%. Feedback from assessments: "${feedback.substring(0, 400)}". Return ONLY a JSON array: [{"question":"...","answer":"..."}]` }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      cards = parsed.flashcards ?? parsed.cards ?? parsed.questions ?? [];
    } else {
      cards = [
        { question: `What is a key concept in ${cardTopic}?`, answer: `Review your ${subject_code} lecture notes and past assessment feedback for core definitions and principles.` },
        { question: `What are the main components of ${cardTopic}?`, answer: `Break down the topic into sub-areas covered in your ${subject_code} curriculum.` },
        { question: `How do you apply ${cardTopic} in practice?`, answer: `Work through past exam questions and assessment tasks related to ${subject_code}.` },
        { question: `What mistakes should you avoid in ${cardTopic}?`, answer: `Review your feedback comments from ${subject_code} assessments — these highlight your specific weak points.` },
        { question: `How does ${cardTopic} connect to other topics in ${subject_code}?`, answer: `Map this topic to your subject's learning outcomes and silo framework.` },
      ];
    }

    const result = await query(
      `INSERT INTO flashcard_sets (student_id, subject_code, topic, cards) VALUES (?, ?, ?, ?)`,
      [userId, subject_code, cardTopic, JSON.stringify(cards)]
    );
    res.status(201).json({ id: result.lastID, subject_code, topic: cardTopic, cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

router.get('/flashcards', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, subject_code, topic, created_at FROM flashcard_sets WHERE student_id = ? ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flashcard sets' });
  }
});

router.get('/flashcards/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM flashcard_sets WHERE id = ? AND student_id = ?`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const row = result.rows[0];
    res.json({ ...row, cards: JSON.parse(row.cards) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flashcard set' });
  }
});

router.delete('/flashcards/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM flashcard_sets WHERE id = ? AND student_id = ?`, [req.params.id, req.user!.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ═══════════════════════════════════════════════════════════════
// EXAM PREP COACH
// ═══════════════════════════════════════════════════════════════

router.post('/exam-prep', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject_code, exam_date, focus_areas } = req.body;
    if (!subject_code) return res.status(400).json({ error: 'subject_code required' });

    const perf = await query(`
      SELECT AVG(sr.score) as avg_score,
             GROUP_CONCAT(sr.feedback_comment, ' | ') as feedback,
             COUNT(sr.id) as result_count
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE s.subject_code = ? AND sr.student_id = ?
    `, [subject_code, userId]);

    const avg = Number(perf.rows[0]?.avg_score ?? 60).toFixed(1);
    const feedback = perf.rows[0]?.feedback ?? '';
    const daysUntil = exam_date
      ? Math.max(0, Math.ceil((new Date(exam_date).getTime() - Date.now()) / 86400000))
      : 14;

    const openai = getOpenAI();

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `You are an exam coach for a university student. Subject: ${subject_code}. Current average: ${avg}%. Days until exam: ${daysUntil}. Focus areas: ${focus_areas || 'general review'}. Assessment feedback: "${feedback.substring(0, 500)}".

Return ONLY this JSON structure:
{
  "study_sessions": [{"day": 1, "focus": "...", "tasks": ["...", "..."], "duration": "2 hours"}],
  "practice_questions": [{"question": "...", "model_answer": "...", "marks": 5}],
  "key_topics": ["topic1", "topic2"],
  "exam_tips": ["tip1", "tip2", "tip3"]
}

Generate 5 study sessions, 5 practice questions, 5 key topics, 3 exam tips. Base everything on the student's actual weak areas from feedback.` }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return res.json({ subject_code, exam_date, days_until: daysUntil, avg_score: avg, ...parsed });
    }

    // Fallback
    res.json({
      subject_code, exam_date, days_until: daysUntil, avg_score: avg,
      study_sessions: Array.from({ length: 5 }, (_, i) => ({
        day: i + 1,
        focus: `${subject_code} — Review Session ${i + 1}`,
        tasks: ['Re-read lecture notes', 'Attempt past exam questions', 'Review assessment feedback'],
        duration: '2 hours',
      })),
      practice_questions: [
        { question: `Explain a core concept in ${subject_code} and give an example.`, model_answer: 'Answer based on your lecture notes and textbook.', marks: 5 },
        { question: `What are the key differences between the main topics in ${subject_code}?`, model_answer: 'Compare and contrast using definitions from course materials.', marks: 8 },
        { question: `Describe a real-world application of ${subject_code} content.`, model_answer: 'Draw on case studies discussed in lectures.', marks: 6 },
      ],
      key_topics: ['Core definitions', 'Key frameworks', 'Applied examples', 'Assessment criteria', 'Common mistakes'],
      exam_tips: ['Review your feedback from all past assessments before the exam.', 'Practice writing answers under timed conditions.', 'Focus extra time on your weakest-scoring assessment areas.'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate exam prep plan' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ASSIGNMENT FEEDBACK — AI draft review
// ═══════════════════════════════════════════════════════════════

router.post('/assignment-feedback', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject_code, assignment_text, assessment_name } = req.body;
    if (!subject_code || !assignment_text) return res.status(400).json({ error: 'subject_code and assignment_text required' });
    if (assignment_text.length < 50) return res.status(400).json({ error: 'Please provide at least 50 characters of text' });

    const openai = getOpenAI();

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `You are an academic tutor reviewing a draft assignment for ${subject_code}${assessment_name ? ` (${assessment_name})` : ''}. Provide constructive feedback.

Draft text:
"""
${assignment_text.substring(0, 3000)}
"""

Return ONLY this JSON:
{
  "overall_rating": "Excellent|Good|Adequate|Needs Work|Poor",
  "estimated_grade": "HD|D|C|P|N",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": [{"section": "...", "issue": "...", "suggestion": "..."}],
  "structure_feedback": "2 sentences on structure and flow",
  "content_feedback": "2 sentences on depth and accuracy",
  "next_steps": ["action1", "action2", "action3"]
}` }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return res.json(parsed);
    }

    // Fallback
    const wordCount = assignment_text.split(/\s+/).length;
    res.json({
      overall_rating: 'Adequate',
      estimated_grade: 'C',
      strengths: ['You have provided a written response addressing the topic.', 'The submission demonstrates engagement with the subject matter.'],
      improvements: [
        { section: 'Introduction', issue: 'Could be clearer', suggestion: 'State your main argument explicitly in the first paragraph.' },
        { section: 'Body', issue: 'Depth of analysis', suggestion: 'Support each claim with specific evidence or examples from course materials.' },
        { section: 'Conclusion', issue: 'Synthesis', suggestion: 'Ensure your conclusion ties back to your introduction and summarises key points.' },
      ],
      structure_feedback: `Your submission is ${wordCount} words. Ensure it meets the required length and has clear introduction, body, and conclusion sections.`,
      content_feedback: 'Review your course materials and past feedback to strengthen your arguments and add more specific examples.',
      next_steps: ['Add citations to support your claims.', 'Review the marking rubric and check each criterion is addressed.', 'Read your draft aloud to catch awkward phrasing.'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STUDENT NOTES
// ═══════════════════════════════════════════════════════════════

router.get('/notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { subject_id } = req.query;
    let sql = `SELECT n.id, n.title, n.content, n.ai_summary, n.created_at, n.updated_at, n.subject_id, s.subject_code
               FROM student_notes n LEFT JOIN subjects s ON n.subject_id = s.id
               WHERE n.student_id = ?`;
    const params: any[] = [req.user!.id];
    if (subject_id) { sql += ` AND n.subject_id = ?`; params.push(subject_id); }
    sql += ` ORDER BY n.updated_at DESC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, subject_id } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const result = await query(
      `INSERT INTO student_notes (student_id, subject_id, title, content) VALUES (?, ?, ?, ?)`,
      [req.user!.id, subject_id || null, title, content]
    );
    res.status(201).json({ id: result.lastID, title, content, subject_id: subject_id || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/notes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, content, subject_id } = req.body;
    await query(
      `UPDATE student_notes SET title = COALESCE(?, title), content = COALESCE(?, content), subject_id = COALESCE(?, subject_id), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND student_id = ?`,
      [title || null, content || null, subject_id || null, req.params.id, req.user!.id]
    );
    res.json({ message: 'Note updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/notes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM student_notes WHERE id = ? AND student_id = ?`, [req.params.id, req.user!.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.post('/notes/:id/summarize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const note = await query(`SELECT * FROM student_notes WHERE id = ? AND student_id = ?`, [req.params.id, req.user!.id]);
    if (note.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    const { title, content } = note.rows[0];

    const openai = getOpenAI();
    let summary = '';

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Summarise these study notes in 3-5 bullet points, highlighting key concepts and any gaps to review:\n\nTitle: ${title}\n\n${content.substring(0, 3000)}` }],
      });
      summary = completion.choices[0].message.content || '';
    } else {
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
      summary = sentences.slice(0, 3).map((s: string) => `• ${s.trim()}.`).join('\n') || `• Review the key concepts from: ${title}.`;
    }

    await query(`UPDATE student_notes SET ai_summary = ? WHERE id = ?`, [summary, req.params.id]);
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to summarise note' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SMART STUDY PLANNER — dynamic AI weekly plan
// ═══════════════════════════════════════════════════════════════

router.get('/study-planner', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const perf = await query(`
      SELECT s.subject_code, s.subject_name, AVG(sr.score) as avg_score,
             GROUP_CONCAT(sr.feedback_comment, ' | ') as feedback
      FROM student_results sr
      JOIN assessments a ON sr.assessment_id = a.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE sr.student_id = ? GROUP BY s.id ORDER BY avg_score ASC
    `, [userId]);

    const upcoming = await query(`
      SELECT a.assessment_name, a.due_date, s.subject_code
      FROM assessments a JOIN subjects s ON a.subject_id = s.id
      WHERE a.due_date >= date('now') AND a.subject_id IN (
        SELECT DISTINCT a2.subject_id FROM student_results sr2
        JOIN assessments a2 ON sr2.assessment_id = a2.id WHERE sr2.student_id = ?
      ) ORDER BY a.due_date ASC LIMIT 5
    `, [userId]);

    if (perf.rows.length === 0) {
      return res.json({ plan: [], message: 'No assessment data yet — your personalised plan will appear once results are loaded.' });
    }

    const openai = getOpenAI();
    const perfSummary = perf.rows.map((p: any) => `${p.subject_code}: ${Number(p.avg_score).toFixed(1)}%`).join(', ');
    const deadlineSummary = upcoming.rows.map((u: any) => `${u.subject_code} ${u.assessment_name} due ${u.due_date}`).join(', ');

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Create a 7-day study plan for a student. Subject scores: ${perfSummary}. Upcoming deadlines: ${deadlineSummary || 'none'}. Prioritise weakest subjects and upcoming deadlines. Return ONLY JSON: {"plan": [{"day": "Monday", "date_offset": 0, "sessions": [{"subject": "...", "task": "...", "duration": "1h", "type": "Revision|Practice|Assignment|Reading"}]}]}` }],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      return res.json(parsed);
    }

    // Fallback: deterministic plan based on scores
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weak = perf.rows.filter((p: any) => Number(p.avg_score) < 70);
    const plan = days.map((day, i) => ({
      day,
      date_offset: i,
      sessions: weak.length > 0 ? [
        { subject: weak[i % weak.length].subject_code, task: `Review core concepts and attempt practice problems`, duration: '1.5h', type: 'Revision' },
        ...(i % 2 === 0 ? [{ subject: weak[(i + 1) % weak.length]?.subject_code ?? weak[0].subject_code, task: 'Work through past exam questions', duration: '1h', type: 'Practice' }] : []),
      ] : [{ subject: perf.rows[0].subject_code, task: 'Maintain and extend your current knowledge', duration: '1h', type: 'Reading' }],
    }));
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

export default router;
