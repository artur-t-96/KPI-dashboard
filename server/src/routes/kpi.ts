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
    // If weeks is specified, limit; otherwise fetch all data
    const data = getTrends(weeks ? parseInt(weeks as string) : undefined);
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

// Monthly conversion trend data
router.get('/monthly-trend', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        year,
        month,
        COALESCE(SUM(verifications), 0) as total_verifications,
        COALESCE(SUM(interviews), 0) as total_interviews,
        COALESCE(SUM(placements), 0) as total_placements
      FROM weekly_kpi
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 12
    `).all() as any[];

    const result = rows.map(row => ({
      year: row.year,
      month: row.month,
      totalVerifications: row.total_verifications,
      totalInterviews: row.total_interviews,
      totalPlacements: row.total_placements,
      verificationsPerPlacement: row.total_placements > 0
        ? Number((row.total_verifications / row.total_placements).toFixed(1))
        : null,
      interviewsPerPlacement: row.total_placements > 0
        ? Number((row.total_interviews / row.total_placements).toFixed(1))
        : null
    })).reverse(); // Reverse to show oldest first

    res.json(result);
  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly trend data' });
  }
});

// Weekly verification trend data (all-time)
router.get('/weekly-verification-trend', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        week_start,
        year,
        week_number,
        COALESCE(SUM(verifications), 0) as total_verifications,
        COUNT(DISTINCT employee_id) as employee_count
      FROM weekly_kpi
      GROUP BY week_start, year, week_number
      ORDER BY week_start ASC
    `).all() as any[];

    const result = rows.map(row => ({
      weekStart: row.week_start,
      year: row.year,
      weekNumber: row.week_number,
      totalVerifications: row.total_verifications,
      employeeCount: row.employee_count,
      avgVerificationsPerPerson: row.employee_count > 0
        ? Number((row.total_verifications / row.employee_count).toFixed(1))
        : 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Weekly verification trend error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly verification trend data' });
  }
});

// Yearly KPI data
router.get('/yearly', (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const rows = db.prepare(`
      SELECT
        e.id as employee_id,
        e.name,
        e.position,
        ? as year,
        COALESCE(SUM(w.verifications), 0) as total_verifications,
        COALESCE(SUM(w.cv_added), 0) as total_cv_added,
        COALESCE(SUM(w.recommendations), 0) as total_recommendations,
        COALESCE(SUM(w.interviews), 0) as total_interviews,
        COALESCE(SUM(w.placements), 0) as total_placements,
        COALESCE(SUM(w.days_worked), 0) as total_days_worked
      FROM employees e
      LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ?
      WHERE e.is_active = 1
      GROUP BY e.id, e.name, e.position
      ORDER BY e.position, e.name
    `).all(targetYear, targetYear) as any[];

    const result = rows.map(row => {
      const daysWorked = row.total_days_worked || 1;
      let targetAchievement = 0;

      if (row.position === 'Sourcer') {
        const target = daysWorked * 4;
        targetAchievement = target > 0 ? Math.round((row.total_verifications / target) * 100) : 0;
      } else if (row.position === 'Rekruter') {
        const target = daysWorked * 5;
        targetAchievement = target > 0 ? Math.round((row.total_cv_added / target) * 100) : 0;
      } else {
        // TAC - 1 placement per month, so 12 per year
        targetAchievement = row.total_placements >= 12 ? 100 : Math.round((row.total_placements / 12) * 100);
      }

      return {
        employeeId: row.employee_id,
        name: row.name,
        position: row.position,
        year: row.year,
        totalVerifications: row.total_verifications,
        totalCvAdded: row.total_cv_added,
        totalRecommendations: row.total_recommendations,
        totalInterviews: row.total_interviews,
        totalPlacements: row.total_placements,
        totalDaysWorked: row.total_days_worked,
        verificationsPerDay: daysWorked > 0 ? Number((row.total_verifications / daysWorked).toFixed(2)) : 0,
        cvPerDay: daysWorked > 0 ? Number((row.total_cv_added / daysWorked).toFixed(2)) : 0,
        targetAchievement
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Yearly KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch yearly KPI data' });
  }
});

// All-time placements leaderboard
router.get('/all-time-placements', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        e.id as employee_id,
        e.name,
        e.position,
        COALESCE(SUM(w.placements), 0) as total_placements,
        COALESCE(SUM(w.interviews), 0) as total_interviews,
        COALESCE(SUM(w.recommendations), 0) as total_recommendations,
        MIN(w.week_start) as first_week,
        MAX(w.week_start) as last_week
      FROM employees e
      LEFT JOIN weekly_kpi w ON e.id = w.employee_id
      WHERE e.is_active = 1
      GROUP BY e.id, e.name, e.position
      ORDER BY total_placements DESC, total_interviews DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('All-time placements error:', error);
    res.status(500).json({ error: 'Failed to fetch all-time placements' });
  }
});

// All-time verifications per working day
router.get('/all-time-verifications', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        e.id as employee_id,
        e.name,
        e.position,
        COALESCE(SUM(w.verifications), 0) as total_verifications,
        COALESCE(SUM(w.cv_added), 0) as total_cv_added,
        COALESCE(SUM(w.days_worked), 0) as total_days_worked
      FROM employees e
      LEFT JOIN weekly_kpi w ON e.id = w.employee_id
      WHERE e.is_active = 1
      GROUP BY e.id, e.name, e.position
      ORDER BY e.position, e.name
    `).all() as any[];

    const result = rows.map(row => {
      const daysWorked = row.total_days_worked || 1;
      return {
        employeeId: row.employee_id,
        name: row.name,
        position: row.position,
        totalVerifications: row.total_verifications,
        totalCvAdded: row.total_cv_added,
        totalDaysWorked: row.total_days_worked,
        verificationsPerDay: daysWorked > 0 ? Number((row.total_verifications / daysWorked).toFixed(2)) : 0,
        cvPerDay: daysWorked > 0 ? Number((row.total_cv_added / daysWorked).toFixed(2)) : 0
      };
    });

    // Sort by verifications per day descending
    result.sort((a, b) => b.verificationsPerDay - a.verificationsPerDay);

    res.json(result);
  } catch (error) {
    console.error('All-time verifications error:', error);
    res.status(500).json({ error: 'Failed to fetch all-time verifications' });
  }
});

export default router;
