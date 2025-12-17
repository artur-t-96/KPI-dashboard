-- KPI Dashboard Database Schema (SQLite)
-- B2B Network S.A.

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
    uploaded_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_dates ON weekly_kpi(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_employee ON weekly_kpi(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_month ON weekly_kpi(year, month);
CREATE INDEX IF NOT EXISTS idx_weekly_kpi_year_week ON weekly_kpi(year, week_number);
