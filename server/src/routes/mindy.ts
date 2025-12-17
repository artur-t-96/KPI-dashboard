import { Router, Request, Response } from 'express';
import { getMindyResponse } from '../services/claudeService';

const router = Router();

// Get Mindy response (tip + emotion)
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await getMindyResponse();
    res.json(response);
  } catch (error) {
    console.error('Mindy error:', error);
    res.status(500).json({ 
      error: 'Failed to get Mindy response',
      emotion: 'neutral',
      tip: '🤖 Przepraszam, mam chwilowe problemy. Spróbuj ponownie za chwilę!'
    });
  }
});

// Get just emotion state
router.get('/emotion', async (req: Request, res: Response) => {
  try {
    const response = await getMindyResponse();
    res.json({ emotion: response.emotion });
  } catch (error) {
    res.json({ emotion: 'neutral' });
  }
});

// Get just tip
router.get('/tip', async (req: Request, res: Response) => {
  try {
    const response = await getMindyResponse();
    res.json({ tip: response.tip });
  } catch (error) {
    res.json({ tip: '🤖 Cześć! Jestem Mindy, Twoja asystentka KPI!' });
  }
});

export default router;
