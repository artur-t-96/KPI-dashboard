import db from './connection';
import bcrypt from 'bcryptjs';

// Schema embedded directly to avoid file read issues in production
const schema = `
-- Users table (for admin authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    position TEXT NOT NULL CHECK (position IN ('Sourcer', 'Rekruter', 'TAC')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Weekly KPI data
CREATE TABLE IF NOT EXISTS weekly_kpi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    year INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Metrics
    verifications INTEGER DEFAULT 0 CHECK (verifications >= 0),
    cv_added INTEGER DEFAULT 0 CHECK (cv_added >= 0),
    recommendations INTEGER DEFAULT 0 CHECK (recommendations >= 0),
    interviews INTEGER DEFAULT 0 CHECK (interviews >= 0),
    placements INTEGER DEFAULT 0 CHECK (placements >= 0),
    days_worked INTEGER DEFAULT 0 CHECK (days_worked >= 0 AND days_worked <= 7),

    -- Metadata
    uploaded_at TEXT DEFAULT (datetime('now')),
    uploaded_by INTEGER REFERENCES users(id),

    UNIQUE(employee_id, week_start)
);

-- Upload logs
CREATE TABLE IF NOT EXISTS upload_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    rows_processed INTEGER,
    rows_success INTEGER,
    rows_failed INTEGER,
    errors TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TEXT DEFAULT (datetime('now')),
    upload_type TEXT DEFAULT 'body-leasing'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_dates ON weekly_kpi(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_employee ON weekly_kpi(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_month ON weekly_kpi(year, month);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_year_week ON weekly_kpi(year, week_number);
`;

async function initDatabase() {
  console.log('🚀 Initializing SQLite database...');

  try {
    // Execute each statement separately
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        db.exec(statement);
      }
    }

    console.log('✅ Database schema created successfully');

    // Check if admin exists
    const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

    if (!adminExists) {
      // Create admin user
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
        'admin', passwordHash, 'admin'
      );

      console.log(`👤 Admin user created (username: admin, password: ${adminPassword})`);
    } else {
      console.log('👤 Admin user already exists');
    }

    // Insert sample employees if not exist
    const employees = [
      ['Anna Kowalska', 'Sourcer'],
      ['Jan Nowak', 'Sourcer'],
      ['Michał Lewandowski', 'Sourcer'],
      ['Maria Wiśniewska', 'Rekruter'],
      ['Piotr Zieliński', 'Rekruter'],
      ['Karolina Wójcik', 'Rekruter'],
      ['Katarzyna Dąbrowska', 'TAC'],
      ['Tomasz Kamiński', 'TAC'],
    ];

    const insertEmployee = db.prepare('INSERT OR IGNORE INTO employees (name, position) VALUES (?, ?)');

    for (const [name, position] of employees) {
      insertEmployee.run(name, position);
    }

    console.log('👥 Sample employees added');

    // Insert sample KPI data
    const sampleKPI = [
      // Week 2 (Jan 6-12, 2025)
      { name: 'Anna Kowalska', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 19, cv: 0, recommendations: 4, interviews: 1, placements: 0 },
      { name: 'Jan Nowak', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 21, cv: 0, recommendations: 4, interviews: 2, placements: 0 },
      { name: 'Michał Lewandowski', week_start: '2025-01-06', week_end: '2025-01-12', days: 4, verifications: 16, cv: 0, recommendations: 3, interviews: 1, placements: 0 },
      { name: 'Maria Wiśniewska', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 0, cv: 26, recommendations: 6, interviews: 3, placements: 0 },
      { name: 'Piotr Zieliński', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 0, cv: 27, recommendations: 5, interviews: 2, placements: 1 },
      { name: 'Karolina Wójcik', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 0, cv: 24, recommendations: 4, interviews: 2, placements: 0 },
      { name: 'Katarzyna Dąbrowska', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 0, cv: 0, recommendations: 7, interviews: 4, placements: 0 },
      { name: 'Tomasz Kamiński', week_start: '2025-01-06', week_end: '2025-01-12', days: 5, verifications: 0, cv: 0, recommendations: 5, interviews: 4, placements: 1 },

      // Week 3 (Jan 13-19, 2025)
      { name: 'Anna Kowalska', week_start: '2025-01-13', week_end: '2025-01-19', days: 5, verifications: 22, cv: 0, recommendations: 5, interviews: 2, placements: 0 },
      { name: 'Jan Nowak', week_start: '2025-01-13', week_end: '2025-01-19', days: 4, verifications: 18, cv: 0, recommendations: 3, interviews: 1, placements: 0 },
      { name: 'Michał Lewandowski', week_start: '2025-01-13', week_end: '2025-01-19', days: 5, verifications: 20, cv: 0, recommendations: 4, interviews: 2, placements: 1 },
      { name: 'Maria Wiśniewska', week_start: '2025-01-13', week_end: '2025-01-19', days: 5, verifications: 0, cv: 28, recommendations: 7, interviews: 4, placements: 1 },
      { name: 'Piotr Zieliński', week_start: '2025-01-13', week_end: '2025-01-19', days: 5, verifications: 0, cv: 25, recommendations: 4, interviews: 2, placements: 0 },
      { name: 'Karolina Wójcik', week_start: '2025-01-13', week_end: '2025-01-19', days: 4, verifications: 0, cv: 22, recommendations: 5, interviews: 3, placements: 0 },
      { name: 'Katarzyna Dąbrowska', week_start: '2025-01-13', week_end: '2025-01-19', days: 5, verifications: 0, cv: 0, recommendations: 8, interviews: 5, placements: 1 },
      { name: 'Tomasz Kamiński', week_start: '2025-01-13', week_end: '2025-01-19', days: 4, verifications: 0, cv: 0, recommendations: 6, interviews: 3, placements: 0 },
    ];

    const getEmployee = db.prepare('SELECT id FROM employees WHERE name = ?');
    const insertKPI = db.prepare(`
      INSERT OR REPLACE INTO weekly_kpi
      (employee_id, week_start, week_end, year, week_number, month, verifications, cv_added, recommendations, interviews, placements, days_worked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const kpi of sampleKPI) {
      const emp = getEmployee.get(kpi.name) as { id: number } | undefined;
      if (emp) {
        const weekStart = new Date(kpi.week_start);
        const year = weekStart.getFullYear();
        const month = weekStart.getMonth() + 1;
        const weekNumber = getWeekNumber(weekStart);

        insertKPI.run(
          emp.id, kpi.week_start, kpi.week_end, year, weekNumber, month,
          kpi.verifications, kpi.cv, kpi.recommendations, kpi.interviews, kpi.placements, kpi.days
        );
      }
    }

    console.log('📊 Sample KPI data added');
    console.log('✨ Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

initDatabase();
