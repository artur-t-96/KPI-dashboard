import * as XLSX from 'xlsx';
import db from '../db/connection';

// CV data completely excluded from system - Excel CV column is ignored during import

interface KPIRow {
  name: string;
  position: string;
  weekStart: Date;
  weekEnd: Date;
  daysWorked: number;
  verifications: number;
  recommendations: number;
  interviews: number;
  placements: number;
}

interface ProcessResult {
  success: boolean;
  rowsProcessed: number;
  rowsSuccess: number;
  rowsFailed: number;
  errors: string[];
}

export function processExcelFile(buffer: Buffer, uploadedBy: number): ProcessResult {
  const result: ProcessResult = {
    success: true,
    rowsProcessed: 0,
    rowsSuccess: 0,
    rowsFailed: 0,
    errors: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Skip header row
    const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      result.rowsProcessed++;

      try {
        const kpiRow = parseRow(row, i + 2);
        saveKPIData(kpiRow, uploadedBy);
        result.rowsSuccess++;
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    result.success = result.rowsFailed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`File processing error: ${error.message}`);
  }

  return result;
}

function parseRow(row: any[], rowIndex: number): KPIRow {
  // Excel columns: name, position, weekStart, weekEnd, daysWorked, verifications, cvAdded (IGNORED), recommendations, interviews, placements
  const [name, position, weekStart, weekEnd, daysWorked, verifications, _cvIgnored, recommendations, interviews, placements] = row;

  if (!name || typeof name !== 'string') {
    throw new Error('Missing or invalid name');
  }

  if (!position || !['Sourcer', 'Rekruter', 'TAC'].includes(position)) {
    throw new Error(`Invalid position "${position}". Must be: Sourcer, Rekruter, or TAC`);
  }

  let startDate: Date;
  let endDate: Date;

  if (weekStart instanceof Date) {
    startDate = weekStart;
  } else if (typeof weekStart === 'string') {
    startDate = new Date(weekStart);
  } else if (typeof weekStart === 'number') {
    const parsed = XLSX.SSF.parse_date_code(weekStart) as any;
    startDate = new Date(parsed.y, parsed.m - 1, parsed.d);
  } else {
    throw new Error('Invalid week start date');
  }

  if (weekEnd instanceof Date) {
    endDate = weekEnd;
  } else if (typeof weekEnd === 'string') {
    endDate = new Date(weekEnd);
  } else if (typeof weekEnd === 'number') {
    const parsed = XLSX.SSF.parse_date_code(weekEnd) as any;
    endDate = new Date(parsed.y, parsed.m - 1, parsed.d);
  } else {
    throw new Error('Invalid week end date');
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const days = parseInt(daysWorked) || 0;
  if (days < 0 || days > 7) {
    throw new Error('Days worked must be between 0 and 7');
  }

  return {
    name: name.trim(),
    position: position.trim(),
    weekStart: startDate,
    weekEnd: endDate,
    daysWorked: days,
    verifications: Math.max(0, parseInt(verifications) || 0),
    recommendations: Math.max(0, parseInt(recommendations) || 0),
    interviews: Math.max(0, parseInt(interviews) || 0),
    placements: Math.max(0, parseInt(placements) || 0)
  };
}

function saveKPIData(kpi: KPIRow, uploadedBy: number): void {
  // Get or create employee
  let employee = db.prepare('SELECT id FROM employees WHERE name = ?').get(kpi.name) as { id: number } | undefined;

  if (!employee) {
    const result = db.prepare('INSERT INTO employees (name, position) VALUES (?, ?)').run(kpi.name, kpi.position);
    employee = { id: result.lastInsertRowid as number };
  }

  // Calculate week number and year
  const year = kpi.weekStart.getFullYear();
  const month = kpi.weekStart.getMonth() + 1;
  const weekNumber = getWeekNumber(kpi.weekStart);

  // Format dates for SQLite
  const weekStartStr = kpi.weekStart.toISOString().split('T')[0];
  const weekEndStr = kpi.weekEnd.toISOString().split('T')[0];

  // Insert new KPI data or accumulate to existing data (incremental/append mode)
  // Historical data is never overwritten - new values are added to existing values
  // CV column set to 0 - CV data is excluded from the system
  db.prepare(`
    INSERT INTO weekly_kpi
    (employee_id, week_start, week_end, year, week_number, month, verifications, cv_added, recommendations, interviews, placements, days_worked, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id, week_start) DO UPDATE SET
      verifications = verifications + excluded.verifications,
      recommendations = recommendations + excluded.recommendations,
      interviews = interviews + excluded.interviews,
      placements = placements + excluded.placements,
      days_worked = days_worked + excluded.days_worked,
      uploaded_by = excluded.uploaded_by
  `).run(
    employee.id, weekStartStr, weekEndStr, year, weekNumber, month,
    kpi.verifications, kpi.recommendations, kpi.interviews, kpi.placements, kpi.daysWorked, uploadedBy
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
