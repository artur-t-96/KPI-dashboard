import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateReport } from '../services/reportService';

const router = Router();

// In-memory storage for reports (in production, use Redis or database)
const reportStorage = new Map<string, {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  expiresAt: Date;
  userId: number;
}>();

// Clean up expired reports every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [id, report] of reportStorage.entries()) {
    if (report.expiresAt < now) {
      reportStorage.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Generate report
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { query, conversationHistory } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await generateReport({ query, conversationHistory });

    // If it's a complete report, save it
    if (result.type === 'report' && result.reportTitle !== 'Blad') {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

      reportStorage.set(reportId, {
        id: reportId,
        title: result.reportTitle || 'Raport KPI',
        content: result.content,
        createdAt: now,
        expiresAt: expiresAt,
        userId: req.user!.id
      });

      return res.json({
        ...result,
        reportId,
        expiresAt: expiresAt.toISOString()
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get user's reports
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const userReports = [];

    for (const report of reportStorage.values()) {
      if (report.userId === req.user!.id && report.expiresAt > now) {
        userReports.push({
          id: report.id,
          title: report.title,
          content: report.content,
          createdAt: report.createdAt.toISOString(),
          expiresAt: report.expiresAt.toISOString(),
          remainingMinutes: Math.round((report.expiresAt.getTime() - now.getTime()) / 60000)
        });
      }
    }

    // Sort by creation date, newest first
    userReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(userReports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = reportStorage.get(id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found or expired' });
    }

    if (report.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    if (report.expiresAt < now) {
      reportStorage.delete(id);
      return res.status(404).json({ error: 'Report expired' });
    }

    res.json({
      id: report.id,
      title: report.title,
      content: report.content,
      createdAt: report.createdAt.toISOString(),
      expiresAt: report.expiresAt.toISOString(),
      remainingMinutes: Math.round((report.expiresAt.getTime() - now.getTime()) / 60000)
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Delete report
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = reportStorage.get(id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    reportStorage.delete(id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
