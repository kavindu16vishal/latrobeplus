import express from 'express';
import OpenAI from 'openai';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, history } = req.body;
    
    // Check if real API key exists
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      // Return a simulated AI tutor response
      setTimeout(() => {
        res.json({ 
          reply: `I am your AI Learning Assistant! I noticed you are studying Databases right now. To help you improve on "${message}", I recommend reviewing the latest lecture on Normalisation. *(Note: Add a real OpenAI API Key to .env to unlock actual GPT-4 responses)*` 
        });
      }, 1000);
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a supportive, knowledgeable AI tutor for a La Trobe University student. Your goal is to help them understand their subject matter, identify weaknesses, and provide actionable study advice. Keep responses concise and encouraging." },
        ...(history || []),
        { role: "user", content: message }
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

export default router;
