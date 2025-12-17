import db from '../db/connection';

export interface WeeklyKPIData {
  employeeId: number;
  name: string;
  position: string;
  weekStart: string;
  weekEnd: string;
  year: number;
  weekNumber: number;
  verifications: number;
  cvAdded: number;
  recommendations: number;
  interviews: number;
  placements: number;
  daysWorked: number;
  verificationsPerDay: number;
  cvPerDay: number;
  recommendationsPerDay: number;
  targetAchievement: number;
  points: number;
}

export interface MonthlyKPIData {
  employeeId: number;
  name: string;
  position: string;
  year: number;
  month: number;
  totalVerifications: number;
  totalCvAdded: number;
  totalRecommendations: number;
  totalInterviews: number;
  totalPlacements: number;
  totalDaysWorked: number;
  verificationsPerDay: number;
  cvPerDay: number;
  targetAchievement: number;
  points: number;
}

export function getWeeklyKPI(weekStart?: string): WeeklyKPIData[] {
  let query = `
    SELECT 
      e.id as employee_id,
      e.name,
      e.position,
      w.week_start,
      w.week_end,
      w.year,
      w.week_number,
      w.verifications,
      w.cv_added,
      w.recommendations,
      w.interviews,
      w.placements,
      w.days_worked
    FROM weekly_kpi w
    JOIN employees e ON w.employee_id = e.id
    WHERE e.is_active = 1
  `;
  
  const params: any[] = [];
  
  if (weekStart) {
    query += ' AND w.week_start = ?';
    params.push(weekStart);
  } else {
    query += ' AND w.week_start = (SELECT MAX(week_start) FROM weekly_kpi)';
  }
  
  query += ' ORDER BY e.position, e.name';
  
  const rows = db.prepare(query).all(...params) as any[];
  
  return rows.map(row => ({
    employeeId: row.employee_id,
    name: row.name,
    position: row.position,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    year: row.year,
    weekNumber: row.week_number,
    verifications: row.verifications,
    cvAdded: row.cv_added,
    recommendations: row.recommendations,
    interviews: row.interviews,
    placements: row.placements,
    daysWorked: row.days_worked,
    verificationsPerDay: row.days_worked > 0 ? Number((row.verifications / row.days_worked).toFixed(2)) : 0,
    cvPerDay: row.days_worked > 0 ? Number((row.cv_added / row.days_worked).toFixed(2)) : 0,
    recommendationsPerDay: row.days_worked > 0 ? Number((row.recommendations / row.days_worked).toFixed(2)) : 0,
    targetAchievement: calculateTargetAchievement(row),
    points: calculatePoints(row)
  }));
}

export function getMonthlyKPI(year?: number, month?: number): MonthlyKPIData[] {
  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month || currentDate.getMonth() + 1;
  
  const query = `
    SELECT 
      e.id as employee_id,
      e.name,
      e.position,
      ? as year,
      ? as month,
      COALESCE(SUM(w.verifications), 0) as total_verifications,
      COALESCE(SUM(w.cv_added), 0) as total_cv_added,
      COALESCE(SUM(w.recommendations), 0) as total_recommendations,
      COALESCE(SUM(w.interviews), 0) as total_interviews,
      COALESCE(SUM(w.placements), 0) as total_placements,
      COALESCE(SUM(w.days_worked), 0) as total_days_worked
    FROM employees e
    LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ? AND w.month = ?
    WHERE e.is_active = 1
    GROUP BY e.id, e.name, e.position
    ORDER BY e.position, e.name
  `;
  
  const rows = db.prepare(query).all(targetYear, targetMonth, targetYear, targetMonth) as any[];
  
  return rows.map(row => {
    const daysWorked = row.total_days_worked || 1;
    return {
      employeeId: row.employee_id,
      name: row.name,
      position: row.position,
      year: row.year,
      month: row.month,
      totalVerifications: row.total_verifications,
      totalCvAdded: row.total_cv_added,
      totalRecommendations: row.total_recommendations,
      totalInterviews: row.total_interviews,
      totalPlacements: row.total_placements,
      totalDaysWorked: row.total_days_worked,
      verificationsPerDay: daysWorked > 0 ? Number((row.total_verifications / daysWorked).toFixed(2)) : 0,
      cvPerDay: daysWorked > 0 ? Number((row.total_cv_added / daysWorked).toFixed(2)) : 0,
      targetAchievement: calculateMonthlyTargetAchievement(row),
      points: calculateMonthlyPoints(row)
    };
  });
}

export function getChampionsLeague(year?: number, month?: number) {
  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month || currentDate.getMonth() + 1;
  
  const query = `
    SELECT 
      e.id as employee_id,
      e.name,
      e.position,
      COALESCE(SUM(w.placements), 0) as placements,
      COALESCE(SUM(w.interviews), 0) as interviews,
      COALESCE(SUM(w.recommendations), 0) as recommendations,
      COALESCE(SUM(w.verifications), 0) as verifications,
      COALESCE(SUM(w.cv_added), 0) as cv_added,
      COALESCE(SUM(w.placements * 100), 0) as placement_points,
      COALESCE(SUM(w.interviews * 10), 0) as interview_points,
      COALESCE(SUM(w.recommendations * 2), 0) as recommendation_points,
      COALESCE(SUM(w.verifications), 0) as verification_points,
      COALESCE(SUM(w.cv_added), 0) as cv_points,
      COALESCE(SUM(w.placements * 100 + w.interviews * 10 + w.recommendations * 2 + w.verifications + w.cv_added), 0) as total_points
    FROM employees e
    LEFT JOIN weekly_kpi w ON e.id = w.employee_id AND w.year = ? AND w.month = ?
    WHERE e.is_active = 1
    GROUP BY e.id, e.name, e.position
    ORDER BY total_points DESC
  `;
  
  const rows = db.prepare(query).all(targetYear, targetMonth) as any[];
  
  return rows.map((row, index) => ({
    rank: index + 1,
    employeeId: row.employee_id,
    name: row.name,
    position: row.position,
    placements: row.placements,
    interviews: row.interviews,
    recommendations: row.recommendations,
    verifications: row.verifications,
    cvAdded: row.cv_added,
    placementPoints: row.placement_points,
    interviewPoints: row.interview_points,
    recommendationPoints: row.recommendation_points,
    verificationPoints: row.verification_points,
    cvPoints: row.cv_points,
    totalPoints: row.total_points
  }));
}

export function getTrends(weeks?: number) {
  // If no weeks specified, fetch all available data
  const query = weeks
    ? `
      SELECT
        w.week_start,
        w.week_number,
        w.year,
        e.position,
        SUM(w.verifications) as total_verifications,
        SUM(w.cv_added) as total_cv_added,
        SUM(w.recommendations) as total_recommendations,
        SUM(w.interviews) as total_interviews,
        SUM(w.placements) as total_placements,
        SUM(w.days_worked) as total_days_worked,
        COUNT(DISTINCT e.id) as employee_count
      FROM weekly_kpi w
      JOIN employees e ON w.employee_id = e.id
      WHERE e.is_active = 1
      AND w.week_start >= date((SELECT MAX(week_start) FROM weekly_kpi), '-' || ? || ' weeks')
      GROUP BY w.week_start, w.week_number, w.year, e.position
      ORDER BY w.week_start, e.position
    `
    : `
      SELECT
        w.week_start,
        w.week_number,
        w.year,
        e.position,
        SUM(w.verifications) as total_verifications,
        SUM(w.cv_added) as total_cv_added,
        SUM(w.recommendations) as total_recommendations,
        SUM(w.interviews) as total_interviews,
        SUM(w.placements) as total_placements,
        SUM(w.days_worked) as total_days_worked,
        COUNT(DISTINCT e.id) as employee_count
      FROM weekly_kpi w
      JOIN employees e ON w.employee_id = e.id
      WHERE e.is_active = 1
      GROUP BY w.week_start, w.week_number, w.year, e.position
      ORDER BY w.week_start, e.position
    `;

  return weeks ? db.prepare(query).all(weeks) : db.prepare(query).all();
}

export function getAvailableWeeks() {
  const query = `
    SELECT DISTINCT week_start, week_end, year, week_number
    FROM weekly_kpi
    ORDER BY week_start DESC
    LIMIT 52
  `;
  return db.prepare(query).all();
}

export function getAvailableMonths() {
  const query = `
    SELECT DISTINCT year, month
    FROM weekly_kpi
    ORDER BY year DESC, month DESC
    LIMIT 24
  `;
  return db.prepare(query).all();
}

function calculateTargetAchievement(row: any): number {
  const daysWorked = row.days_worked || 1;
  
  if (row.position === 'Sourcer') {
    const target = daysWorked * 4;
    return target > 0 ? Math.round((row.verifications / target) * 100) : 0;
  } else if (row.position === 'Rekruter') {
    const target = daysWorked * 5;
    return target > 0 ? Math.round((row.cv_added / target) * 100) : 0;
  } else {
    return row.placements > 0 ? 100 : 0;
  }
}

function calculateMonthlyTargetAchievement(row: any): number {
  const daysWorked = row.total_days_worked || 1;
  
  if (row.position === 'Sourcer') {
    const target = daysWorked * 4;
    return target > 0 ? Math.round((row.total_verifications / target) * 100) : 0;
  } else if (row.position === 'Rekruter') {
    const target = daysWorked * 5;
    return target > 0 ? Math.round((row.total_cv_added / target) * 100) : 0;
  } else {
    return row.total_placements >= 1 ? 100 : Math.round(row.total_placements * 100);
  }
}

function calculatePoints(row: any): number {
  return (
    (row.placements || 0) * 100 +
    (row.interviews || 0) * 10 +
    (row.recommendations || 0) * 2 +
    (row.verifications || 0) +
    (row.cv_added || 0)
  );
}

function calculateMonthlyPoints(row: any): number {
  return (
    (row.total_placements || 0) * 100 +
    (row.total_interviews || 0) * 10 +
    (row.total_recommendations || 0) * 2 +
    (row.total_verifications || 0) +
    (row.total_cv_added || 0)
  );
}
