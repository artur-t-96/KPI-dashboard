import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { 
  getWeeklyKPI, 
  getMonthlyKPI, 
  getChampionsLeague, 
  getTrends,
  getAvailableWeeks,
  getAvailableMonths
} from '../services/kpiCalculator';

const router = Router();

router.get('/weekly', (req: Request, res: Response) => {
  try {
    const { week } = req.query;
    const data = getWeeklyKPI(week as string);
    res.json(data);
  } catch (error) {
    console.error('Weekly KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly KPI data' });
  }
});

router.get('/monthly', (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = getMonthlyKPI(
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    );
    res.json(data);
  } catch (error) {
    console.error('Monthly KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly KPI data' });
  }
});

router.get('/champions', (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    const data = getChampionsLeague(
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined
    );
    res.json(data);
  } catch (error) {
    console.error('Champions League error:', error);
    res.status(500).json({ error: 'Failed to fetch Champions League data' });
  }
});

router.get('/trends', (req: Request, res: Response) => {
  try {
    const { weeks } = req.query;
    const data = getTrends(weeks ? parseInt(weeks as string) : 12);
    res.json(data);
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

router.get('/weeks', (req: Request, res: Response) => {
  try {
    const data = getAvailableWeeks();
    res.json(data);
  } catch (error) {
    console.error('Weeks error:', error);
    res.status(500).json({ error: 'Failed to fetch available weeks' });
  }
});

router.get('/months', (req: Request, res: Response) => {
  try {
    const data = getAvailableMonths();
    res.json(data);
  } catch (error) {
    console.error('Months error:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
});

router.get('/employees', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, position, is_active, created_at
      FROM employees
      ORDER BY position, name
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('Employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.get('/employee/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { weeks } = req.query;
    const weeksCount = weeks ? parseInt(weeks as string) : 12;
    
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const kpiData = db.prepare(`
      SELECT * FROM weekly_kpi
      WHERE employee_id = ?
      ORDER BY week_start DESC
      LIMIT ?
    `).all(id, weeksCount);
    
    res.json({ employee, kpiData });
  } catch (error) {
    console.error('Employee KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch employee KPI data' });
  }
});

router.get('/summary', (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    const monthlyTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(verifications), 0) as verifications,
        COALESCE(SUM(cv_added), 0) as cv_added,
        COALESCE(SUM(recommendations), 0) as recommendations,
        COALESCE(SUM(interviews), 0) as interviews,
        COALESCE(SUM(placements), 0) as placements,
        COALESCE(SUM(days_worked), 0) as days_worked
      FROM weekly_kpi
      WHERE year = ? AND month = ?
    `).get(year, month);
    
    const positionBreakdown = db.prepare(`
      SELECT 
        e.position,
        COUNT(DISTINCT e.id) as employee_count,
        COALESCE(SUM(w.verifications), 0) as verifications,
        COALESCE(SUM(w.cv_added), 0) as cv_added,
        COALESCE(SUM(w.recommendations), 0) as recommendations,
        COALESCE(SUM(w.interviews), 0) as interviews,
        COALESCE(SUM(w.placements), 0) as placements
      FROM employees e
      LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ? AND w.month = ?
      WHERE e.is_active = 1
      GROUP BY e.position
    `).all(year, month);
    
    const weeklyChange = db.prepare(`
      WITH current_week AS (
        SELECT 
          COALESCE(SUM(verifications), 0) as verifications,
          COALESCE(SUM(cv_added), 0) as cv_added,
          COALESCE(SUM(placements), 0) as placements
        FROM weekly_kpi
        WHERE week_start = (SELECT MAX(week_start) FROM weekly_kpi)
      ),
      previous_week AS (
        SELECT 
          COALESCE(SUM(verifications), 0) as verifications,
          COALESCE(SUM(cv_added), 0) as cv_added,
          COALESCE(SUM(placements), 0) as placements
        FROM weekly_kpi
        WHERE week_start = (SELECT MAX(week_start) FROM weekly_kpi WHERE week_start < (SELECT MAX(week_start) FROM weekly_kpi))
      )
      SELECT 
        cw.verifications as current_verifications,
        cw.cv_added as current_cv,
        cw.placements as current_placements,
        pw.verifications as previous_verifications,
        pw.cv_added as previous_cv,
        pw.placements as previous_placements
      FROM current_week cw, previous_week pw
    `).get();
    
    res.json({ monthlyTotals, positionBreakdown, weeklyChange });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

export default router;
